// "El Vasa": preview de 10 s (gancho + flash-forward + Estocolmo): Stockholm harbour, 10 August 1628. Same look as the bridge short: two-tone world,
// painted canvas textures, flat cartoon cards for people, ink lines, lens blur, grade. Reuses the bridge modules.
import * as THREE from "three";
import { LIGHTS, LOOK } from "../bridge/lights";
import { TONE, CHAR, LFB, twoTone, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Batch, V, lam, boxGeo, house } from "../bridge/build";
import { ctex, rep, stoneHD, cobbleHD, waterNear, waterFar, cloudHD, planksHD } from "../bridge/paint";
import { Pool, Actor, Fx } from "../bridge/cast";
import { bodyFront, townsfolk, KID, fxContact, Expr, Outfit } from "../bridge/toon";

export const FPS = 30;
// shots (frames at 30 fps), timed to the narration words:
//  A hook crane over the crowd ("En 1628, Suecia construyó el barco de guerra más poderoso del mundo.")
//  B flash-forward: she heels over and goes down ("Se hundió antes de salir del puerto.")
//  C white flash, aerial of the harbour ("Estocolmo, 10 de agosto.")
export const SHOT_B = 177, SHOT_C = 256, TOTAL = 318; // voz "voz españa mia": "mundo." acaba en 5.64 s, "Estocolmo" empieza en 8.74 s, "agosto." acaba en 10.32 s
export const FLASH_AT = SHOT_C;
export const shotOf = (f: number) => (f < SHOT_B ? 0 : f < SHOT_C ? 1 : 2);
const smooth = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const ease = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2; };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type V3 = [number, number, number];
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------------- layout ----------------
const QUAY_Y = 2.0;          // quay top above the water
const QUAY_EDGE = -16;       // quay wall face (water for z < QUAY_EDGE)
export const SHIP_AT: V3 = [-1, 0, -100];
const SHIP_YAW = THREE.MathUtils.degToRad(128); // bow away to screen-left, gilded stern toward us

// ---------------- camera: crane up over the cheering crowd to reveal the ship ----------------
export const camAt = (f: number) => {
  const sh = shotOf(f);
  if (sh === 0) {
    const u = ease(f / (SHOT_B - 1));
    const pos = lerp3([-1.2, 3.1, 0.5], [1.5, 8.6, -7.5], u);
    const look = lerp3([0.2, 3.3, -12], [0.5, 19, -100], ease(Math.min(1, f / (SHOT_B * 0.77))));
    return { pos, look, fov: lerp(38, 40, u), roll: 0 };
  }
  if (sh === 1) {
    const u = (f - SHOT_B) / (SHOT_C - SHOT_B), e = ease(u);
    return { pos: lerp3([16, 3.0, -50], [13, 3.4, -57], e), look: lerp3([5, 12, -102], [4, 9, -102], e), fov: 40, roll: THREE.MathUtils.degToRad(-4 * e) };
  }
  const u = (f - SHOT_C) / (TOTAL - SHOT_C), e = ease(u);
  return { pos: lerp3([-10, 36, 30], [-12, 33, 24], e), look: lerp3([7, 3, -82], [3, 3, -86], e), fov: 40, roll: 0 };
};
/** lens blur: hook racks from the crowd to the ship; flash-forward soft background; aerial sharp */
export const dofAt = (f: number): { cInf: number; focus: V3 } => {
  const sh = shotOf(f);
  if (sh === 0) {
    const k = smooth((f - 30) / 70);
    return { cInf: lerp(13, 6, k), focus: lerp3([0, 3.6, -6.5], [SHIP_AT[0], 12, SHIP_AT[2]], k) };
  }
  if (sh === 1) return { cInf: 9, focus: [-3, 6, -104] };
  return { cInf: 0, focus: [-8, 0, -78] };
};

