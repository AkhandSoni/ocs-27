import * as THREE from "three";

/** Correct the source model's material response without changing its geometry. */
export function finishDeviceMaterial(material: THREE.Material, device: "ps5" | "controller") {
  if (!(material instanceof THREE.MeshStandardMaterial)) return;
  material.envMapIntensity = .72;
  material.transparent = false;
  material.depthWrite = true;
  if (device === "ps5") {
    switch (material.name) {
      case "Glass_-_Heavy_Color":
        // The centre is glossy black plastic, not an 80% metallic surface.
        material.color.set("#101218"); material.metalness = 0; material.roughness = .19;
        break;
      case "Plastic_-_Textured_-_Regular":
        material.color.set("#eeeeef"); material.metalness = 0; material.roughness = .46;
        break;
      case "Plastic_-_Translucent_Glossy_Blue":
        material.color.set("#1d70b6"); material.metalness = 0; material.roughness = .27;
        material.emissive.set("#1265cd"); material.emissiveIntensity = .28;
        break;
      case "Plastic_-_Translucent_Matte_Gray":
        material.color.set("#14151a"); material.metalness = 0; material.roughness = .7;
        break;
      case "Steel_-_Satin":
        material.metalness = .85; material.roughness = .33;
        break;
    }
  }
  material.needsUpdate = true;
}
