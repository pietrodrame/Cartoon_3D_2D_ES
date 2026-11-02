// "Franco en 1 minuto": 13 planos en 9 decorados, sincronizados con la voz "voz españa mia" (public/franco/words.json).
// Mismo look que el puente y el Vasa: mundo 3D a dos tonos con texturas pintadas, personajes planos en tarjetas,
// tinta, desenfoque de lente y grade. Tono neutro y riguroso: nada de violencia explícita ni chistes sobre la guerra.
import * as THREE from "three";
import { LIGHTS, LOOK } from "../bridge/lights";
import { TONE, CHAR, LFB, twoTone, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Batch, V, lam, boxGeo, house } from "../bridge/build";
import { ctex, rep, stoneHD, cobbleHD, waterNear, waterFar, cloudHD, planksHD } from "../bridge/paint";
import { Pool, Actor, Fx } from "../bridge/cast";
import { Pen, bodyFront, bodySide, fxContact, fxBurst, fxPuff, Expr, Outfit, INK, SKIN, SKINS } from "../bridge/toon";

export const FPS = 30;
const S = (s: number) => Math.round(s * FPS);
// ---------------- planos (segundos de la voz) ----------------
//  0 Ferrol: el niño en el muelle            "Gobernó España... quería ser marino."
//  1 Ferrol 1892 desde el aire               "Ferrol, 1892. Francisco Franco nace en una familia de marinos,"
//  2 Escuela Naval: CERRADO, cambio de gorra "pero la Escuela Naval cierra su ingreso y acaba en el Ejército de Tierra."
//  3 Marruecos: estrellas y "33"             "En la guerra de Marruecos asciende... el general más joven de Europa."
//  4 Mapa de España, julio de 1936, grieta   "Julio de 1936. Un golpe militar... fracasa a medias y"
//  5 Mapa partido en dos, aviones            "desata la Guerra Civil. Franco se pone al frente... Hitler y Mussolini."
//  6 Posguerra gris, carteles, CENSURADO     "En 1939 gana la guerra e impone una dictadura: partido único, censura, decenas de miles"
//  7 Exilio por los Pirineos                 "de fusilados y cientos de miles de exiliados."
//  8 Frontera cerrada                        "En la Segunda Guerra Mundial no entra oficialmente, aunque envía"
//  9 División Azul en la nieve               "a la División Azul a luchar contra la Unión Soviética."
// 10 Playa de los sesenta, reactor           "Tras años de aislamiento, los acuerdos con Estados Unidos y el turismo..."
// 11 Salón de 1975, la tele                  "Muere en la cama el 20 de noviembre de 1975."
// 12 La tele: corona y urna                  "Dos días después, Juan Carlos es proclamado rey, y empieza la Transición..."
export const CUTS = [0, 6.35, 12.55, 17.2, 24.55, 31.75, 39.8, 46.2, 49.45, 53.75, 57.2, 64.0, 68.75].map(S);
export const TOTAL = S(75.5);
const SET_OF = [0, 0, 1, 2, 3, 3, 4, 5, 5, 6, 7, 8, 8];
const SAT_OF = [1, 1, 1, 1.05, 1, 1, 0.3, 0.5, 0.55, 0.6, 1.15, 0.85, 0.9];
export const shotOf = (f: number) => { let i = 0; while (i + 1 < CUTS.length && f >= CUTS[i + 1]) i++; return i; };
export const satAt = (f: number) => SAT_OF[shotOf(f)];
const OX = (set: number) => set * 3000;
// key words (s)
const W = {
  marino: 5.53, ferrol: 6.51, cierra: 13.81, acaba: 15.12, asciende: 18.82, tan: 19.32, rapido: 19.56, que: 19.94, treinta: 21.12, general: 22.46,
  golpe: 27.72, guerra: 31.9, hitler: 36.79, censura: 44.33, division: 53.84, eeuu: 59.97, turismo: 61.21, juan: 70.28, transicion: 73.03,
};

