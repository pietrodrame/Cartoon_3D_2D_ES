// Subtítulos palabra a palabra, sincronizados con words.json (VoiceStudio / WhisperX).
// Grupos de hasta 3 palabras (cortan en puntuación); la palabra que suena va en amarillo con un pequeño "pop".
// words.json va en public/<carpeta>/words.json; acepta [{word|text, start, end}] en cualquier nivel del JSON.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

export type W = { w: string; s: number; e: number };
/** correcciones de lo que el transcriptor oye mal (v/b suenan igual) */
const FIX: Record<string, string> = { elbasa: "el Vasa", basa: "Vasa", baza: "Vasa", puertas: "portas" };

const collect = (o: unknown, out: W[]) => {
  if (Array.isArray(o)) {
    for (const x of o) {
      if (x && typeof x === "object" && ("word" in x || "text" in x) && "start" in x && "end" in x && !("words" in x)) {
        const r = x as { word?: string; text?: string; start: number; end: number };
        const raw = String(r.word ?? r.text ?? "").trim();
        const key = raw.toLowerCase().replace(/[.,;:!?¿¡]/g, ""), punct = raw.match(/[.,;:!?]+$/)?.[0] ?? "";
        if (raw) out.push({ w: FIX[key] ? FIX[key] + punct : raw, s: Number(r.start), e: Number(r.end) });
      } else collect(x, out);
    }
  } else if (o && typeof o === "object") for (const v of Object.values(o)) collect(v, out);
  return out;
};

type Group = { words: W[]; s: number; e: number };
const groupWords = (ws: W[]): Group[] => {
  const gs: Group[] = [];
  let cur: W[] = [];
  const push = () => { if (cur.length) gs.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e }); cur = []; };
  for (const w of ws) {
    cur.push(w);
    const len = cur.reduce((a, x) => a + x.w.length, 0);
    if (/[.,;:!?]$/.test(w.w) || cur.length >= 3 || len > 16) push();
  }
  push();
  // cada grupo se queda en pantalla hasta que empieza el siguiente (máx. 0.6 s de cola)
  for (let i = 0; i < gs.length; i++) gs[i].e = Math.min(gs[i].e + 0.6, i + 1 < gs.length ? gs[i + 1].s : gs[i].e + 0.6);
  return gs;
};

export const useWords = (path: string) => {
  const [words, setWords] = useState<W[] | null>(null);
  const [h] = useState(() => delayRender("words.json"));
  useEffect(() => {
    fetch(staticFile(path)).then((r) => r.json()).then((j) => { setWords(collect(j, []).sort((a, b) => a.s - b.s)); continueRender(h); })
      .catch(() => { setWords([]); continueRender(h); });
  }, [h, path]);
  return words;
};

export const Captions: React.FC<{ words: W[]; offset?: number }> = ({ words, offset = 0 }) => {
  const f = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = f / fps + offset;
  const g = groupWords(words).find((x) => t >= x.s - 0.05 && t < x.e);
  if (!g) return null;
  const k = height / 1920;
  const inT = interpolate(t, [g.s - 0.05, g.s + 0.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", top: `${62}%` }}>
      <div style={{
        display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `${0 * k}px ${22 * k}px`, maxWidth: `${880 * k}px`,
        transform: `scale(${0.85 + 0.15 * inT})`, opacity: inT,
      }}>
        {g.words.map((w, i) => {
          const on = t >= w.s - 0.03 && t < (g.words[i + 1]?.s ?? g.e);
          const pop = on ? interpolate(t, [w.s - 0.03, w.s + 0.08], [1.18, 1.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
          return (
            <span key={i} style={{
              fontFamily: "'Arial Black', 'Arial Rounded MT Bold', 'Helvetica Neue', Arial, sans-serif", fontWeight: 900,
              fontSize: `${92 * k}px`, lineHeight: 1.15, letterSpacing: `${1 * k}px`, textTransform: "uppercase",
              color: on ? "#ffd23f" : "#ffffff",
              WebkitTextStroke: `${10 * k}px #241726`, paintOrder: "stroke fill",
              textShadow: `0 ${8 * k}px 0 #241726`,
              transform: `scale(${pop})`, display: "inline-block",
            }}>{w.w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
