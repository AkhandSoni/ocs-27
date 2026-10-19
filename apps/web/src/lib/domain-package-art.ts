import { DOMAINS } from "./domain-sequence.ts";
import { domainCoverArt } from "./domain-cover-art.ts";

export type PackageCanvas = HTMLCanvasElement & { disposeArtwork?: () => void };

/** Printed packaging uses the same artwork and crop as the actual console title.
 * Labels are print on a physical case/disc, never flattened application controls.
 */
export function paintPackage(index: number, disc = false, onPaint = () => {}) {
  const canvas = document.createElement("canvas") as PackageCanvas;
  canvas.width = 1024;
  canvas.height = disc ? 1024 : 1280;
  const ctx = canvas.getContext("2d")!;
  const domain = DOMAINS[index];
  const art = domain.id === "competitive-coding" ? null : domainCoverArt[domain.id];
  ctx.scale(2, 2);
  const image = document.createElement("img");
  let loaded = false;
  let disposed = false;
  function paint(notify = true) {
    if (disposed) return;
    ctx.fillStyle = "#0b1428";
    ctx.fillRect(0, 0, 512, disc ? 512 : 640);
    if (loaded && art) {
      const [x, y, width, height] = art.crop;
      ctx.fillStyle = art.background; ctx.fillRect(0, 0, 512, 640);
      const scale = art.fit === "meet" ? Math.min(512 / width, 640 / height) : Math.max(512 / width, 640 / height);
      const dw = width * scale, dh = height * scale;
      ctx.drawImage(image, x, y, width, height, (512 - dw) / 2, (640 - dh) / 2 + (disc ? -64 : 0), dw, dh);
    } else if (loaded) ctx.drawImage(image, 0, disc ? -64 : 0, 512, 640);
    const shade = ctx.createLinearGradient(0, disc ? 260 : 370, 0, disc ? 512 : 640);
    shade.addColorStop(0, "#07102000"); shade.addColorStop(0.55, "#071020e8"); shade.addColorStop(1, "#071020");
    ctx.fillStyle = shade;
    ctx.fillRect(0, disc ? 260 : 370, 512, 280);
    if (!disc) {
      ctx.fillStyle = "#eee9dd"; ctx.fillRect(0, 0, 512, 54);
      ctx.fillStyle = "#172132"; ctx.font = "bold 26px Arial"; ctx.textAlign = "left"; ctx.fillText("ACM-VIT", 22, 36);
      ctx.font = "bold 12px Arial"; ctx.textAlign = "right"; ctx.fillText("OCS ’27", 488, 33);
    }
    ctx.textAlign = "left";
    ctx.fillStyle = domain.color; ctx.font = "bold 11px monospace";
    ctx.fillText(`DOMAIN ${String(index + 1).padStart(2, "0")}  /  OCS ’27`, 26, disc ? 330 : 457);
    ctx.fillStyle = "#f2f1ed"; ctx.font = `bold ${domain.lines.length > 1 ? 39 : 52}px Arial`;
    domain.lines.forEach((line, row) => ctx.fillText(line.toUpperCase(), 24, (disc ? 379 : 510) + row * 43, 430));
    ctx.fillStyle = "#c3cad3"; ctx.font = "11px Arial";
    ctx.fillText("Because Technology Matters", 26, disc ? 467 : 613);
    if (!disc) {
      // The exposed edge remains legible while the five cases overlap.
      ctx.fillStyle = domain.color; ctx.fillRect(458, 54, 54, 586);
      ctx.save(); ctx.translate(478, 110); ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#132034"; ctx.font = "bold 20px Arial";
      ctx.fillText(domain.name.toUpperCase(), 0, 0, 465); ctx.restore();
    } else {
      ctx.strokeStyle = "#e9e7ddaa"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(256, 256, 249, 0, Math.PI * 2); ctx.stroke();
    }
    if (notify) onPaint();
  }
  image.onload = () => { loaded = true; paint(); };
  image.onerror = () => { image.onload = image.onerror = null; };
  image.src = art?.src ?? `/domains/${domain.id}-cover.svg`;
  canvas.dataset.domain = domain.id;
  // First paint is synchronous, so all labels remain available if art fails.
  // The callback only reports the later image decode, after a texture exists.
  paint(false);
  canvas.disposeArtwork = () => { disposed = true; image.onload = image.onerror = null; image.removeAttribute("src"); };
  return canvas;
}