const smooth = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const ease = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2; };
const easeOut = (x: number) => 1 - (1 - Math.max(0, Math.min(1, x))) ** 3;
const pop = (t: number, t0: number, d = 0.2) => { if (t < t0) return 0; const k = Math.min(1, (t - t0) / d); const c = 2.2; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type V3 = [number, number, number];
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------------- cámara por plano (coordenadas locales del decorado) ----------------
type Cam = { pos: V3; look: V3; fov: number; roll: number };
const shotU = (f: number, i: number) => (f - CUTS[i]) / ((i + 1 < CUTS.length ? CUTS[i + 1] : TOTAL) - CUTS[i]);
const QY = 2.0; // muelle de Ferrol
const camLocal = (f: number): Cam => {
  const i = shotOf(f), u = shotU(f, i), e = ease(u), t = f / FPS;
  switch (i) {
    case 0: return { pos: lerp3([4.0, 3.15, -0.6], [3.75, 3.35, -2.6], e), look: lerp3([3.0, 3.4, -30], [1.0, 5.5, -70], e), fov: 40, roll: 0 };
    case 1: return { pos: lerp3([62, 58, 44], [44, 38, 20], e), look: lerp3([-2, 0, -58], [-6, 0, -62], e), fov: 42, roll: 0 };
    case 2: return { pos: lerp3([1.6, 1.6, 4.4], [0.9, 1.55, 2.0], e), look: lerp3([0, 4.0, -8], [0, 3.1, -8], e), fov: 40, roll: 0 };
    case 3: return { pos: lerp3([0.5, 1.7, 6.6], [0.2, 1.8, 4.9], e), look: lerp3([0, 2.15, 0], [0, 2.35, 0], e), fov: 40, roll: 0 };
    case 4: {
      const sk = t > W.golpe && t < W.golpe + 0.45 ? (1 - (t - W.golpe) / 0.45) * 0.9 : 0;
      const p = lerp3([0, 122, 92], [-3, 110, 78], e);
      return { pos: [p[0] + sk * Math.sin(t * 90), p[1] + sk * Math.cos(t * 77), p[2]], look: lerp3([0, 0, -6], [-2, 0, -4], e), fov: 38, roll: 0 };
    }
    case 5: return { pos: lerp3([-6, 92, 74], [-14, 62, 52], e), look: lerp3([-4, 0, -2], [-11, 0, 4], e), fov: 38, roll: 0 };
    case 6: return { pos: lerp3([1.2, 1.7, 3.5], [0.6, 1.7, -1.5], e), look: lerp3([-3, 1.9, -9], [-2.6, 2.0, -16], e), fov: 40, roll: 0 };
    case 7: return { pos: lerp3([-9, 2.2, 10], [-7.5, 2.5, 7], e), look: lerp3([5, 1.6, -14], [7, 1.8, -16], e), fov: 40, roll: 0 };
    case 8: return { pos: lerp3([11.0, 1.8, -24.5], [12.2, 1.7, -26.6], e), look: lerp3([18.8, 1.7, -34.5], [18.8, 1.6, -34.5], e), fov: 40, roll: 0 };
    case 9: return { pos: lerp3([-1, 1.8, 13], [2.5, 1.8, 12.5], e), look: lerp3([-1, 1.5, 0], [2.5, 1.5, 0], e), fov: 40, roll: 0 };
    case 10: return { pos: lerp3([-14, 2.2, 6], [-9, 2.5, 5.5], e), look: lerp3([6, 2.6, 9], [10, 3.6, 10], e), fov: 42, roll: 0 };
    case 11: return { pos: lerp3([2.3, 1.55, 2.6], [1.7, 1.45, 1.5], e), look: lerp3([-0.4, 1.2, -2.6], [-0.2, 1.15, -2.6], e), fov: 42, roll: 0 };
    default: return { pos: lerp3([0.72, 1.02, -0.2], [0.63, 1.0, -0.95], e), look: [0.6, 1.0, -2.4], fov: 38, roll: 0 };
  }
};
export const camAt = (f: number): Cam => {
  const c = camLocal(f), ox = OX(SET_OF[shotOf(f)]);
  return { ...c, pos: [c.pos[0] + ox, c.pos[1], c.pos[2]], look: [c.look[0] + ox, c.look[1], c.look[2]] };
};
/** desenfoque: personajes nítidos y fondo suave en los planos cercanos; aéreos y mapa nítidos */
export const dofAt = (f: number): { cInf: number; focus: V3 } => {
  const i = shotOf(f), ox = OX(SET_OF[i]);
  const F: Record<number, [number, V3]> = {
    0: [9, [3.6, 3.0, -6.5]], 1: [0, [0, 0, -40]], 2: [7, [0, 1.6, -3.5]], 3: [8, [0, 1.6, 0]], 4: [0, [0, 0, 0]], 5: [0, [0, 0, 0]],
    6: [6, [-4, 1.7, -9]], 7: [5, [2, 1.2, -6]], 8: [6, [16.5, 1.3, -34]], 9: [6, [1, 1.2, 0]], 10: [4, [4, 1.2, 6]], 11: [4, [0.6, 1.0, -2.4]], 12: [2, [0.6, 1.0, -2.4]],
  };
  const [cInf, p] = F[i];
  return { cInf, focus: [p[0] + ox, p[1], p[2]] };
};

// ---------------- texturas pintadas ----------------
const FONT = "'Arial Black', 'Arial Rounded MT Bold', Arial, sans-serif";
const text = (g: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, fill: string, stroke?: string, sw = 0) => {
  g.font = `900 ${px}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  if (stroke) { g.lineJoin = "round"; g.lineWidth = sw; g.strokeStyle = stroke; g.strokeText(s, x, y); }
  g.fillStyle = fill; g.fillText(s, x, y);
};
const sandTex = (key: string, base: string, dots: string[]) => ctex(key, 1024, 1024, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 2600; i++) { g.fillStyle = dots[Math.floor(r() * dots.length)]; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 4, 2 + r() * 3); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(150,110,60,0.18)"; g.lineWidth = 3; const y = r() * 1024; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y - 30, 700, y + 30, 1024, y); g.stroke(); }
});
const snowTex = () => ctex("snowF", 1024, 1024, (g, r) => {
  g.fillStyle = "#f2f5fa"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? "rgba(190,205,230,0.25)" : "rgba(255,255,255,0.6)"; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 30 + r() * 90, 10 + r() * 30, 0, 0, 7); g.fill(); }
});
const steelHull = () => ctex("steelHull", 1024, 256, (g) => {
  // v: y from -3 (abajo) a 4.8 (arriba); 256 px -> 32.8 px/m
  const Y = (y: number) => 256 - ((y + 3) / 7.8) * 256;
  g.fillStyle = "#7f8b98"; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = "#a33a32"; g.fillRect(0, Y(0), 1024, 256 - Y(0));
  g.fillStyle = "#23232b"; g.fillRect(0, Y(0.55), 1024, Y(0) - Y(0.55));
  g.fillStyle = "#e9e6dc"; g.fillRect(0, Y(3.95), 1024, 4);
  for (let x = 30; x < 1000; x += 26) { g.fillStyle = "#2a2d36"; g.beginPath(); g.arc(x, Y(2.2), 4, 0, 7); g.fill(); }
  g.fillStyle = "rgba(40,45,55,0.3)"; for (let x = 0; x < 1024; x += 64) g.fillRect(x, Y(4.6), 2, Y(0.55) - Y(4.6));
});
const signBoard = (key: string, lines: string[], w: number, h: number, bg: string, fg: string, border = "#f0c445") => ctex(key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = border; g.lineWidth = h * 0.06; g.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
  lines.forEach((s, k) => text(g, s, w / 2, (h * (k + 0.5)) / lines.length + (lines.length > 1 ? (k ? -h * 0.04 : h * 0.04) : 0), (h * 0.62) / lines.length, fg, INK, h * 0.03));
});
const schoolFacade = () => ctex("navalFacade", 1024, 512, (g, r) => {
  // 26 m x 13 m; 39.4 px/m
  const M = 1024 / 26, X = (x: number) => (x + 13) * M, Y = (y: number) => 512 - y * M;
  g.fillStyle = "#d9cdb6"; g.fillRect(0, 0, 1024, 512);
  for (let y = 0; y < 13; y += 0.6) { g.fillStyle = "rgba(120,100,80,0.28)"; g.fillRect(0, Y(y), 1024, 2); for (let x = (y * 7) % 1.2; x < 26; x += 1.2) g.fillRect(x * M, Y(y + 0.6), 2, 0.6 * M); }
  g.fillStyle = "#bfb197"; g.fillRect(0, Y(1.0), 1024, Y(0) - Y(1.0)); g.fillRect(0, Y(11.2), 1024, Y(10.6) - Y(11.2));
  // ventanas (dos filas, simétricas, sin la puerta)
  for (const y0 of [2.0, 6.6]) for (const x of [-11, -8.3, -5.6, 3.6, 6.3, 9.0]) {
    g.fillStyle = "#efe6d2"; g.fillRect(X(x) - 6, Y(y0 + 2.6) - 6, 1.6 * M + 12, 2.6 * M + 12);
    g.fillStyle = "#33405a"; g.fillRect(X(x), Y(y0 + 2.6), 1.6 * M, 2.6 * M);
    g.fillStyle = "#efe6d2"; g.fillRect(X(x) + 0.8 * M - 2, Y(y0 + 2.6), 4, 2.6 * M); g.fillRect(X(x), Y(y0 + 1.3) - 2, 1.6 * M, 4);
  }
  // puerta grande de madera con arco y columnas
  g.fillStyle = "#cbbd9f"; g.fillRect(X(-2.6), Y(6.0), 5.2 * M, 6.0 * M);
  g.fillStyle = "#5a3a26"; g.beginPath(); g.moveTo(X(-1.6), Y(0)); g.lineTo(X(-1.6), Y(3.9)); g.arc(X(0), Y(3.9), 1.6 * M, Math.PI, 0); g.lineTo(X(1.6), Y(0)); g.fill();
  g.strokeStyle = "#3a2418"; g.lineWidth = 4; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(0), Y(5.4)); g.stroke();
  for (const x of [-1.2, -0.6, 0.4, 1.0]) for (const y of [0.8, 2.2, 3.6]) g.strokeRect(X(x), Y(y + 1), 0.4 * M, 1 * M);
  for (const x of [-2.4, 2.0]) { g.fillStyle = "#e8dcc4"; g.fillRect(X(x), Y(6.0), 0.4 * M, 6 * M); }
  // ancla dorada encima de la puerta
  g.strokeStyle = "#e0b23a"; g.lineWidth = 7; const ax = X(0), ay = Y(6.8);
  g.beginPath(); g.moveTo(ax, ay - 30); g.lineTo(ax, ay + 26); g.stroke(); g.beginPath(); g.arc(ax, ay + 6, 22, 0.2, Math.PI - 0.2); g.stroke();
  g.beginPath(); g.moveTo(ax - 14, ay - 18); g.lineTo(ax + 14, ay - 18); g.stroke(); g.beginPath(); g.arc(ax, ay - 36, 7, 0, 7); g.stroke();
  void r;
});
const whiteHouse = () => ctex("moroHouse", 256, 256, (g, r) => {
  g.fillStyle = "#f3eee2"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(200,185,160,0.25)"; g.fillRect(r() * 256, r() * 256, 10 + r() * 30, 4); }
  g.fillStyle = "#2e6f8e"; g.beginPath(); g.moveTo(100, 256); g.lineTo(100, 170); g.arc(128, 170, 28, Math.PI, 0); g.lineTo(156, 256); g.fill();
  g.fillStyle = "#3a3540"; g.fillRect(40, 80, 30, 36); g.fillRect(186, 80, 30, 36);
});
const birchTex = () => ctex("birch", 128, 512, (g, r) => {
  g.fillStyle = "#efede6"; g.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = "#2b2830"; g.fillRect(r() * 100, r() * 512, 14 + r() * 26, 3 + r() * 5); }
});
const stripeTex = (key: string, a: string, b: string, n: number) => ctex(key, 512, 64, (g) => {
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect((512 * i) / n, 0, 512 / n + 1, 64); }
});
const hotelTex = (key: string, wall: string, bal: string) => ctex(key, 512, 1024, (g) => {
  g.fillStyle = wall; g.fillRect(0, 0, 512, 1024);
  for (let y = 40; y < 1000; y += 62) {
    g.fillStyle = bal; g.fillRect(0, y + 38, 512, 10);
    for (let x = 16; x < 500; x += 54) { g.fillStyle = "#3b5a78"; g.fillRect(x, y, 36, 36); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x + 4, y + 4, 10, 28); }
  }
});
const wallpaper = () => ctex("wall70", 512, 512, (g) => {
  g.fillStyle = "#d9a65a"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < 544; x += 64) {
    g.fillStyle = "#b8743a"; g.beginPath(); g.arc(x, y + 32, 24, 0, 7); g.fill();
    g.fillStyle = "#e9c27c"; g.beginPath(); g.arc(x, y + 32, 12, 0, 7); g.fill();
  }
});
const calendarTex = () => ctex("cal1975", 256, 360, (g) => {
  g.fillStyle = "#f7f3ea"; g.fillRect(0, 0, 256, 360);
  g.fillStyle = "#b8352f"; g.fillRect(0, 0, 256, 80);
  text(g, "NOVIEMBRE", 128, 42, 30, "#ffffff");
  text(g, "20", 128, 180, 130, "#241726");
  text(g, "1975", 128, 300, 48, "#241726");
});
const windowTex = () => ctex("win75", 256, 320, (g) => {
  g.fillStyle = "#9cc4e8"; g.fillRect(0, 0, 256, 320);
  g.fillStyle = "#c9d9e8"; g.fillRect(0, 200, 256, 120);
  g.fillStyle = "#8a7a6a"; for (let x = 10; x < 256; x += 60) g.fillRect(x, 150, 40, 170);
  g.strokeStyle = "#f2efe6"; g.lineWidth = 16; g.strokeRect(8, 8, 240, 304); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 320); g.moveTo(0, 160); g.lineTo(256, 160); g.stroke();
});
const tvScreen = (k: number) => ctex("tv" + k, 512, 384, (g, r) => {
  if (k === 0) {
    g.fillStyle = "#3a3d42"; g.fillRect(0, 0, 512, 384);
    for (let y = 0; y < 384; y += 4) { g.fillStyle = `rgba(255,255,255,${0.03 + 0.03 * r()})`; g.fillRect(0, y, 512, 2); }
    g.fillStyle = "#1f2126"; g.fillRect(40, 70, 432, 244);
    text(g, "20 · XI · 1975", 256, 150, 54, "#e8e8e8");
    g.fillStyle = "#e8e8e8"; g.fillRect(150, 205, 212, 6);
    text(g, "FRANCO HA MUERTO", 256, 255, 32, "#e8e8e8");
  } else if (k === 1) {
    const gr = g.createRadialGradient(256, 190, 20, 256, 190, 300); gr.addColorStop(0, "#3d5fa8"); gr.addColorStop(1, "#1d2e5c");
    g.fillStyle = gr; g.fillRect(0, 0, 512, 384);
    // corona
    g.fillStyle = "#f0c445"; g.strokeStyle = INK; g.lineWidth = 8;
    g.beginPath(); g.moveTo(146, 250); g.lineTo(130, 130); g.lineTo(196, 190); g.lineTo(256, 100); g.lineTo(316, 190); g.lineTo(382, 130); g.lineTo(366, 250); g.closePath(); g.fill(); g.stroke();
    g.fillRect(140, 250, 232, 36); g.strokeRect(140, 250, 232, 36);
    for (const [x, y, c] of [[256, 96, "#c0353a"], [130, 126, "#2e8a5a"], [382, 126, "#2e8a5a"], [256, 268, "#c0353a"], [196, 268, "#3d5fa8"], [316, 268, "#3d5fa8"]] as [number, number, string][]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); g.stroke(); }
    text(g, "22 · XI · 1975", 256, 340, 34, "#ffffff", INK, 6);
  } else {
    g.fillStyle = "#e9e2cf"; g.fillRect(0, 0, 512, 384);
    // urna con papeleta
    g.fillStyle = "#cfe3f0"; g.strokeStyle = INK; g.lineWidth = 8;
    g.beginPath(); g.moveTo(150, 150); g.lineTo(362, 150); g.lineTo(380, 320); g.lineTo(132, 320); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#9fc3dc"; g.fillRect(150, 150, 212, 30); g.strokeRect(150, 150, 212, 30);
    g.fillStyle = "#241726"; g.fillRect(206, 160, 100, 10);
    g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(222, 40); g.lineTo(300, 52); g.lineTo(288, 166); g.lineTo(210, 156); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = "#7a7a7a"; g.lineWidth = 5; for (const y of [76, 100, 124]) { g.beginPath(); g.moveTo(232, y); g.lineTo(284, y + 6); g.stroke(); }
    text(g, "DEMOCRACIA", 256, 352, 34, "#241726");
  }
});
const posterWall = () => ctex("posters39", 2048, 512, (g, r) => {
  // muro de 24 m x 4 m (85 px/m) con carteles: x local 0 = z +4 ... 24 = z -20
  g.fillStyle = "#b7aa96"; g.fillRect(0, 0, 2048, 512);
  for (let y = 0; y < 512; y += 42) { g.fillStyle = "rgba(90,80,70,0.3)"; g.fillRect(0, y, 2048, 2); for (let x = ((y / 42) % 2) * 60; x < 2048; x += 120) g.fillRect(x, y, 2, 42); }
  const P = (x: number, w: number, h: number, bg: string, lines: [string, number][], rot: number) => {
    g.save(); g.translate(x, 230); g.rotate(rot);
    g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(-w / 2 + 6, -h / 2 + 6, w, h);
    g.fillStyle = bg; g.fillRect(-w / 2, -h / 2, w, h);
    let y = -h / 2 + 20;
    for (const [s, px] of lines) { y += px * 0.6; text(g, s, 0, y, px, "#2a2226"); y += px * 0.6; }
    for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(60,50,40,0.5)"; g.fillRect(-w / 2 + 20, y + 10 + k * 14, w - 40 - r() * 60, 5); }
    g.restore();
  };
  P(520, 190, 250, "#e8dfc8", [["AVISO", 40]], -0.03);
  P(760, 230, 300, "#efe8d4", [["AÑO", 34], ["1939", 64]], 0.02);
  P(1020, 200, 260, "#ddd2b8", [["BANDO", 40]], 0.015);
  P(1250, 190, 240, "#e6dcc4", [["ORDEN", 38]], -0.02);
  P(1480, 210, 280, "#ebe3cd", [["AVISO", 40]], 0.03);
});

// ---------------- mapa de la península (aproximado, julio de 1936) ----------------
const K = 7, LON0 = -3.7, LAT0 = 40.2, CL = Math.cos((40 * Math.PI) / 180);
const MP = (lon: number, lat: number): [number, number] => [(lon - LON0) * K * CL, -(lat - LAT0) * K]; // -> [x, z]
const PENINSULA: [number, number][] = [
  [-1.78, 43.37], [-2.9, 43.42], [-3.8, 43.47], [-4.9, 43.42], [-5.85, 43.6], [-6.9, 43.57], [-7.7, 43.75], [-8.35, 43.38], [-9.25, 43.1], [-9.3, 42.85],
  [-8.9, 42.1], [-8.78, 41.6], [-8.65, 41.15], [-8.85, 40.4], [-9.1, 39.6], [-9.5, 38.78], [-9.15, 38.45], [-8.8, 38.15], [-8.8, 37.5], [-8.95, 37.02],
  [-7.9, 37.0], [-7.4, 37.18], [-6.95, 37.15], [-6.3, 36.75], [-6.1, 36.3], [-5.6, 36.0], [-5.3, 36.25], [-4.4, 36.72], [-3.4, 36.73], [-2.3, 36.72],
  [-1.9, 36.95], [-1.6, 37.4], [-0.95, 37.58], [-0.7, 37.95], [-0.5, 38.35], [0.2, 38.75], [-0.1, 39.05], [-0.32, 39.5], [-0.05, 39.95], [0.5, 40.4],
  [0.9, 40.72], [1.2, 41.1], [2.15, 41.38], [3.2, 41.88], [3.25, 42.35], [2.6, 42.42], [1.7, 42.5], [0.7, 42.8], [-0.6, 42.82], [-1.4, 43.05],
];
const PORTUGAL: [number, number][] = [
  [-8.9, 42.1], [-8.2, 42.12], [-6.6, 41.95], [-6.2, 41.6], [-6.9, 41.0], [-6.95, 40.25], [-7.0, 39.65], [-7.3, 39.45], [-7.05, 38.85], [-7.3, 38.4],
  [-7.0, 38.0], [-7.45, 37.55], [-7.4, 37.18], [-7.9, 37.0], [-8.95, 37.02], [-8.8, 37.5], [-8.8, 38.15], [-9.15, 38.45], [-9.5, 38.78], [-9.1, 39.6],
  [-8.85, 40.4], [-8.65, 41.15], [-8.78, 41.6],
];
const FRANCE: [number, number][] = [[-1.78, 43.37], [-1.25, 44.6], [-1.15, 46.5], [5.0, 46.5], [5.0, 43.4], [3.05, 43.05], [3.25, 42.35], [2.6, 42.42], [1.7, 42.5], [0.7, 42.8], [-0.6, 42.82], [-1.4, 43.05]];
const AFRICA: [number, number][] = [[-9.8, 33.0], [-9.6, 34.0], [-6.9, 34.3], [-6.2, 35.3], [-5.9, 35.8], [-5.3, 35.9], [-4.6, 35.2], [-3.9, 35.25], [-2.95, 35.4], [-2.2, 35.1], [-1.0, 35.6], [0.5, 35.9], [3.0, 36.8], [4.5, 36.9], [4.5, 33.0]];
// zona sublevada aproximada, finales de julio de 1936 (norte-oeste + bolsa de Sevilla-Cádiz)
const NAT_N: [number, number][] = [
  [-8.9, 42.1], [-9.3, 42.85], [-9.25, 43.1], [-8.35, 43.38], [-7.7, 43.75], [-7.05, 43.56], [-6.4, 43.05], [-5.0, 42.98], [-4.0, 42.98], [-3.2, 42.95],
  [-2.5, 42.98], [-1.75, 43.12], [-1.4, 43.05], [-0.6, 42.82], [-0.15, 42.75], [-0.35, 42.2], [-0.7, 41.6], [-0.9, 41.0], [-1.1, 40.35], [-1.7, 40.65],
  [-2.6, 41.15], [-3.6, 41.05], [-4.2, 40.6], [-4.75, 40.2], [-5.3, 39.95], [-5.7, 39.6], [-6.4, 39.45], [-7.3, 39.45], [-7.0, 39.65], [-6.95, 40.25],
  [-6.9, 41.0], [-6.2, 41.6], [-6.6, 41.95], [-8.2, 42.12],
];
const NAT_S: [number, number][] = [[-6.95, 37.15], [-6.3, 36.75], [-6.1, 36.3], [-5.6, 36.0], [-5.25, 36.35], [-5.45, 36.9], [-5.0, 37.3], [-5.5, 37.75], [-6.3, 37.65], [-6.6, 37.3]];
const XS = PENINSULA.map((p) => MP(...p)[0]), ZS = PENINSULA.map((p) => MP(...p)[1]);
const MX0 = Math.min(...XS) - 1, MX1 = Math.max(...XS) + 1, MZ0 = Math.min(...ZS) - 1, MZ1 = Math.max(...ZS) + 1;
const mapTex = (state: 0 | 1 | 2) => ctex("iberia" + state, 2048, Math.round((2048 * (MZ1 - MZ0)) / (MX1 - MX0)), (g, r) => {
  const CW = 2048, CH = Math.round((2048 * (MZ1 - MZ0)) / (MX1 - MX0));
  const C = (lon: number, lat: number): [number, number] => { const [x, z] = MP(lon, lat); return [((x - MX0) / (MX1 - MX0)) * CW, ((z - MZ0) / (MZ1 - MZ0)) * CH]; };
  const path = (pts: [number, number][]) => { g.beginPath(); pts.forEach((p, i) => { const [x, y] = C(...p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
  const A = "#c99a5b", B = "#7d8fc4";
  g.fillStyle = state === 2 ? B : "#eadcb6"; g.fillRect(0, 0, CW, CH);
  if (state === 2) { g.fillStyle = A; path(NAT_N); g.fill(); path(NAT_S); g.fill(); }
  // relieve pintado suave
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(90,70,50,${0.05 + 0.05 * r()})`; g.beginPath(); g.ellipse(r() * CW, r() * CH, 20 + r() * 60, 8 + r() * 20, r() * 3, 0, 7); g.fill(); }
  g.fillStyle = "#b9b4a8"; path(PORTUGAL); g.fill();
  g.strokeStyle = "rgba(36,23,38,0.55)"; g.lineWidth = 6; g.setLineDash([18, 12]); path(PORTUGAL); g.stroke(); g.setLineDash([]);
  if (state >= 1) {
    // el frente: línea quebrada gruesa
    g.save(); path(PENINSULA); g.clip();
    g.strokeStyle = "#241726"; g.lineWidth = state === 1 ? 12 : 9; g.lineJoin = "miter";
    for (const zone of [NAT_N, NAT_S]) {
      g.beginPath();
      zone.forEach((p, i) => { const [x, y] = C(...p); const j = state === 1 ? (r() - 0.5) * 18 : 0; i ? g.lineTo(x + j, y + j) : g.moveTo(x, y); });
      g.closePath(); g.stroke();
    }
    g.restore();
  }
  if (state === 2) {
    const [ax, ay] = C(-5.6, 41.9), [bx, by] = C(-5.0, 38.7);
    text(g, "SUBLEVADOS", ax, ay, 74, "#fff6e0", INK, 14);
    text(g, "REPÚBLICA", bx, by, 62, "#f2f4ff", INK, 14);
  }
  const [mx, my] = C(-3.7, 40.42); g.fillStyle = INK; g.beginPath(); g.arc(mx, my, 14, 0, 7); g.fill(); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(mx, my, 7, 0, 7); g.fill();
  text(g, "MADRID", mx, my + 46, 40, "#241726");
});
const landGeo = (pts: [number, number][], depth: number) => {
  const s = new THREE.Shape();
  pts.forEach((p, i) => { const [x, z] = MP(...p); i ? s.lineTo(x, -z) : s.moveTo(x, -z); });
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - MX0) / (MX1 - MX0), 1 - (p.getZ(i) - MZ0) / (MZ1 - MZ0));
  return g;
};

