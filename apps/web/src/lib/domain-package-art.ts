import { DOMAINS } from "./domain-sequence.ts";

// Original print artwork: one visual identity shared by the sleeve and disc.
const EDITIONS = [
  { ink: "#62edff", dark: "#031a29", title: ["TECH"], code: "SYSTEMS / ENGINEERING" },
  { ink: "#d3a7ff", dark: "#190d30", title: ["RESEARCH"], code: "DISCOVERY / EXPERIMENTS" },
  { ink: "#c8ff63", dark: "#102015", title: ["COMPETITIVE", "CODING"], code: "ALGORITHMS / STRATEGY" },
  { ink: "#ffa1be", dark: "#300f28", title: ["DESIGN"], code: "VISUAL / INTERACTION" },
  { ink: "#ffd18b", dark: "#271d12", title: ["MANAGEMENT"], code: "PEOPLE / OPERATIONS" },
];

function art(ctx: CanvasRenderingContext2D, index: number) {
  const { ink, dark } = EDITIONS[index];
  const bg = ctx.createLinearGradient(0, 0, 512, 640);
  bg.addColorStop(0, dark); bg.addColorStop(.7, "#05080f"); bg.addColorStop(1, dark);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 640);
  const glow = ctx.createRadialGradient(280, 270, 8, 280, 270, 320);
  glow.addColorStop(0, `${ink}60`); glow.addColorStop(1, `${ink}00`);
  ctx.fillStyle = glow; ctx.fillRect(0, 50, 512, 560);
  ctx.lineWidth = .6; ctx.strokeStyle = `${ink}18`;
  for (let x = 0; x < 512; x += 32) { ctx.beginPath(); ctx.moveTo(x, 64); ctx.lineTo(x, 640); ctx.stroke(); }
  for (let y = 64; y < 640; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
  ctx.save(); ctx.translate(256, 280);
  ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
  if (index === 0) {
    // A luminous processor suspended over an isometric circuit city.
    ctx.save(); ctx.scale(1, .58); ctx.rotate(-Math.PI / 4);
    for (let layer = 5; layer >= 0; layer--) {
      ctx.fillStyle = layer ? "#082e42" : "#173e54";
      ctx.fillRect(-104 + layer * 8, -104 + layer * 8, 208, 208);
      ctx.strokeRect(-104 + layer * 8, -104 + layer * 8, 208, 208);
    }
    ctx.fillStyle = ink; ctx.font = "bold 63px monospace"; ctx.textAlign = "center"; ctx.fillText("</>", 0, 24);
    for (let i = -4; i <= 4; i++) for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(i * 21, side * 110); ctx.lineTo(i * 21, side * (155 + Math.abs(i) * 9)); ctx.lineTo(i * 30, side * 195); ctx.stroke();
      ctx.fillRect(i * 30 - 3, side * 195 - 3, 6, 6);
    }
    ctx.restore();
  } else if (index === 1) {
    // Observatory-like orbital paths and an eclipsed sphere.
    for (let i = 0; i < 5; i++) {
      ctx.save(); ctx.rotate(i * .57 - .9); ctx.beginPath(); ctx.ellipse(0, 0, 185, 54 + i * 6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    const sphere = ctx.createRadialGradient(-32, -38, 0, 0, 0, 100);
    sphere.addColorStop(0, "#f2dbff"); sphere.addColorStop(.3, ink); sphere.addColorStop(.65, "#63399a"); sphere.addColorStop(1, "#130f24");
    ctx.fillStyle = sphere; ctx.beginPath(); ctx.arc(0, 0, 98, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff9"; ctx.beginPath(); ctx.arc(0, 0, 99, 3.3, 5.6); ctx.stroke();
  } else if (index === 2) {
    // A fast, rising algorithmic terrain with a tournament chevron.
    for (let row = 0; row < 12; row++) {
      ctx.beginPath();
      for (let col = 0; col <= 18; col++) {
        const x = (col - 9) * 25;
        const y = row * 14 - Math.exp(-((col - 10) ** 2) / 10) * (145 - row * 5) - 25;
        if (!col) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.lineWidth = 13; ctx.strokeStyle = "#e8ffb8";
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 53, -115); ctx.lineTo(side * 95, -70); ctx.lineTo(side * 53, -25); ctx.stroke(); }
  } else if (index === 3) {
    // Layered sculptural ribbons, rather than a software-logo badge.
    for (let i = 20; i >= 0; i--) {
      const ribbon = ctx.createLinearGradient(-170, -120, 160, 150);
      ribbon.addColorStop(0, "#ffc3a4"); ribbon.addColorStop(.4, ink); ribbon.addColorStop(.7, "#a390ff"); ribbon.addColorStop(1, "#59d9df");
      ctx.strokeStyle = ribbon; ctx.globalAlpha = .45 + (20 - i) / 40; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(-155 + i * 3, 110 - i * 2);
      ctx.bezierCurveTo(190, 135 - i * 7, -230, -180 + i * 4, 130 - i * 2, -130 + i * 3); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else {
    // An architectural assembly: individual pillars becoming one structure.
    const nodes = [[-132, 60], [-65, -5], [2, 50], [69, -28], [136, 30]];
    for (let i = 0; i < nodes.length; i++) {
      const [x, y] = nodes[i]; const h = 65 + i * 14;
      const pillar = ctx.createLinearGradient(x - 24, y - h, x + 24, y);
      pillar.addColorStop(0, "#ffe2a9"); pillar.addColorStop(.5, "#9d6d35"); pillar.addColorStop(1, "#35291e");
      ctx.fillStyle = pillar; ctx.fillRect(x - 23, y - h, 46, h); ctx.strokeRect(x - 23, y - h, 46, h);
      ctx.beginPath(); ctx.moveTo(x - 23, y - h); ctx.lineTo(x, y - h - 14); ctx.lineTo(x + 23, y - h); ctx.stroke();
      if (i) { ctx.beginPath(); ctx.moveTo(nodes[i - 1][0], nodes[i - 1][1] - 145); ctx.lineTo(x, y - 145); ctx.stroke(); }
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x, y - 145, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
  // Deterministic print grain and small registration marks.
  ctx.fillStyle = "#ffffff28";
  for (let n = 0; n < 550; n++) ctx.fillRect((n * 137.3) % 512, 64 + (n * 73.7) % 576, .8, .8);
}

export function paintPackage(index: number, disc = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = disc ? 1024 : 1280;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);
  const edition = EDITIONS[index];
  if (disc) { ctx.save(); ctx.translate(0, -32); ctx.scale(1, .86); }
  art(ctx, index);
  if (disc) ctx.restore();
  ctx.textAlign = "left";
  if (!disc) {
    ctx.fillStyle = "#f4f4ef"; ctx.fillRect(0, 0, 512, 54);
    ctx.fillStyle = "#0b0f15"; ctx.font = "bold italic 34px Arial"; ctx.fillText("PS5", 23, 39);
    ctx.font = "bold 10px Arial"; ctx.textAlign = "right"; ctx.fillText("ACM ORIGINALS", 488, 32); ctx.textAlign = "left";
  }
  const titleY = disc ? 365 : 465;
  const font = index === 2 ? 44 : index === 4 ? 43 : index === 1 ? 58 : 83;
  const shade = ctx.createLinearGradient(0, titleY - 65, 0, disc ? 512 : 640);
  shade.addColorStop(0, "#03070b00"); shade.addColorStop(.35, "#03070be6"); shade.addColorStop(1, "#03070b");
  ctx.fillStyle = shade; ctx.fillRect(0, titleY - 65, 512, 240);
  ctx.fillStyle = edition.ink; ctx.font = "bold 10px monospace";
  ctx.fillText(`OCS’27  /  DOMAIN ${String(index + 1).padStart(2, "0")}`, 28, titleY - font * (disc ? .75 : 1) - 14);
  ctx.fillStyle = "#f4f5ef"; ctx.font = `900 ${disc ? font * .75 : font}px Arial`;
  edition.title.forEach((line, i) => ctx.fillText(line, 26, titleY + i * (disc ? 36 : 43), 460));
  ctx.fillStyle = edition.ink; ctx.fillRect(28, disc ? 425 : 555, 36, 2);
  ctx.font = "bold 10px monospace"; ctx.fillText(edition.code, 28, disc ? 447 : 578);
  ctx.fillStyle = "#b6bdc5"; ctx.font = "9px Arial";
  ctx.fillText("ACM  /  OCS’27", 28, disc ? 468 : 613);
  ctx.textAlign = "right"; ctx.fillText(disc ? "DOMAIN EDITION  •  2027" : "DOMAIN EDITION   /   2027", 484, disc ? 468 : 613);
  if (disc) {
    ctx.fillStyle = "#f0f3ee"; ctx.font = "bold italic 23px Arial"; ctx.textAlign = "center"; ctx.fillText("PS5", 256, 83);
    ctx.strokeStyle = "#c7ced99c"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(256, 256, 249, 0, Math.PI * 2); ctx.stroke();
  } else {
    // The exposed right edge identifies every overlapping case, like a card
    // index. It is printed on the sleeve and follows the actual 3D geometry.
    ctx.fillStyle = edition.ink; ctx.fillRect(458, 54, 54, 586);
    ctx.fillStyle = "#07121c"; ctx.textAlign = "center"; ctx.font = "bold 18px monospace";
    ctx.fillText(String(index + 1).padStart(2, "0"), 485, 87);
    ctx.save(); ctx.translate(478, 115); ctx.rotate(Math.PI / 2);
    ctx.textAlign = "left"; ctx.font = "bold 20px Arial";
    ctx.fillText(DOMAINS[index].name.toUpperCase(), 0, 0, 465);
    ctx.restore();
    ctx.fillStyle = "#07121c"; ctx.fillRect(480, 606, 10, 10);
  }
  canvas.dataset.domain = DOMAINS[index].id;
  return canvas;
}
