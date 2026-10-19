import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const app = fileURLToPath(new URL("../", import.meta.url));
const destination = path.join(app, "public/domains");
const cache = path.join(app, "node_modules/.cache");
await mkdir(cache, { recursive: true });
await mkdir(destination, { recursive: true });
const temporary = await mkdtemp(path.join(cache, "ocs-vector-art-"));
try {
  await writeFile(path.join(temporary, "package.json"), '{"type":"commonjs"}');
  const source = await readFile(path.join(app, "src/components/console/art/CodingWorld.tsx"), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } });
  await writeFile(path.join(temporary, "CodingWorld.js"), output.outputText);
  const World = require(path.join(temporary, "CodingWorld.js")).default;
  for (const crop of [false, true]) {
    const svg = renderToStaticMarkup(React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: crop ? 512 : 1600, height: crop ? 640 : 900, viewBox: crop ? "760 140 800 730" : "0 0 1600 900", preserveAspectRatio: "xMidYMid slice", fill: "none" }, React.createElement(World)));
    await writeFile(path.join(destination, `competitive-coding${crop ? "-cover" : ""}.svg`), svg + "\n");
  }
  // A system library symbol; actual cases load their own cover artwork.
  const colors = ["#d2ae6d", "#d5af7d", "#d9b281", "#e9b292", "#bca3d9"];
  const spines = colors.map((color, i) => `<g transform="translate(${420 + i * 145} 240) rotate(${(i - 2) * 4} 55 210)"><rect width="110" height="420" rx="8" fill="#172b43" stroke="${color}" stroke-width="5"/><path d="M16 30h78M16 390h78" stroke="${color}" stroke-width="12"/></g>`).join("");
  await writeFile(path.join(destination, "collection.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><path fill="#0b1428" d="M0 0h1600v900H0z"/>${spines}</svg>\n`);
  console.log("Built CC vector editions and the system library symbol. Other domains use supplied cover art.");
} finally { await rm(temporary, { recursive: true, force: true }); }