// ---------------- geometría auxiliar ----------------
const rod = (a: THREE.Vector3, b: THREE.Vector3, r0: number, r1 = r0, seg = 8) => {
  const d = b.clone().sub(a), len = d.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
};
const flatQuad = (x0: number, x1: number, z0: number, z1: number, y: number, u: number, v: number) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 1, 0]).flat(), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
};
/** plano vertical de cara a +z (x0..x1, y0..y1) */
const panel = (x0: number, x1: number, y0: number, y1: number, z: number, u = 1, v = 1) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 0, 1]).flat(), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
};
const MRot = (yaw: number, x: number, y: number, z: number) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);

/** acorazado de vapor de finales del XIX: casco gris, chimeneas, torres y mástiles (local: proa hacia +x) */
const steamship = (b: Batch, L: number, HB: number, m: THREE.Matrix4) => {
  const hull = lam("steelHull", () => ({ map: steelHull(), side: THREE.DoubleSide }));
  const grey = lam("shipGrey", () => ({ color: "#8a95a2" })), white = lam("shipWhite", () => ({ color: "#ece7da" }));
  const buff = lam("funnelBuff", () => ({ color: "#d9b56a" })), black = lam("shipBlack", () => ({ color: "#2a2a32" }));
  const wood = lam("shipDeck", () => ({ color: "#c9a77a" }));
  const keel = -3, top = 4;
  const hw = (u: number) => HB * (u < 0.14 ? 0.12 + 0.88 * Math.sin((u / 0.14) * Math.PI / 2) ** 0.6 : u > 0.62 ? Math.max(0.03, Math.cos(((u - 0.62) / 0.38) * Math.PI / 2) ** 0.75) : 1);
  const sec = (u: number, v: number) => hw(u) * Math.sin(Math.min(v / 0.45, 1) * Math.PI / 2) ** 0.55;
  const topAt = (u: number) => top + 0.8 * smooth((u - 0.82) / 0.18);
  for (const side of [1, -1]) {
    const NU = 48, NV = 14, pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
      const u = i / NU, v = j / NV, y = lerp(keel, topAt(u), v);
      pos.push(-L / 2 + L * u, y, side * sec(u, v)); uv.push(u * 3, (y + 3) / 7.8);
    }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, c = a + NV + 1; if (side > 0) idx.push(a, c, a + 1, c, c + 1, a + 1); else idx.push(a, a + 1, c, c, a + 1, c + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    b.add(g, hull, m);
  }
  { // cubierta
    const NU = 40, pos: number[] = [], idx: number[] = [];
    for (let i = 0; i <= NU; i++) { const u = i / NU, y = topAt(u) - 0.3, w = sec(u, 0.97); pos.push(-L / 2 + L * u, y, -w, -L / 2 + L * u, y, w); if (i < NU) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    b.add(g, wood, m);
  }
  const at = (x: number, y: number, z: number) => new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(x, y, z));
  b.add(boxGeo(V(-L * 0.12, top - 0.3, -HB * 0.55), V(L * 0.1, top + 2.6, HB * 0.55)), white, m);
  b.add(boxGeo(V(L * 0.04, top + 2.6, -HB * 0.4), V(L * 0.1, top + 4.2, HB * 0.4)), white, m);
  for (const x of [-L * 0.06, L * 0.02]) {
    b.add(new THREE.CylinderGeometry(HB * 0.2, HB * 0.22, 7, 14).translate(0, 3.5, 0), buff, at(x, top + 2.4, 0));
    b.add(new THREE.CylinderGeometry(HB * 0.205, HB * 0.205, 1.1, 14).translate(0, 0.55, 0), black, at(x, top + 8.8, 0));
  }
  for (const [x, s] of [[L * 0.3, 1], [-L * 0.3, -1]] as [number, number][]) {
    b.add(new THREE.CylinderGeometry(HB * 0.42, HB * 0.46, 1.6, 16).translate(0, 0.8, 0), grey, at(x, top - 0.3, 0));
    for (const z of [-0.35, 0.35]) b.add(rod(V(x, top + 0.8, z), V(x + s * HB * 1.1, top + 1.0, z), 0.16, 0.12, 6), black, m);
  }
  for (const x of [L * 0.22, -L * 0.2]) b.add(rod(V(x, top, 0), V(x, top + 16, 0), 0.22, 0.12), black, m);
  b.add(rod(V(L * 0.22, top + 16, 0), V(-L * 0.2, top + 15, 0), 0.04, 0.04, 4), black, m);
};
const palm = (b: Batch, x: number, z: number, h: number, seed: number) => {
  const trunk = lam("palmTrunk", () => ({ color: "#8a6a44" })), leaf = lam("palmLeaf", () => ({ color: "#4f8a3a", side: THREE.DoubleSide }));
  const lean = (hh(seed) - 0.5) * 0.25;
  let p0 = V(x, 0, z);
  for (let k = 1; k <= 5; k++) { const p1 = V(x + lean * h * (k / 5) ** 2, (h * k) / 5, z); b.add(rod(p0, p1, 0.26 - k * 0.025, 0.24 - k * 0.025, 7), trunk); p0 = p1; }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + seed, L = 2.6 + hh(seed, k) * 0.8;
    const mid = V(p0.x + Math.cos(a) * L * 0.55, p0.y + 0.45, p0.z + Math.sin(a) * L * 0.55), tip = V(p0.x + Math.cos(a) * L, p0.y - 0.7, p0.z + Math.sin(a) * L);
    b.add(rod(p0, mid, 0.05, 0.32, 4).scale(1, 1, 1), leaf); b.add(rod(mid, tip, 0.32, 0.03, 4), leaf);
  }
};
const pine = (b: Batch, x: number, z: number, h: number) => {
  const green = lam("pineGreen", () => ({ color: "#2f5a48" })), snowM = lam("pineSnow", () => ({ color: "#eef3f8" })), trunk = lam("pineTrunk", () => ({ color: "#5a3e2c" }));
  b.add(new THREE.CylinderGeometry(0.15, 0.2, h * 0.3, 6).translate(x, h * 0.15, z), trunk);
  for (let k = 0; k < 3; k++) {
    const y = h * (0.22 + k * 0.22), r = h * (0.32 - k * 0.08);
    b.add(new THREE.ConeGeometry(r, h * 0.38, 8).translate(x, y + h * 0.19, z), green);
    b.add(new THREE.ConeGeometry(r * 0.45, h * 0.15, 8).translate(x, y + h * 0.33, z), snowM);
  }
};
const birch = (b: Batch, x: number, z: number, h: number, seed: number) => {
  const bark = lam("birchBark", () => ({ map: birchTex() })), twig = lam("birchTwig", () => ({ color: "#4a3a3a" }));
  b.add(rod(V(x, 0, z), V(x + (hh(seed) - 0.5) * 0.6, h, z), 0.17, 0.08, 8), bark);
  for (let k = 0; k < 5; k++) {
    const y = h * (0.45 + k * 0.1), a = seed + k * 2.3;
    b.add(rod(V(x, y, z), V(x + Math.cos(a) * 1.6, y + 1.3, z + Math.sin(a) * 1.6), 0.05, 0.02, 4), twig);
  }
};
const umbrella = (b: Batch, x: number, z: number, k: number) => {
  const cols = [["#e2453c", "#f6f1e6"], ["#2f7fc2", "#f6f1e6"], ["#f0b030", "#f6f1e6"], ["#2e9a6a", "#f6f1e6"]][k % 4];
  const m = lam("umb" + k % 4, () => ({ map: stripeTex("umbS" + (k % 4), cols[0], cols[1], 12), side: THREE.DoubleSide }));
  b.add(new THREE.ConeGeometry(1.5, 0.55, 24, 1, true).translate(x, 2.25, z), m);
  b.add(rod(V(x, 0, z), V(x, 2.3, z), 0.04, 0.04, 6), lam("umbPole", () => ({ color: "#f2efe6" })));
};
const planeGeo = (b: Batch, jet: boolean) => {
  const body = lam(jet ? "jetBody" : "propBody", () => ({ color: jet ? "#c9ced6" : "#8d939a" })), dark = lam("planeDark", () => ({ color: "#3a3d45" }));
  if (jet) {
    b.add(new THREE.CylinderGeometry(0.55, 0.35, 11, 12).rotateZ(Math.PI / 2), body);
    b.add(new THREE.ConeGeometry(0.55, 2, 12).rotateZ(-Math.PI / 2).translate(6.5, 0, 0), body);
    const wing = new THREE.Shape([new THREE.Vector2(1.5, 0), new THREE.Vector2(-2.5, 5), new THREE.Vector2(-3.8, 5), new THREE.Vector2(-2, 0)]);
    for (const s of [1, -1]) { const g = new THREE.ShapeGeometry(wing); g.rotateX(Math.PI / 2); g.scale(1, 1, s); b.add(g, body); }
    const fin = new THREE.Shape([new THREE.Vector2(-3.5, 0), new THREE.Vector2(-5.5, 2.4), new THREE.Vector2(-6, 2.4), new THREE.Vector2(-5.4, 0)]);
    b.add(new THREE.ShapeGeometry(fin), body);
  } else {
    b.add(new THREE.CylinderGeometry(0.42, 0.22, 5.2, 10).rotateZ(Math.PI / 2), body);
    b.add(boxGeo(V(-0.5, -0.05, -4.2), V(0.6, 0.08, 4.2)), body);
    b.add(boxGeo(V(-2.6, 0.0, -1.2), V(-2.1, 0.06, 1.2)), body);
    b.add(boxGeo(V(-2.6, 0.0, -0.04), V(-2.1, 0.9, 0.04)), body);
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6).translate(2.7, 0, 0), dark);
  }
};