// ---------------- painted textures ----------------
const hullTex = () => ctex("vasaHull", 2048, 1024, (g, r) => {
  // u: 0 = stern .. 1 = bow (47 m); v: world y from -5 (bottom of canvas) to +15 (top) -> 51.2 px per metre
  const W = 2048, H = 1024, Y = (y: number) => H - ((y + 5) / 20) * H, X = (u: number) => u * W;
  g.fillStyle = "#6b4630"; g.fillRect(0, 0, W, H);
  // strakes: long planks with painted seams, slight colour jitter
  for (let y = -5; y < 15; y += 0.42) {
    g.fillStyle = ["#6f4a33", "#694430", "#74503a", "#664231"][Math.floor(r() * 4)];
    g.fillRect(0, Y(y + 0.42), W, Y(y) - Y(y + 0.42));
    g.fillStyle = "rgba(35,20,25,0.45)"; g.fillRect(0, Y(y) - 2, W, 2);
    for (let x = r() * 300; x < W; x += 260 + r() * 200) g.fillRect(x, Y(y + 0.42), 2, Y(y) - Y(y + 0.42));
  }
  // underwater / waterline band (tar)
  g.fillStyle = "#3a2a2a"; g.fillRect(0, Y(0.25), W, H - Y(0.25));
  // wales: dark heavy bands
  for (const y of [1.15, 3.45, 5.8]) { g.fillStyle = "#3b2a26"; g.fillRect(0, Y(y + 0.32), W, Y(y) - Y(y + 0.32)); g.fillStyle = "rgba(255,230,180,0.18)"; g.fillRect(0, Y(y + 0.32), W, 3); }
  // red frieze under the rail with gold scrolls
  const fr0 = 6.55, fr1 = 7.25;
  g.fillStyle = "#b8352f"; g.fillRect(0, Y(fr1 + 8), W, Y(fr0) - Y(fr1 + 8)); // whole upper works above the frieze line red (castle sides)
  g.fillStyle = "#6b4630"; g.fillRect(X(0.27), Y(fr1 + 8), W - X(0.27), Y(fr1) - Y(fr1 + 8));
  g.strokeStyle = "#e8b83a"; g.lineWidth = 5;
  for (let x = 10; x < W; x += 46) { g.beginPath(); g.arc(x, (Y(fr0) + Y(fr1)) / 2, 11, 0.3, 5.6); g.stroke(); }
  g.fillStyle = "#f0c445"; g.fillRect(0, Y(fr1) - 5, W, 6); g.fillRect(0, Y(fr0), W, 5);
  // stern castle side: red upper works between gold rails, a few small ports, gilded medallions,
  // and ONE quarter gallery at the very stern (two levels, two windows each) - no window grid
  g.fillStyle = "#f0c445";
  for (const y of [9.6, 11.9]) g.fillRect(0, Y(y) - 5, X(0.27), 8);
  for (let k = 0; k < 4; k++) { const x = X(0.1 + k * 0.042), s2 = 0.45 * 51.2; g.fillStyle = "#1c1420"; g.fillRect(x, Y(8.9), s2, s2); g.strokeStyle = "#f0c445"; g.lineWidth = 3; g.strokeRect(x - 2, Y(8.9) - 2, s2 + 4, s2 + 4); }
  for (let k = 0; k < 3; k++) {
    const cx = X(0.12 + k * 0.05), cy = Y(10.75);
    g.fillStyle = "#f0c445"; g.beginPath(); g.ellipse(cx, cy, 20, 28, 0, 0, 7); g.fill();
    g.fillStyle = "#c98a1e"; g.beginPath(); g.ellipse(cx, cy + 4, 9, 13, 0, 0, 7); g.fill();
  }
  const gx0 = X(0.005), gx1 = X(0.075);
  g.fillStyle = "#f0c445"; g.fillRect(gx0, Y(13.6), gx1 - gx0, Y(8.2) - Y(13.6));
  g.fillStyle = "#8f2a26"; g.fillRect(gx0 + 8, Y(13.4), gx1 - gx0 - 16, Y(8.4) - Y(13.4));
  for (const y0 of [8.9, 11.4]) for (const k of [0, 1]) {
    const x = gx0 + 18 + k * ((gx1 - gx0 - 36) / 2 + 4), w = (gx1 - gx0 - 44) / 2;
    g.fillStyle = "#f0c445"; g.fillRect(x - 4, Y(y0 + 1.7) - 4, w + 8, Y(y0) - Y(y0 + 1.7) + 8);
    g.fillStyle = "#2b2840"; g.fillRect(x, Y(y0 + 1.7), w, Y(y0) - Y(y0 + 1.7));
    g.fillStyle = "rgba(160,190,230,0.35)"; g.fillRect(x + 3, Y(y0 + 1.7) + 3, w * 0.35, Y(y0) - Y(y0 + 1.7) - 6);
    g.fillStyle = "#f0c445"; g.fillRect(x + w / 2 - 2, Y(y0 + 1.7), 4, Y(y0) - Y(y0 + 1.7));
  }
  // gun ports: two decks, red lids hinged open above dark ports with a muzzle
  const port = (u: number, y: number) => {
    const x = X(u), s = 0.62 * 51.2, top = Y(y + 0.62);
    g.fillStyle = "#c23a32"; g.fillRect(x - 3, top - s * 0.95, s + 6, s * 0.8);            // open lid (red inside)
    g.strokeStyle = "#e8b83a"; g.lineWidth = 3; g.strokeRect(x - 3, top - s * 0.95, s + 6, s * 0.8);
    g.fillStyle = "#1c1420"; g.fillRect(x, top, s, s);                                      // dark port
    g.fillStyle = "#c23a32"; g.fillRect(x, top, s, 4); g.fillRect(x, top + s - 4, s, 4);    // red port surround
    g.fillStyle = "#3d3a44"; g.beginPath(); g.arc(x + s / 2, top + s / 2, s * 0.26, 0, 7); g.fill(); // muzzle
    g.fillStyle = "#121016"; g.beginPath(); g.arc(x + s / 2, top + s / 2, s * 0.13, 0, 7); g.fill();
  };
  for (let i = 0; i < 12; i++) port(0.2 + i * 0.054, 2.05);
  for (let i = 0; i < 12; i++) port(0.215 + i * 0.054, 4.4);
  // rail cap gold
  g.fillStyle = "#f0c445"; g.fillRect(0, 0, W, 6);
});
const transomTex = () => ctex("vasaTransom2", 512, 1024, (g) => {
  // u: -HB..HB across, v: world y from -5 (bottom) to +15 (top), same as the hull: Y(y) in canvas px
  const Y = (y: number) => 1024 - ((y + 5) / 20) * 1024;
  g.fillStyle = "#6b4630"; g.fillRect(0, 0, 512, 1024);
  for (let y = -5; y < 8; y += 0.42) { g.fillStyle = "rgba(35,20,25,0.45)"; g.fillRect(0, Y(y), 512, 2); }
  g.fillStyle = "#3a2a2a"; g.fillRect(0, Y(0.25), 512, 1024 - Y(0.25));
  g.fillStyle = "#4a3226"; g.fillRect(236, Y(8), 40, Y(-5) - Y(8)); // rudder post
  g.fillStyle = "#3b2a26"; for (const y of [1.15, 3.45, 5.8]) g.fillRect(0, Y(y + 0.32), 512, Y(y) - Y(y + 0.32));
  // upper stern: red field framed in gold
  g.fillStyle = "#b8352f"; g.fillRect(0, 0, 512, Y(7.0));
  g.fillStyle = "#f0c445"; g.fillRect(0, Y(7.0) - 8, 512, 10); g.fillRect(0, 0, 512, 10); g.fillRect(0, 0, 14, Y(7)); g.fillRect(498, 0, 14, Y(7));
  // royal arms: gold cartouche, blue shield with three crowns, two gold lions as supporters
  const ay = Y(8.6);
  g.fillStyle = "#f0c445"; g.beginPath(); g.ellipse(256, ay, 92, 62, 0, 0, 7); g.fill();
  g.fillStyle = "#1f5aa6"; g.beginPath(); g.moveTo(206, ay - 44); g.lineTo(306, ay - 44); g.lineTo(306, ay + 10); g.quadraticCurveTo(256, ay + 60, 206, ay + 10); g.closePath(); g.fill();
  g.fillStyle = "#f2c230";
  for (const [x, y] of [[236, ay - 22], [276, ay - 22], [256, ay + 12]]) { g.beginPath(); g.moveTo(x - 13, y + 8); g.lineTo(x - 13, y - 7); g.lineTo(x - 5, y); g.lineTo(x, y - 10); g.lineTo(x + 5, y); g.lineTo(x + 13, y - 7); g.lineTo(x + 13, y + 8); g.fill(); }
  for (const sx of [-1, 1]) { g.fillStyle = "#e8b83a"; g.beginPath(); g.ellipse(256 + sx * 140, ay, 34, 50, sx * 0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(256 + sx * 128, ay - 50, 22, 20, 0, 0, 7); g.fill(); }
  // two rows of cabin windows (3 each) with gold frames and pilasters between
  for (const y0 of [10.4, 12.5]) {
    g.fillStyle = "#f0c445"; g.fillRect(14, Y(y0) + 2, 484, 10);
    for (let k = 0; k < 3; k++) {
      const x = 70 + k * 140, w = 92, h = Y(y0) - Y(y0 + 1.45);
      g.fillStyle = "#f0c445"; g.fillRect(x - 7, Y(y0 + 1.45) - 7, w + 14, h + 14);
      g.fillStyle = "#2b2840"; g.fillRect(x, Y(y0 + 1.45), w, h);
      g.fillStyle = "rgba(160,190,230,0.35)"; g.fillRect(x + 5, Y(y0 + 1.45) + 5, w * 0.3, h - 10);
      g.fillStyle = "#f0c445"; g.fillRect(x + w / 2 - 3, Y(y0 + 1.45), 6, h);
    }
  }
});
const sailTex = () => ctex("vasaSail", 512, 512, (g, r) => {
  g.fillStyle = "#f3ead3"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 43) { g.fillStyle = "rgba(150,120,90,0.28)"; g.fillRect(x, 0, 3, 512); g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.18)" : "rgba(200,180,140,0.12)"; g.fillRect(x + 3, 0, 40, 512); }
  g.fillStyle = "rgba(120,90,70,0.5)"; g.fillRect(0, 0, 512, 10); g.fillRect(0, 502, 512, 10); g.fillRect(0, 0, 8, 512); g.fillRect(504, 0, 8, 512);
});
const flagSE = () => ctex("flagSweden", 256, 160, (g) => {
  g.fillStyle = "#1f5aa6"; g.fillRect(0, 0, 256, 160);
  g.fillStyle = "#f2c230"; g.fillRect(0, 62, 256, 36); g.fillRect(80, 0, 36, 160);
});
const pennantTex = () => ctex("pennantSE", 512, 64, (g) => {
  g.fillStyle = "#f2c230"; g.fillRect(0, 0, 512, 32); g.fillStyle = "#1f5aa6"; g.fillRect(0, 32, 512, 32);
});

