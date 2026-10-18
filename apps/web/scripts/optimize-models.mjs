import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

// Always read the uncompressed source assets so reruns do not compound quantization.
const sourcesDirectory = fileURLToPath(new URL('../assets/', import.meta.url));
const outputDirectory = fileURLToPath(new URL('../public/models/', import.meta.url));
const meshoptExtension = 'EXT_meshopt_compression';
const models = [
  { name: 'ps5', source: 'ps5.glb' },
  { name: 'dualsense', source: 'playstation_5_dualsense (1).glb' },
];

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
    'meshopt.decoder': MeshoptDecoder,
  });

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function readGlbJSON(bytes) {
  if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2) {
    throw new Error('Expected a glTF 2.0 binary file.');
  }
  if (bytes.readUInt32LE(16) !== 0x4e4f534a) {
    throw new Error('Expected the first GLB chunk to contain JSON.');
  }
  const length = bytes.readUInt32LE(12);
  return JSON.parse(bytes.subarray(20, 20 + length).toString('utf8'));
}

function triangleCount(document) {
  return document.getRoot().listMeshes().reduce((total, mesh) => total + mesh.listPrimitives()
    .reduce((sum, primitive) => sum + (primitive.getIndices()?.getCount()
      ?? primitive.getAttribute('POSITION')?.getCount() ?? 0) / 3, 0), 0);
}

for (const { name, source } of models) {
  const sourcePath = path.join(sourcesDirectory, source);
  const outputPath = path.join(outputDirectory, `${name}-optimized.glb`);
  const sourceBytes = await readFile(sourcePath);
  const sourceHash = digest(sourceBytes);
  const document = await io.read(sourcePath);
  const sourceTriangles = triangleCount(document);
  const textureHashes = document.getRoot().listTextures().map((texture) => digest(texture.getImage())).sort();

  // Preserve source geometry detail and image bytes. The controller's buttons and
  // curved grips are visible at close range, so no unverified simplification is used.
  await document.transform(
    weld(),
    dedup(),
    prune({ keepSolidTextures: true, keepExtras: true }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );
  await io.write(outputPath, document);

  const outputBytes = await readFile(outputPath);
  const json = readGlbJSON(outputBytes);
  const compressedViews = (json.bufferViews ?? [])
    .filter((view) => view.extensions?.[meshoptExtension]).length;
  if (!json.extensionsRequired?.includes(meshoptExtension) || compressedViews === 0) {
    throw new Error(`${name}: output does not require active Meshopt decoding.`);
  }

  // Reading back through the registered WASM decoder verifies real compressed data,
  // rather than trusting an extension name in JSON alone.
  const decoded = await io.read(outputPath);
  if (triangleCount(decoded) !== sourceTriangles) {
    throw new Error(`${name}: triangle count changed during compression.`);
  }
  const decodedTextureHashes = decoded.getRoot().listTextures()
    .map((texture) => digest(texture.getImage())).sort();
  if (JSON.stringify(textureHashes) !== JSON.stringify(decodedTextureHashes)) {
    throw new Error(`${name}: embedded image bytes changed unexpectedly.`);
  }
  if (digest(await readFile(sourcePath)) !== sourceHash) {
    throw new Error(`${name}: the source file was modified.`);
  }

  const outputSize = (await stat(outputPath)).size;
  console.log(JSON.stringify({
    model: name,
    sourceBytes: sourceBytes.length,
    outputBytes: outputSize,
    reductionPercent: Number((100 * (1 - outputSize / sourceBytes.length)).toFixed(1)),
    triangles: sourceTriangles,
    textures: textureHashes.length,
    compressedBufferViews: compressedViews,
    extensionsRequired: json.extensionsRequired,
    decodedWithMeshoptWasm: true,
    sourceUnchanged: true,
  }));
}