// ---------------- agua (como el río y el Vasa) ----------------
const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.18 * wTime, 0.1 * wTime);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.35);
  wc = mix(wc, wCrest, mk.r * 0.12 * clamp(1.0 - (cameraPosition.y - 6.0) / 20.0, 0.25, 1.0));
  wc = mix(wc, wGlint, mk.b * (0.15 + 0.25 * wf) * clamp(1.0 - (cameraPosition.y - 6.0) / 20.0, 0.15, 1.0));
  diffuseColor.rgb = wc;`;

// ---------------- reparto ----------------
const SAILOR_KID: Outfit = { jacket: "#2b3f78", pants: "#f2efe6", boots: INK, hat: "cap", cap: "#f4f2ec", build: "kid", skin: SKIN };
const CADET: Outfit = { jacket: "#2b3f78", pants: "#2b3f78", boots: INK, hat: "cap", cap: "#f4f2ec", buttons: "#e8c45a", skin: SKIN };
const ARMY: Outfit = { jacket: "#8b8458", pants: "#6d6844", boots: INK, hat: "shako", buttons: "#e8c45a", belt: "#5a4630", skin: SKIN };
const GENERAL: Outfit = { ...ARMY, hat: "shako_tall", sash: "#c0353a", sword: true, moustache: "#3a2a20", belt: null };
const SEED_F = 3; // la misma cara para Franco en todos los planos
const plain = (i: number, cols: string[], hats = true): Outfit => {
  const o: Outfit = { jacket: cols[i % cols.length], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[i % 4], hat: hats ? (i % 2 ? "hair" : "cap") : "hair", hair: ["#4a3426", "#2a201a", "#6a4a2a"][i % 3], cap: "#3a3a40" };
  if (i % 3 === 1) o.dress = cols[(i + 2) % cols.length];
  return o;
};
const DIV: Outfit = { jacket: "#2f4f8f", pants: "#55593f", boots: INK, hat: "cap", cap: "#55593f", rifle: true, belt: "#4a3a2a", skin: SKIN };

export class FrancoWorld {
  root = new THREE.Group();
  private sets: THREE.Group[] = [];
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private nA = 0; private nF = 0;
  private sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 60, 520);
  private WU: Record<string, THREE.IUniform>;
  private clouds: THREE.Mesh[] = [];
  private sunDirs: THREE.Vector3[] = [];
  private mapTop!: THREE.MeshLambertMaterial;
  private planes: THREE.Group[] = [];
  private jet = new THREE.Group(); private trail!: THREE.Mesh;
  private boom = new THREE.Group();
  private tv!: THREE.MeshBasicMaterial;
  private snow!: THREE.Points;

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el)); c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    const cm = [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud));
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cm[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.layers.set(NOINK); this.clouds.push(m); R.add(m);
    }
    for (let s = 0; s < 9; s++) { const g = new THREE.Group(); g.position.set(OX(s), 0, 0); this.sets.push(g); R.add(g); }
    // water (shared material)
    const wN = waterNear(), wF = waterFar();
    for (const t of [wN, wF]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wN }, wFarTex: { value: wF }, wTime: { value: 0 },
    };
    const wm = new THREE.MeshLambertMaterial({ color: 0xffffff });
    wm.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", WATER_DECL).replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    wm.customProgramCacheKey = () => "franco-water";
    const water = (set: number, x0: number, x1: number, z0: number, z1: number) => { const w = new THREE.Mesh(flatQuad(x0, x1, z0, z1, 0, 1, 1), wm); w.receiveShadow = true; this.sets[set].add(w); };
    const cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    const wall = lam("fQuayWall", () => ({ map: stoneHD("fQuayWall", ["#c9bcaa", "#bfb19f", "#d1c5b4", "#b8aa97"], "#958776") }));
    const cope = lam("copeHD", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));

    // ===== 0: Ferrol =====
    {
      const b = new Batch(), QE = -10;
      b.add(flatQuad(-300, 300, QE, 120, QY, 150, 32), cobble);
      const wl = panel(-300, 300, -1, QY, QE, 150, 1); wl.rotateY(Math.PI); wl.translate(0, 0, 2 * QE); b.add(wl, wall);
      b.add(boxGeo(V(-300, QY - 0.05, QE - 0.1), V(300, QY + 0.12, QE + 0.9), 2), cope);
      for (let x = -40; x <= 40; x += 7) b.add(boxGeo(V(x - 0.25, QY, QE + 0.3), V(x + 0.25, QY + 0.7, QE + 0.8)), lam("fBollard", () => ({ color: "#3a3a42" })));
      let x = -120, si = 0;
      while (x < 120) { const w = [7, 9, 8][si % 3], h = [9, 11, 10, 8][si % 4]; house(b, x + w / 2, 14, Math.PI, w, 8, h, si * 3 + 2, QY); x += w + 0.3; si++; }
      // la otra orilla: monte verde y casas
      b.add(flatQuad(-500, 500, -700, -230, 1.5, 100, 47), lam("fGrass", () => ({ color: "#6f9a52" })));
      for (let k = 0; k < 7; k++) { const g = new THREE.SphereGeometry(1, 20, 10); g.scale(70 + hh(k) * 40, 30 + hh(k, 2) * 22, 50); g.translate(-260 + k * 90, 0, -300 - hh(k, 3) * 40); b.add(g, lam("fHill", () => ({ color: "#5f8a48" }))); }
      for (let k = 0; k < 16; k++) house(b, -170 + k * 22 + hh(k) * 6, -240, 0, 8, 8, 8 + hh(k, 4) * 4, k * 5 + 1, 1.5);
      steamship(b, 74, 9, MRot(0.1, -10, 0, -52));
      steamship(b, 64, 8, MRot(-0.25, 52, 0, -112));
      steamship(b, 60, 8, MRot(0.35, -78, 0, -150));
      b.build(this.sets[0]);
      water(0, -700, 700, -900, QE);
      // cartel FERROL 1892 sobre postes, orientado al plano aéreo
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(16, 4.4), lam("signFerrol", () => ({ map: signBoard("sFerrol", ["FERROL · 1892"], 1024, 282, "#f4ecd8", "#24345e", "#b8352f"), side: THREE.DoubleSide })));
      const yaw = Math.atan2(53 + 8, 32 - 2);
      sg.position.set(-8, QY + 4.6, 2); sg.rotation.y = yaw; sg.castShadow = true; this.sets[0].add(sg);
      const pb = new Batch(); for (const s of [-1, 1]) pb.add(rod(V(-8 + s * 6.5 * Math.cos(yaw), QY, 2 - s * 6.5 * Math.sin(yaw)), V(-8 + s * 6.5 * Math.cos(yaw), QY + 2.6, 2 - s * 6.5 * Math.sin(yaw)), 0.18, 0.18), lam("fPost", () => ({ color: "#6e4b33" })));
      pb.build(this.sets[0]);
    }
    // ===== 1: Escuela Naval =====
    {
      const b = new Batch();
      b.add(flatQuad(-60, 60, -8, 60, 0, 30, 17), cobble);
      b.add(panel(-13, 13, 0, 13, -8, 1, 1), lam("navalFacade", () => ({ map: schoolFacade() })));
      b.add(boxGeo(V(-13.4, 12.9, -9), V(13.4, 13.6, -7.6)), cope);
      for (const x of [-30, 22]) b.add(boxGeo(V(x, 0, -14), V(x + 8, 10, -8.2)), lam("fSchoolSide", () => ({ map: stoneHD("fSchoolSide") })));
      b.build(this.sets[1]);
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.0), lam("signNaval", () => ({ map: signBoard("sNaval", ["ESCUELA", "NAVAL"], 512, 222, "#24345e", "#f4ecd8"), side: THREE.DoubleSide })));
      sg.position.set(0, 8.9, -7.9); this.sets[1].add(sg);
    }
    // ===== 2: Marruecos =====
    {
      const b = new Batch();
      const sand = lam("fSand", () => ({ map: rep(sandTex("sandM", "#e7c88c", ["#d9b878", "#f0d8a2", "#cfa868"]), 30, 30) }));
      b.add(flatQuad(-300, 300, -400, 60, 0, 1, 1), sand);
      for (let k = 0; k < 9; k++) { const g = new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(40 + hh(k) * 30, 6 + hh(k, 2) * 8, 30); g.translate(-200 + k * 50, 0, -120 - hh(k, 5) * 80); b.add(g, lam("fDune", () => ({ color: "#e2be7c" }))); }
      const wh = lam("moroHouse", () => ({ map: whiteHouse() }));
      for (let k = 0; k < 10; k++) { const x = -26 + k * 5.4 + hh(k) * 2, z = -16 - hh(k, 3) * 10, w = 4 + hh(k, 4) * 2, h = 3 + hh(k, 6) * 3; b.add(boxGeo(V(x - w / 2, 0, z - 3), V(x + w / 2, h, z + 2)), wh); b.add(boxGeo(V(x - w / 2 - 0.1, h, z - 3.1), V(x + w / 2 + 0.1, h + 0.3, z + 2.1)), lam("moroTop", () => ({ color: "#ece4d2" }))); }
      b.add(new THREE.CylinderGeometry(1.4, 1.7, 14, 8).translate(14, 7, -30), wh);
      for (const [x, z, h] of [[-5, -8, 7], [6, -10, 8.5], [-11, -12, 6.5], [11, -6, 6], [-17, -20, 8]]) palm(b, x, z, h, x * 3 + z);
      b.build(this.sets[2]);
    }
    // ===== 3: mapa =====
    {
      this.mapTop = twoTone(new THREE.MeshLambertMaterial({ map: mapTex(0) }));
      const side = lam("mapSide", () => ({ color: "#9a7650" }));
      const m = new THREE.Mesh(landGeo(PENINSULA, 1.2), [this.mapTop, side]); m.castShadow = true; m.receiveShadow = true; this.sets[3].add(m);
      const nb = lam("mapNeighbour", () => ({ color: "#a9b49a" }));
      for (const pts of [FRANCE, AFRICA]) { const g = landGeo(pts, 0.6); const n = new THREE.Mesh(g, [nb, side]); n.receiveShadow = true; this.sets[3].add(n); }
      water(3, -700, 700, -700, 700);
      const pb = new Batch(); planeGeo(pb, false);
      for (let k = 0; k < 3; k++) { const g = new THREE.Group(); pb.build(g); if (k < 2) planeGeo(pb, false); g.scale.setScalar(0.5); this.sets[3].add(g); this.planes.push(g); }
    }
    // ===== 4: posguerra =====
    {
      const b = new Batch();
      b.add(flatQuad(-40, 40, -80, 30, 0, 20, 27), cobble);
      const pw = panel(-4, 20, 0, 4, 0, 1, 1); pw.rotateY(Math.PI / 2); pw.translate(-3.98, 0, 0); // muro a la izquierda, de cara a +x
      b.add(pw, lam("posters39", () => ({ map: posterWall() })));
      b.add(boxGeo(V(-4.6, 0, -20), V(-4.01, 4.2, 4)), lam("fGreyWall", () => ({ color: "#a89c8a" })));
      for (let k = 0; k < 7; k++) house(b, 9, 6 - k * 10, -Math.PI / 2, 9.6, 9, 9 + (k % 3) * 2, k * 2 + 5, 0);
      for (let k = 0; k < 4; k++) house(b, -10 + k * 9.4, -44, 0, 9, 9, 10 + (k % 2) * 2, k * 3 + 7, 0);
      for (let k = 0; k < 4; k++) house(b, -10, -24 - k * 0.1 - k * 9, Math.PI / 2, 9, 9, 11, k + 11, 0);
      b.build(this.sets[4]);
    }
    // ===== 5: Pirineos y frontera =====
    const snowM = lam("fSnow", () => ({ map: rep(snowTex(), 24, 24) }));
    {
      const b = new Batch();
      b.add(flatQuad(-400, 400, -500, 60, 0, 1, 1), snowM);
      for (let k = 0; k < 9; k++) { const h = 70 + hh(k) * 60; const g = new THREE.ConeGeometry(60 + hh(k, 2) * 40, h, 7); g.translate(-280 + k * 70, h / 2 - 2, -180 - hh(k, 4) * 120); b.add(g, lam("fMount", () => ({ color: "#dde4ee" }))); g.computeVertexNormals(); }
      for (let k = 0; k < 40; k++) { const x = -60 + hh(k) * 120, z = -10 - hh(k, 1) * 90; if (Math.abs(z + 15 + (x - 2) * 0.0) < 0) continue; if (x > -12 && x < 24 && z > -40) continue; pine(b, x, z, 5 + hh(k, 2) * 5); }
      // sendero pisado
      b.add(flatQuad(-12, 20, -36, 6, 0.02, 1, 1).rotateY(0), lam("fPath", () => ({ color: "#cfd6e2" })));
      // caseta y poste de frontera
      b.add(boxGeo(V(18.5, 0, -38), V(22, 2.8, -35)), lam("fHut", () => ({ color: "#8a6a4a" })));
      b.add(boxGeo(V(18.2, 2.8, -38.3), V(22.3, 3.1, -34.7)), lam("fHutRoof", () => ({ color: "#eef3f8" })));
      b.add(boxGeo(V(13.6, 0, -34.3), V(14.0, 1.2, -33.9)), lam("fBoomPost", () => ({ color: "#3a3a42" })));
      b.build(this.sets[5]);
      const bm = lam("boomStripe", () => ({ map: stripeTex("boomS", "#c0353a", "#f6f1e6", 10) }));
      const bg = new THREE.CylinderGeometry(0.09, 0.09, 6, 8); bg.rotateZ(Math.PI / 2); bg.translate(3, 0, 0);
      const boom = new THREE.Mesh(bg, bm); boom.castShadow = true; this.boom.add(boom); this.boom.position.set(13.8, 1.1, -34.1); this.sets[5].add(this.boom);
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.68), lam("signFront", () => ({ map: signBoard("sFront", ["FRONTERA"], 512, 158, "#f4ecd8", "#24345e", "#24345e"), side: THREE.DoubleSide })));
      sg.position.set(19.75, 2.3, -34.95); this.sets[5].add(sg);
    }
    // ===== 6: frente ruso, nieve y abedules =====
    {
      const b = new Batch();
      b.add(flatQuad(-400, 400, -500, 60, 0, 1, 1), snowM);
      for (let k = 0; k < 46; k++) { const x = -40 + hh(k) * 80, z = -6 - hh(k, 1) * 60; birch(b, x, z, 7 + hh(k, 2) * 5, k); }
      b.build(this.sets[6]);
    }
    // ===== 7: playa de los sesenta =====
    {
      const b = new Batch();
      const sand = lam("fBeach", () => ({ map: rep(sandTex("sandB", "#f1dca6", ["#e6cc90", "#f8e8be", "#dcc084"]), 30, 30) }));
      b.add(flatQuad(-300, 300, -5, 120, 0.05, 1, 1), sand);
      water(7, -700, 700, -900, -5);
      const hot = [["#f4efe4", "#e2453c"], ["#e9f1f4", "#2f7fc2"], ["#f6ead6", "#f0b030"], ["#f1f1ec", "#2e9a6a"]];
      for (let k = 0; k < 9; k++) {
        const x = -10 + k * 15, h = 22 + (k % 3) * 9, [wc, bc] = hot[k % 4];
        const m = lam(`hotel${k % 4}`, () => ({ map: hotelTex(`hotelT${k % 4}`, wc, bc) }));
        b.add(boxGeo(V(x, 0, 26), V(x + 12, h, 36)), m);
      }
      for (let k = 0; k < 14; k++) umbrella(b, -4 + k * 2.6 + hh(k) * 1.2, 4 + hh(k, 2) * 9, k);
      for (let k = 0; k < 10; k++) b.add(boxGeo(V(-3 + k * 3.1, 0.06, 5 + hh(k, 7) * 7), V(-1.9 + k * 3.1, 0.1, 6.9 + hh(k, 7) * 7)), lam("towel" + (k % 4), () => ({ color: ["#e2453c", "#2f7fc2", "#f0b030", "#f6f1e6"][k % 4] })));
      b.build(this.sets[7]);
      const jb = new Batch(); planeGeo(jb, true); jb.build(this.jet); this.jet.scale.setScalar(1.2); this.sets[7].add(this.jet);
      this.trail = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 1, 10).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.85 }));
      this.trail.layers.set(NOINK); this.sets[7].add(this.trail);
    }
    // ===== 8: salón de 1975 =====
    {
      const b = new Batch();
      b.add(flatQuad(-3, 3.5, -3, 3, 0, 1, 1), lam("fFloor", () => ({ map: rep(planksHD(), 1.5, 1.5) })));
      b.add(panel(-3, 3.5, 0, 2.7, -3, 3, 1.35), lam("wall70", () => ({ map: wallpaper() })));
      const lw = panel(-3, 3, 0, 2.7, 0, 3, 1.35); lw.rotateY(Math.PI / 2); lw.translate(-3, 0, 0); b.add(lw, lam("wall70", () => ({ map: wallpaper() })));
      const win = panel(-1.4, 0.2, 0.9, 2.2, 0, 1, 1); win.rotateY(Math.PI / 2); win.translate(-2.98, 0, 0); b.add(win, lam("win75", () => ({ map: windowTex() })));
      b.add(boxGeo(V(-3, 0, -3), V(3.5, 0.12, -2.95)), lam("skirt", () => ({ color: "#6b4a30" })));
      const wood = lam("tvWood", () => ({ color: "#6b4a30" })), dark = lam("tvDark", () => ({ color: "#2a2628" }));
      b.add(boxGeo(V(-0.1, 0, -2.95), V(1.3, 0.62, -2.4)), wood);            // mueble
      b.add(boxGeo(V(0.18, 0.62, -2.9), V(1.02, 1.3, -2.36)), wood);           // televisor
      b.add(boxGeo(V(0.22, 0.66, -2.37), V(0.98, 1.26, -2.35)), dark);
      b.add(rod(V(0.5, 1.3, -2.6), V(0.3, 1.75, -2.65), 0.012, 0.012, 4), dark); b.add(rod(V(0.7, 1.3, -2.6), V(0.95, 1.72, -2.62), 0.012, 0.012, 4), dark); // antena
      b.add(panel(-1.85, -1.35, 1.3, 2.0, -2.98, 1, 1), lam("cal1975", () => ({ map: calendarTex() })));
      // sillón y lámpara
      const mus = lam("sofa70", () => ({ color: "#c9a23a" }));
      b.add(boxGeo(V(-2.8, 0, -1.2), V(-1.7, 0.45, 0.4)), mus); b.add(boxGeo(V(-2.95, 0, -1.2), V(-2.6, 0.95, 0.4)), mus);
      b.add(rod(V(2.6, 0, -2.5), V(2.6, 1.6, -2.5), 0.03, 0.03, 6), dark); b.add(new THREE.CylinderGeometry(0.18, 0.32, 0.36, 16, 1, true).translate(2.6, 1.7, -2.5), lam("lampShade", () => ({ color: "#f0e2bc", side: THREE.DoubleSide })));
      b.build(this.sets[8]);
      this.tv = new THREE.MeshBasicMaterial({ map: tvScreen(0), toneMapped: false });
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.5), this.tv); sc.position.set(0.6, 0.96, -2.345); this.sets[8].add(sc);
    }
    // nieve que cae (decorados 5 y 6)
    {
      const n = 1400, p = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { p[i * 3] = (hh(i) - 0.5) * 40; p[i * 3 + 1] = hh(i, 1) * 12; p[i * 3 + 2] = -hh(i, 2) * 30 + 8; }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
      this.snow = new THREE.Points(g, new THREE.PointsMaterial({ color: "#ffffff", size: 0.07, transparent: true, opacity: 0.9, fog: false }));
      this.snow.layers.set(NOINK); this.snow.frustumCulled = false; R.add(this.snow);
    }
    // sol relativo a la cámara de cada plano (preset de día)
    const L0 = LIGHTS.day;
    for (let i = 0; i < CUTS.length; i++) {
      const a = camLocal(CUTS[i]), z = camLocal((i + 1 < CUTS.length ? CUTS[i + 1] : TOTAL) - 1);
      let fx = (a.look[0] - a.pos[0]) + (z.look[0] - z.pos[0]), fz = (a.look[2] - a.pos[2]) + (z.look[2] - z.pos[2]);
      const nn = Math.hypot(fx, fz) || 1; fx /= nn; fz /= nn;
      const az = THREE.MathUtils.degToRad(i >= 11 ? 120 : i === 10 ? -70 : 62), el = THREE.MathUtils.degToRad(i >= 11 ? 58 : i === 7 || i === 8 || i === 9 ? 30 : L0.el);
      const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
      this.sunDirs.push(new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize());
    }
  }

  // ---- tarjetas ----
  private person(key: string, draw: (p: Pen) => void, x: number, y: number, z: number, cam: THREE.PerspectiveCamera, s = 1, mirror = false, blob = true) {
    while (this.actors.length <= this.nA) this.actors.push(new Actor(this.root));
    const a = this.actors[this.nA++];
    a.r = this.pool.req(key, 600, 1000, 1, draw);
    a.mesh.visible = true; a.mesh.position.set(x, y, z);
    a.mesh.rotation.set(0, Math.atan2(cam.position.x - x, cam.position.z - z), 0);
    a.mesh.scale.set(mirror ? -s : s, s, s); a.mesh.castShadow = false;
    if (blob) this.card("blob|contact|#9da0bd", 128, 128, (p) => fxContact(p, "#9da0bd"), x, y + 0.02, z, 0.6 * s, 0.45 * s, cam, "floor");
  }
  private card(key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, cam: THREE.PerspectiveCamera, yaw: number | "bill" | "floor" = "bill", soft = false) {
    while (this.fxs.length <= this.nF) this.fxs.push(new Fx(this.root));
    const e = this.fxs[this.nF++];
    e.r = this.pool.req(key, cw, ch, 1, draw); e.use(soft);
    e.mesh.visible = w > 0.001; e.mesh.position.set(x, y, z); e.mesh.scale.set(Math.max(w, 0.001), Math.max(h, 0.001), 1);
    if (yaw === "floor") e.mesh.rotation.set(-Math.PI / 2, 0, 0);
    else e.mesh.rotation.set(0, yaw === "bill" ? Math.atan2(cam.position.x - x, cam.position.z - z) : yaw, 0);
  }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, L0 = LIGHTS.day, K0 = LOOK.day, i = shotOf(f), set = SET_OF[i], ox = OX(set);
    const c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = i >= 11 ? 0.05 : 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    this.sets.forEach((g, k) => (g.visible = k === set));
    // luces
    this.hemi.color.set(L0.sky); this.hemi.groundColor.set(L0.ground); this.hemi.intensity = L0.hemiI;
    this.sun.color.set(L0.sunCol); this.sun.intensity = L0.sunI;
    const FOC: V3[] = [[2, 3, -10], [-5, 0, -50], [0, 2, -5], [0, 1.5, -4], [-3, 0, 0], [-8, 0, 4], [-3, 1.5, -9], [3, 1, -12], [16, 1, -33], [1, 1, -2], [4, 1, 8], [0, 1, -1.5], [0.6, 1, -2.4]];
    const RR = [22, 95, 22, 24, 48, 44, 26, 34, 12, 24, 40, 6, 6];
    const fo = V(FOC[i][0] + ox, FOC[i][1], FOC[i][2]), Rr = RR[i];
    this.sun.position.copy(fo).addScaledVector(this.sunDirs[i], 220); this.sun.target.position.copy(fo);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L0.bias; this.sun.shadow.normalBias = L0.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L0.lit); TONE.uShadeCol.value.set(...L0.shade); TONE.uShadeLift.value.set(...L0.lift);
    TONE.uLambert.value = L0.lambert; TONE.uSideK.value = L0.sideK; TONE.uTerm.value = L0.term; TONE.uBounce.value.set(...K0.bounce); TONE.uSat.value = K0.sat;
    CHAR.uCharTint.value.set(...L0.charTint); CHAR.uCharShade.value = L0.charShade; CHAR.uGrad.value = L0.charGrad;
    CHAR.uBodyGrad.value = L0.bodyGrad; CHAR.uSideTint.value.set(...L0.sideTint);
    // cielo y niebla por decorado
    const GREY = ["#c9ccd2", "#b9bec7", "#a7aebb", "#98a0b0", "#8a93a6"], SNOWSKY = ["#dfe3ea", "#d0d6e0", "#bec7d6", "#aab5c8", "#97a4bb"];
    const WARM = ["#f2dcb0", "#cfe0f0", "#8fbbe6", "#5f97dc", "#3a78cc"];
    const skyC = set === 4 ? GREY : set === 5 || set === 6 ? SNOWSKY : set === 2 ? WARM : K0.sky.c;
    const su = this.skyMat.uniforms;
    skyC.forEach((h, k) => untone(h, su["c" + k].value));
    const e = K0.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(set === 4 ? "#b9bec7" : set === 5 || set === 6 ? "#d6dce6" : set === 2 ? "#ecdcc0" : L0.fog, this.fog.color);
    this.fog.near = set === 5 || set === 6 ? 25 : cam.position.y > 15 ? 160 : 60;
    this.fog.far = set === 5 || set === 6 ? 260 : set === 8 ? 200 : cam.position.y > 15 ? 700 : 520;
    scene.fog = this.fog; scene.background = null;
    const cloudsOn = set === 0 || set === 2 || set === 7;
    this.clouds.forEach((m, k) => {
      m.visible = cloudsOn;
      const a = Math.atan2(c.look[2] - c.pos[2], c.look[0] - c.pos[0]) + (k - 4) * 0.28, d = 640 + (k % 3) * 60, w = 140 + (k % 4) * 34;
      m.position.set(cam.position.x + Math.cos(a) * d, 150 + (k % 4) * 46, cam.position.z + Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
    });
    const Wu = this.WU, wc = K0.water;
    untone(cam.position.y > 15 ? wc.mid : wc.near, Wu.wNearC.value); untone(wc.mid, Wu.wMidC.value); untone(wc.far, Wu.wFarC.value);
    untone(wc.crest, Wu.wCrest.value); untone(wc.trough, Wu.wTrough.value); untone(wc.glint, Wu.wGlint.value);
    Wu.wShade.value.set(...wc.shade); Wu.wTime.value = t;
    // nieve
    this.snow.visible = set === 5 || set === 6;
    if (this.snow.visible) {
      this.snow.position.set(cam.position.x - (cam.position.x - ox) * 0, 0, 0); this.snow.position.x = ox + (i === 8 ? 14 : 2);
      const p = this.snow.geometry.attributes.position as THREE.BufferAttribute, a = p.array as Float32Array;
      for (let k = 0; k < p.count; k++) { a[k * 3 + 1] = ((hh(k, 1) * 12 - t * (0.7 + 0.4 * hh(k, 3))) % 12 + 12) % 12; a[k * 3] = (hh(k) - 0.5) * 40 + 0.4 * Math.sin(t * 0.8 + k); }
      p.needsUpdate = true;
    }

    // ---- personajes y efectos ----
    this.nA = 0; this.nF = 0;
    for (const a of this.actors) a.mesh.visible = false;
    for (const e2 of this.fxs) e2.mesh.visible = false;
    const tw = Math.floor(f / 2) * 2 / FPS; // dibujos a dos fotogramas
    const blink = (seed: number) => ((Math.floor(t * 0.7 + seed) % 5 === 0 && (t * 0.7 + seed) % 1 < 0.08) ? 1 : 0);
    const X = (x: number) => x + ox;
    if (set === 0) {
      // el niño marinero en el muelle; en "marino" saluda
      const salute = t > W.marino - 0.1;
      const wave = salute ? Math.round(Math.sin(tw * 7) * 30) / 30 : undefined;
      if (i === 1) { const s = pop(t, W.ferrol, 0.25); if (s > 0) this.card("ferrol1892", 1024, 256, (p) => { const g = p.g; g.fillStyle = "#f4ecd8"; g.fillRect(10, 10, 1004, 236); g.strokeStyle = "#b8352f"; g.lineWidth = 14; g.strokeRect(24, 24, 976, 208); text(g, "FERROL · 1892", 512, 132, 130, "#24345e"); }, X(4), 16, -38, 19 * s, 4.75 * s, cam); }
      if (i === 0) this.person(`kid|${wave}|${blink(0.3)}`, (p) => bodyFront(p, SAILOR_KID, { mode: "stand", expr: salute ? "grin" : "smile", wave, blink: blink(0.3), seed: SEED_F }), X(3.6), QY, -6.5, cam, 0.72);
      // gente en el muelle (vista aérea)
      for (let k = 0; k < 14; k++) {
        const o = plain(k, ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a"]);
        const x = -30 + k * 4.4 + hh(k) * 2, z = -6 + hh(k, 3) * 10;
        if (i === 0 && Math.abs(x - 3.6) < 3) continue;
        this.person(`ferrol|${k}|${blink(k * 0.37)}`, (p) => bodyFront(p, o, { mode: "stand", expr: "neutral", blink: blink(k * 0.37), seed: (k % 7) + 1 }), X(x), QY, z, cam, 1);
      }
    } else if (set === 1) {
      // cadete ante la escuela; en "acaba" pasa a uniforme del Ejército de Tierra
      const army = t >= W.acaba;
      const o = army ? ARMY : CADET, ex: Expr = t > W.cierra + 0.2 && !army ? "shock" : army ? "neutral" : "smile";
      this.person(`cadet|${army}|${ex}|${blink(0.6)}`, (p) => bodyFront(p, o, { mode: "stand", expr: ex, blink: blink(0.6), seed: SEED_F }), X(0), 0, -3.5, cam, 0.96);
      const sCl = pop(t, W.cierra, 0.22);
      if (sCl > 0) this.card("cerrado", 512, 200, (p) => { const g = p.g; g.fillStyle = "#c0353a"; g.fillRect(8, 8, 496, 184); g.strokeStyle = "#f6f1e6"; g.lineWidth = 10; g.strokeRect(22, 22, 468, 156); text(g, "CERRADO", 256, 102, 96, "#f6f1e6", INK, 10); }, X(0), 2.7, -7.86, 2.0 * sCl, 0.78 * sCl, cam, 0);
      const pt = (t - W.acaba) / 0.45;
      if (pt >= 0 && pt < 1) this.card(`puff|${Math.floor(pt * 8)}`, 300, 300, (p) => fxPuff(p, Math.floor(pt * 8) / 8), X(0), 1.6, -3.3, 2.2, 2.2, cam, "bill", true);
    } else if (set === 2) {
      const gen = t >= W.general;
      this.person(`officer|${gen}|${blink(0.9)}`, (p) => bodyFront(p, gen ? GENERAL : ARMY, { mode: "stand", expr: gen ? "smile_closed" : "neutral", blink: blink(0.9), seed: SEED_F }), X(0), 0, 0, cam, 1);
      const starT = [W.asciende, W.tan, W.rapido, W.que];
      starT.forEach((t0, k) => {
        const s = pop(t, t0, 0.18);
        if (s > 0) this.card("star", 256, 256, (p) => { const pts: [number, number][] = []; for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + (j * Math.PI) / 5, r = j % 2 ? 46 : 112; pts.push([128 + r * Math.cos(a), 132 + r * Math.sin(a)]); } p.poly(pts, "#f0c445", 12); }, X(-0.72 + k * 0.48), 2.95, 0.05, 0.4 * s, 0.4 * s, cam);
      });
      const sb = pop(t, W.treinta, 0.22);
      if (sb > 0) this.card("badge33", 400, 400, (p) => { const g = p.g; p.ell(200, 200, 180, 180, "#f0c445", 14); p.ell(200, 200, 140, 140, "#e2a92e", 8); text(g, "33", 200, 178, 150, "#ffffff", INK, 14); text(g, "AÑOS", 200, 290, 52, "#ffffff", INK, 9); }, X(0), 3.6, 0.1, 0.95 * sb, 0.95 * sb, cam);
      const bt = (t - W.general) / 0.5;
      if (bt >= 0 && bt < 1) this.card(`burst|${Math.floor(bt * 10)}`, 500, 500, (p) => fxBurst(p, Math.floor(bt * 10) / 10, "#fff3b0"), X(0), 1.4, -0.2, 3.2, 3.2, cam);
    } else if (set === 3) {
      this.mapTop.map = mapTex(t >= W.guerra ? 2 : t >= W.golpe ? 1 : 0);
      if (i === 4) {
        const s = pop(t, 24.72, 0.25);
        if (s > 0) this.card("julio36", 1024, 256, (p) => { const g = p.g; g.fillStyle = "#f4ecd8"; g.fillRect(10, 10, 1004, 236); g.strokeStyle = "#24345e"; g.lineWidth = 14; g.strokeRect(24, 24, 976, 208); text(g, "JULIO 1936", 512, 132, 150, "#24345e"); }, X(0), 14, -36, 30 * s, 7.5 * s, cam);
      }
      // aviones alemanes e italianos (sin insignias) llegan desde el sur, como el puente aéreo desde Marruecos
      const ft = t - (W.hitler - 0.25);
      this.planes.forEach((g, k) => {
        g.visible = i === 5 && ft > 0;
        const [x0, z0] = MP(-6.0, 34.2), [x1, z1] = MP(-6.1, 38.6);
        const u = Math.min(1, ft / 3.0), off = [[0, 0], [-3.2, 2.6], [3.2, 2.6]][k];
        g.position.set(lerp(x0, x1, u) + off[0], 9 + 0.3 * Math.sin(t * 2 + k), lerp(z0, z1, u) + off[1]);
        g.rotation.set(0, Math.PI / 2, 0.06 * Math.sin(t * 1.5 + k));
      });
    } else if (set === 4) {
      for (let k = 0; k < 4; k++) {
        const o = plain(k, ["#4a4a52", "#5a4e44", "#3e4450", "#56524a"]);
        this.person(`pg|${k}|${blink(k * 0.7)}`, (p) => bodyFront(p, o, { mode: "stand", expr: "neutral", blink: blink(k * 0.7), seed: (k % 7) + 2 }), X(-1 + k * 1.7 + hh(k) * 0.6), 0, -24 - hh(k, 2) * 6, cam, 1);
      }
      const s = pop(t, W.censura - 0.05, 0.16);
      if (s > 0) this.card("censurado", 512, 200, (p) => { const g = p.g; g.save(); g.translate(256, 100); g.rotate(-0.12); g.strokeStyle = "#c0353a"; g.lineWidth = 14; g.strokeRect(-230, -70, 460, 140); text(g, "CENSURADO", 0, 4, 78, "#c0353a"); g.restore(); }, X(-3.95), 2.15, -13.4, 2.0 * (1 + 0.4 * (1 - s)), 0.78 * (1 + 0.4 * (1 - s)), cam, Math.PI / 2);
    } else if (set === 5) {
      this.boom.rotation.z = i === 7 ? 1.35 : 0;
      if (i === 7) {
        // exiliados caminando hacia la frontera (febrero de 1939)
        for (let k = 0; k < 9; k++) {
          const o = plain(k + 3, ["#5b5048", "#4a5058", "#6a5a48", "#3f4650"]);
          if (k === 4) o.build = "kid";
          const d = 1.0 * (t - CUTS[7] / FPS) + k * 2.4 - 4; // metros recorridos por el sendero
          const u = d / 42, x = lerp(-10, 18, u), z = lerp(4, -32, u);
          const ph = ((tw * 0.6 + hh(k, 9)) % 1);
          const phq = Math.round(ph * 12) / 12;
          this.person(`ex|${k}|${phq}`, (p) => bodySide(p, o, { mode: "march", phase: phq, stride: 0.75, expr: "neutral", seed: (k % 7) + 1 }), X(x), 0, z, cam, k === 4 ? 0.72 : 1);
        }
      } else {
        // guardia junto a la barrera bajada
        this.person(`guard|${blink(0.2)}`, (p) => bodyFront(p, { ...ARMY, jacket: "#5a6a4a", pants: "#4a5a3a", hat: "cap", cap: "#4a5a3a" }, { mode: "stand", expr: "stern", blink: blink(0.2), seed: 6 }), X(19), 0, -33.2, cam, 1);
      }
    } else if (set === 6) {
      // la División Azul marchando en la nieve
      for (let k = 0; k < 12; k++) {
        const row = k % 2, x = -7 + Math.floor(k / 2) * 1.9 + (t - CUTS[9] / FPS) * 1.1 + row * 0.6, z = -row * 1.4;
        const phq = Math.round(((tw * 0.85 + row * 0.5) % 1) * 12) / 12;
        this.person(`div|${row}|${phq}`, (p) => bodySide(p, { ...DIV, skin: SKINS[k % 3] }, { mode: "march", phase: phq, stride: 0.9, expr: "stern", seed: (k % 5) + 1 }), X(x), 0, z, cam, 1);
      }
    } else if (set === 7) {
      // turistas en la playa
      const cols = ["#e2453c", "#2f7fc2", "#f0b030", "#2e9a6a", "#e86ea0", "#7b5ac9"];
      for (let k = 0; k < 16; k++) {
        const o = plain(k, cols, false); if (k % 5 === 2) o.build = "kid";
        const x = -3 + k * 2.2 + hh(k, 4) * 1.4, z = 6 + hh(k, 5) * 7, sit = k % 3 === 0;
        const wave = k % 4 === 1 ? Math.round(Math.sin(tw * 6 + k) * 30) / 30 : undefined;
        const hop = o.build === "kid" ? 0.12 * Math.sin(Math.PI * ((t * 1.5 + hh(k, 7)) % 1)) ** 2 : 0;
        this.person(`beach|${k}|${wave}|${blink(k * 0.3)}`, (p) => bodyFront(p, o, { mode: sit ? "sit" : "stand", expr: k % 2 ? "smile" : "grin", wave, blink: blink(k * 0.3), seed: (k % 7) + 1 }), X(x), 0.05 + hop, z, cam, o.build === "kid" ? 0.72 : 1);
      }
      // reactor estadounidense cruzando el cielo con su estela
      const jt = t - (W.eeuu - 0.4), u = jt / 4.2;
      this.jet.visible = jt > 0 && u < 1; this.trail.visible = this.jet.visible;
      if (this.jet.visible) {
        const p0 = V(-60, 46, -40), p1 = V(160, 52, -40), p = p0.clone().lerp(p1, u);
        this.jet.position.copy(p); this.jet.rotation.set(0, 0, 0.05);
        const len = Math.max(0.1, p.x - p0.x - 6);
        this.trail.position.set(p.x - 6 - len / 2, p.y, p.z); this.trail.scale.set(len, 1, 1);
      }
    } else if (set === 8) {
      this.tv.map = tvScreen(t >= W.transicion ? 2 : t >= W.juan ? 1 : 0);
    }
    if (set !== 7) { this.jet.visible = false; this.trail.visible = false; }
    if (set !== 3) this.planes.forEach((g) => (g.visible = false));
    this.pool.flush();
    for (const a of this.actors) if (a.mesh.visible) a.bind();
    for (const e2 of this.fxs) if (e2.mesh.visible) e2.bind();
  }
}