// ---------------- the ship (local: x = length, bow at +x; y up, waterline 0; z = beam) ----------------
const L = 47, HB = 5.85;
const hw = (u: number) => HB * (u < 0.45 ? 0.74 + 0.26 * smooth(u / 0.45) : Math.max(0.1, Math.cos(((u - 0.45) / 0.55) * Math.PI / 2) ** 0.75));
const topAt = (u: number) => 7.25 + 7.0 * smooth((0.27 - u) / 0.2) + 1.8 * smooth((u - 0.8) / 0.2);
const keelAt = (u: number) => -4.8 * (1 - 0.55 * smooth((u - 0.82) / 0.18)) * (1 - 0.15 * smooth((0.08 - u) / 0.08));
const sectW = (u: number, v: number) => {
  const b = Math.sin(Math.min(v / 0.42, 1) * Math.PI / 2) ** 0.55;
  return hw(u) * b * (1 - 0.16 * smooth((v - 0.62) / 0.38)); // tumblehome toward the rail
};
const hullGeo = (side: 1 | -1) => {
  const NU = 72, NV = 28, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
    const u = i / NU, v = j / NV, y = lerp(keelAt(u), topAt(u), v), x = -L / 2 + L * u;
    pos.push(x, y, side * sectW(u, v)); uv.push(u, (y + 5) / 20);
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const a = i * (NV + 1) + j, b = a + NV + 1;
    if (side > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
};
const transomGeo = () => {
  const s = new THREE.Shape(), NV = 20;
  for (let j = 0; j <= NV; j++) { const v = j / NV; const p = [sectW(0, v), lerp(keelAt(0), topAt(0), v)]; j ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]); }
  for (let j = NV; j >= 0; j--) { const v = j / NV; s.lineTo(-sectW(0, v), lerp(keelAt(0), topAt(0), v)); }
  const g = new THREE.ShapeGeometry(s);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + HB) / (2 * HB), (p.getY(i) + 5) / 20);
  g.rotateY(-Math.PI / 2); g.translate(-L / 2 + 0.02, 0, 0);
  return g;
};
const deckGeo = () => {
  const NU = 60, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NU; i++) {
    const u = i / NU, y = topAt(u) - 1.05, x = -L / 2 + L * u;
    const v = (y - keelAt(u)) / (topAt(u) - keelAt(u)), w = sectW(u, v) * 0.98;
    pos.push(x, y, -w, x, y, w); uv.push(x / 4, -w / 4, x / 4, w / 4);
    if (i < NU) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
};
const rod = (a: THREE.Vector3, b: THREE.Vector3, r0: number, r1 = r0, seg = 8) => {
  const d = b.clone().sub(a), len = d.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
};
/** sail between yard heights, width w across the ship (z), billowing toward the bow (+x) */
const sailGeo = (x: number, y0: number, y1: number, w0: number, w1: number, bulge: number) => {
  const NX = 14, NY = 10, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
    const s = i / NX, t = j / NY, w = lerp(w0, w1, t);
    pos.push(x + bulge * Math.sin(Math.PI * s) * Math.sin(Math.PI * (0.15 + 0.85 * t)), lerp(y0, y1, t), (s - 0.5) * w);
    uv.push(s, t);
    if (i < NX && j < NY) { const a = j * (NX + 1) + i, b = a + NX + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
};

type Flag = { geo: THREE.BufferGeometry; base: Float32Array; len: number; amp: number; k: number };
const flagGeo = (w: number, h: number, nx = 16, ny = 4) => {
  const g = new THREE.PlaneGeometry(w, h, nx, ny); g.translate(w / 2, 0, 0);
  return g;
};

const buildShip = (root: THREE.Group, flags: Flag[]) => {
  const hull = lam("vasaHull", () => ({ map: hullTex(), side: THREE.DoubleSide }));
  const tr = lam("vasaTransom2", () => ({ map: transomTex(), side: THREE.DoubleSide }));
  const deck = lam("vasaDeck", () => ({ map: rep(planksHD(), 1, 1) }));
  const mast = lam("vasaMast", () => ({ color: "#9a6a44" }));
  const tar = lam("vasaTar", () => ({ color: "#3a2f33" }));
  const gold = twoTone(new THREE.MeshPhongMaterial({ color: "#f0bf3a", specular: "#fff1b8", shininess: 50 }), 0.3);
  const sail = lam("vasaSail", () => ({ map: sailTex(), side: THREE.DoubleSide }));
  const b = new Batch();
  b.add(hullGeo(1), hull); b.add(hullGeo(-1), hull); b.add(transomGeo(), tr); b.add(deckGeo(), deck);
  // stern lanterns, beakhead lion, quarter galleries in gold
  for (const z of [-3.0, 0, 3.0]) { b.add(rod(V(-L / 2 + 0.4, 14.2, z), V(-L / 2 + 0.4, 15.4, z), 0.32, 0.42, 6), gold); b.add(rod(V(-L / 2 + 0.4, 15.4, z), V(-L / 2 + 0.4, 15.9, z), 0.42, 0.08, 6), gold); }
  b.add(rod(V(L / 2 - 1.5, 5.5, 0), V(L / 2 + 3.2, 7.4, 0), 0.9, 0.55), gold); // beakhead
  // masts (fore, main, mizzen) with topmasts, yards, sails as set on 10 August 1628 (four of ten)
  const MASTS: { x: number; h: number; yards: [number, number][] }[] = [
    { x: 14.5, h: 44, yards: [[17, 17], [30, 12.5], [40, 7]] },
    { x: 0.5, h: 52, yards: [[19, 20], [34, 15], [46, 8.5]] },
    { x: -14, h: 34, yards: [[22, 11], [31, 6]] },
  ];
  for (const m of MASTS) {
    const base = topAt((m.x + L / 2) / L) - 1;
    b.add(rod(V(m.x, base, 0), V(m.x, m.h * 0.62, 0), 0.62, 0.48), mast);
    b.add(boxGeo(V(m.x - 1.4, m.h * 0.6, -1.4), V(m.x + 1.4, m.h * 0.62 + 0.25, 1.4)), mast); // top platform
    b.add(rod(V(m.x, m.h * 0.6, 0), V(m.x, m.h, 0), 0.36, 0.16), mast);
    for (const [y, w] of m.yards) b.add(rod(V(m.x + 0.4, y, -w / 2), V(m.x + 0.4, y, w / 2), 0.28, 0.16), mast);
    // shrouds: rail to masthead platform, both sides
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
      const u = (m.x - 2.4 + k * 1.2 + L / 2) / L;
      b.add(rod(V(m.x - 2.4 + k * 1.2, topAt(u) - 0.2, s * sectW(u, 1) * 1.04), V(m.x - 0.2 + k * 0.15, m.h * 0.6, s * 1.3), 0.05, 0.05, 4), tar);
    }
    b.add(rod(V(m.x, m.h, 0), V(m.x + (m.x > 10 ? 22 : 14), m.x > 10 ? 15 : m.h * 0.62, 0), 0.06, 0.06, 4), tar); // stay forward
    b.add(rod(V(m.x, m.h, 0), V(m.x, m.h + 3.5, 0), 0.09, 0.05, 6), mast); // flag pole
    const pg = flagGeo(9, 0.9, 20, 1);
    const pm = new THREE.Mesh(pg, lam("pennant", () => ({ map: pennantTex(), side: THREE.DoubleSide })));
    pm.position.set(m.x, m.h + 3.1, 0); pm.castShadow = true; root.add(pm);
    flags.push({ geo: pg, base: Float32Array.from(pg.attributes.position.array as Float32Array), len: 9, amp: 0.7, k: 0.9 });
  }
  // bowsprit + spritsail yard
  b.add(rod(V(L / 2 - 4, 8.5, 0), V(L / 2 + 13, 15.5, 0), 0.5, 0.3), mast);
  // sails: fore course + fore topsail, main topsail, mizzen (lateen shown square for the test)
  b.add(sailGeo(14.9, 17, 29.6, 17, 12.5, 2.0).rotateX(0), sail);
  b.add(sailGeo(14.9, 30, 39.6, 12.5, 7, 1.6), sail);
  b.add(sailGeo(0.9, 34, 45.6, 15, 8.5, 1.8), sail);
  b.add(sailGeo(-13.6, 22, 30.6, 11, 6, 1.2), sail);
  b.build(root);
  // ensign on the stern pole
  const pole = new THREE.Mesh(rod(V(-L / 2 - 1.2, 13.5, 0), V(-L / 2 - 2.6, 21, 0), 0.1, 0.07), mast); pole.castShadow = true; root.add(pole);
  const fg = flagGeo(5.2, 3.3, 16, 4);
  const fm = new THREE.Mesh(fg, lam("flagSE", () => ({ map: flagSE(), side: THREE.DoubleSide })));
  fm.position.set(-L / 2 - 2.55, 19.2, 0); fm.rotation.y = Math.PI; fm.castShadow = true; root.add(fm);
  flags.push({ geo: fg, base: Float32Array.from(fg.attributes.position.array as Float32Array), len: 5.2, amp: 0.55, k: 1.3 });
};

// ---------------- water shader (same as the river, sea-calm) ----------------
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
  wc = mix(wc, wCrest, mk.r * 0.12);
  wc = mix(wc, wGlint, mk.b * (0.15 + 0.25 * wf));
  diffuseColor.rgb = wc;`;
const flatQuad = (x0: number, x1: number, z0: number, z1: number, y: number, u: number, v: number) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 1, 0]).flat(), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
};
const wallZ = (x0: number, x1: number, z: number, y0: number, y1: number) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 0, -1]).flat(), 3));
  const u = Math.abs(x1 - x0) / 4, v = (y1 - y0) / 4;
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
};

// ---------------- crowd ----------------
type Folk = { x: number; z: number; o: Outfit; okey: string; expr: Expr; wave: boolean; kid: boolean; i: number };
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const CROWD: Folk[] = (() => {
  const out: Folk[] = [];
  const exprs: Expr[] = ["smile", "grin", "laugh", "smile_closed", "relief_open"];
  let i = 0;
  for (let row = 0; row < 4; row++) for (let k = 0; k < 9; k++) {
    const x = -4.6 + k * 1.15 + (row % 2) * 0.55 + (hh(i) - 0.5) * 0.35, z = -6.2 - row * 1.25 + (hh(i, 3) - 0.5) * 0.4;
    const kid = i % 6 === 4;
    out.push({ x, z, o: kid ? KID : townsfolk(i % 6), okey: kid ? "kid" : `f${i % 6}`, expr: exprs[i % 5], wave: i % 3 !== 1, kid, i });
    i++;
  }
  return out;
})();

const sh0 = (f: number) => shotOf(f);
export class VasaWorld {
  root = new THREE.Group();
  private ship = new THREE.Group();
  private flags: Flag[] = [];
  private pool = new Pool();
  private actors: Actor[] = [];
  private blobs: Fx[] = [];
  private sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private clouds: THREE.Mesh[] = [];
  private sunDir: THREE.Vector3;

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
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
      const a = -Math.PI / 2 + (i - 4) * 0.28, d = 640 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cm[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 140 + (i % 4) * 34;
      m.position.set(Math.cos(a) * d, 150 + (i % 4) * 46, Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    // ---- quay (near), far shore town (Stockholm) ----
    const b = new Batch();
    const cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    const wall = lam("vasaQuayWall", () => ({ map: stoneHD("vasaQuayWall", ["#c9bcaa", "#bfb19f", "#d1c5b4", "#b8aa97"], "#958776") }));
    const cope = lam("copeHD", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));
    const wood = lam("vasaPile", () => ({ color: "#7a5236" }));
    b.add(flatQuad(-200, 200, QUAY_EDGE, 60, QUAY_Y, 100, 19), cobble);
    b.add(wallZ(-200, 200, QUAY_EDGE, -1, QUAY_Y), wall);
    b.add(boxGeo(V(-200, QUAY_Y - 0.05, QUAY_EDGE - 0.1), V(200, QUAY_Y + 0.12, QUAY_EDGE + 0.9), 2), cope);
    for (let x = -30; x <= 30; x += 6) { b.add(boxGeo(V(x - 0.25, QUAY_Y, QUAY_EDGE + 0.4), V(x + 0.25, QUAY_Y + 0.7, QUAY_EDGE + 0.9)), wood); } // bollards
    // far shore: quay wall + a row of gabled houses + church tower (Storkyrkan-like)
    const FZ = -150;
    b.add(flatQuad(-400, 400, -400, FZ, 2.4, 200, 62), cobble);
    const farWall = wallZ(400, -400, FZ, -1, 2.4); farWall.rotateY(0); b.add(farWall, wall);
    let x = -170, si = 0;
    while (x < 170) {
      const w = [7, 9, 8][si % 3], h = [9.8, 12, 11, 8.4][si % 4];
      house(b, x + w / 2, FZ - 6, 0, w, 8, h, si * 3 + 1, 2.4);
      x += w + 0.3; si++;
    }
    for (let k = 0; k < 18; k++) { const xx = -160 + k * 19 + hh(k) * 6; house(b, xx, FZ - 20 - hh(k, 2) * 6, 0, 8, 8, 13 + hh(k, 4) * 5, k * 5 + 2, 2.4); }
    const tower = lam("towerHD", () => ({ map: stoneHD("towerHD") }));
    b.add(boxGeo(V(18, 2.4, FZ - 34), V(26, 46, FZ - 26), 2), tower);
    const spire = new THREE.ConeGeometry(5.8, 22, 4); spire.rotateY(Math.PI / 4);
    b.add(spire, lam("vasaSpire", () => ({ color: "#4f7d6e" })), new THREE.Matrix4().makeTranslation(22, 57, FZ - 30));
    b.build(R);
    // ---- water ----
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
    wm.customProgramCacheKey = () => "harbour1";
    const water = new THREE.Mesh(flatQuad(-900, 900, -900, QUAY_EDGE, 0, 1, 1), wm);
    water.receiveShadow = true; R.add(water);
    // ---- ship ----
    buildShip(this.ship, this.flags);
    this.ship.position.set(...SHIP_AT); this.ship.rotation.order = "YXZ"; this.ship.rotation.y = SHIP_YAW;
    R.add(this.ship);
    // sun: camera-relative (day preset az/el) around the average view direction of the shot
    const L0 = LIGHTS.day, c0 = camAt(0), c1 = camAt(SHOT_B - 1);
    let fx = (c0.look[0] - c0.pos[0]) + (c1.look[0] - c1.pos[0]), fz = (c0.look[2] - c0.pos[2]) + (c1.look[2] - c1.pos[2]);
    const n = Math.hypot(fx, fz); fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(62), el = THREE.MathUtils.degToRad(L0.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    this.sunDir = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private blob(i: number) { while (this.blobs.length <= i) this.blobs.push(new Fx(this.root)); return this.blobs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, L0 = LIGHTS.day, K = LOOK.day;
    const c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    // light rig
    this.hemi.color.set(L0.sky); this.hemi.groundColor.set(L0.ground); this.hemi.intensity = L0.hemiI;
    this.sun.color.set(L0.sunCol); this.sun.intensity = L0.sunI;
    const focus = sh0(f) === 1 ? V(-3, 4, -100) : sh0(f) === 2 ? V(-4, 3, -50) : V(0, 6, -52), Rr = sh0(f) === 2 ? 75 : 62;
    this.sun.position.copy(focus).addScaledVector(this.sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L0.bias; this.sun.shadow.normalBias = L0.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L0.lit); TONE.uShadeCol.value.set(...L0.shade); TONE.uShadeLift.value.set(...L0.lift);
    TONE.uLambert.value = L0.lambert; TONE.uSideK.value = L0.sideK; TONE.uTerm.value = L0.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L0.charTint); CHAR.uCharShade.value = L0.charShade; CHAR.uGrad.value = L0.charGrad;
    CHAR.uBodyGrad.value = L0.bodyGrad; CHAR.uSideTint.value.set(...L0.sideTint);
    // sky, fog
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L0.fog, this.fog.color); this.fog.near = 60; this.fog.far = 520;
    scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) m.lookAt(cam.position.x, m.position.y, cam.position.z);
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    // ship pose per shot
    const sh = shotOf(f);
    if (sh === 0) {
      // gentle swell, then the first gust heels her over and she starts to right herself
      const gust = smooth((t - 2.9) / 1.0) * (1 - 0.35 * smooth((t - 4.2) / 0.8));
      this.ship.rotation.z = 0.012 * Math.sin(t * 1.3);
      this.ship.rotation.x = THREE.MathUtils.degToRad(1.2 * Math.sin(t * 1.1) + 9 * gust);
      this.ship.position.set(SHIP_AT[0] - t * 0.9 * 0.616, SHIP_AT[1] + 0.12 * Math.sin(t * 1.6), SHIP_AT[2] - t * 0.9 * 0.788);
    } else if (sh === 1) {
      // flash-forward: she heels further and further and settles into the harbour
      const u = (f - SHOT_B) / (SHOT_C - SHOT_B);
      const heel = 6 + 30 * ease(Math.min(1, u * 1.15));
      this.ship.rotation.z = 0.02 * Math.sin(t * 1.3);
      this.ship.rotation.x = THREE.MathUtils.degToRad(heel);
      this.ship.position.set(-3.5, -4.2 * smooth((u - 0.25) / 0.75), -104);
    } else {
      // the morning of 10 August: calm, sails set, gliding out past the quay
      const tc = (f - SHOT_C) / FPS;
      this.ship.rotation.z = 0.01 * Math.sin(t * 1.3);
      this.ship.rotation.x = THREE.MathUtils.degToRad(1.0 * Math.sin(t * 1.1));
      this.ship.position.set(SHIP_AT[0] + 6 - tc * 0.9 * 0.616, 0.1 * Math.sin(t * 1.6), SHIP_AT[2] + 8 - tc * 0.9 * 0.788);
    }
    // flags flutter (deterministic per frame)
    for (const fl of this.flags) {
      const p = fl.geo.attributes.position as THREE.BufferAttribute, a = p.array as Float32Array;
      for (let i = 0; i < p.count; i++) {
        const x = fl.base[i * 3], y = fl.base[i * 3 + 1], u = x / fl.len;
        a[i * 3 + 2] = fl.base[i * 3 + 2] + fl.amp * u * Math.sin(u * 7 - t * 9 * fl.k + y * 0.3);
        a[i * 3 + 1] = y * (1 - 0.35 * u * (fl.len > 6 ? 1 : 0.2));
      }
      p.needsUpdate = true; fl.geo.computeVertexNormals();
    }
    // crowd: cheering cards facing the lens, waving arms on twos
    let ai = 0;
    const used: Actor[] = [], fused: Fx[] = [];
    const tw = Math.floor(f / 2) * 2 / FPS;
    for (const p of CROWD) {
      const sc2 = p.kid ? 0.72 : 1;
      const hop = p.kid ? 0.14 * Math.sin(Math.PI * (((t * 1.6 + hh(p.i, 7)) % 1))) ** 2 : 0;
      const wave = p.wave ? Math.round(Math.sin(tw * 8 + p.i * 1.3) * 30) / 30 : undefined;
      const blink = (Math.floor(t * 0.7 + hh(p.i, 5) * 3) % 5 === 0 && (t * 0.7 + hh(p.i, 5) * 3) % 1 < 0.08) ? 1 : 0;
      const a = this.actor(ai++);
      const d = cam.position.distanceTo(V(p.x, QUAY_Y + 1.2, p.z));
      const [w, h, k] = [600, 1000, 1]; void d;
      a.r = this.pool.req(`F|${p.okey}|${p.expr}|${wave}|${blink}`, w, h, k, (pen) => bodyFront(pen, p.o, { mode: "stand", expr: p.expr, wave, blink, seed: (p.i % 7) + 1 }));
      a.mesh.visible = true;
      a.mesh.position.set(p.x, QUAY_Y + hop, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      a.mesh.scale.set(sc2, sc2, sc2);
      a.mesh.castShadow = false;
      used.push(a);
      const bl = this.blob(fused.length);
      bl.r = this.pool.req("blob|contact|#9da0bd", 128, 128, 1, (pen) => fxContact(pen, "#9da0bd"));
      bl.mesh.visible = true; bl.mesh.position.set(p.x, QUAY_Y + 0.02, p.z); bl.mesh.rotation.set(-Math.PI / 2, 0, 0); bl.mesh.scale.set(0.6 * sc2, 0.45 * sc2, 1);
      fused.push(bl);
    }
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return V(...c.look);
  }
}
