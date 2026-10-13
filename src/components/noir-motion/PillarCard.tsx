"use client";
import { useId, useRef } from "react";
import { ease, useFrame, useMotion } from "./motion";
export type PillarKind = "blend" | "harmony" | "precision" | "presence";
const names = {
  blend: "Blend",
  harmony: "Harmony",
  precision: "Precision",
  presence: "Presence",
};
function Note({ x, y }: { x: number; y: number }) {
  return (
    <g className="nm-note">
      <ellipse
        cx={x}
        cy={y}
        rx="9"
        ry="6.2"
        transform={`rotate(-22 ${x} ${y})`}
      />
      <path d={`M${x + 7.5} ${y - 2}v-41`} />
    </g>
  );
}
function Frame() {
  return (
    <g className="nm-engrave">
      <path d="M44 17H376M44 253H376M17 44V226M403 44V226" />
      {[
        [17, 17, 1, 1],
        [403, 17, -1, 1],
        [17, 253, 1, -1],
        [403, 253, -1, -1],
      ].map(([x, y, sx, sy], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
          {[12, 20, 28].map((r) => (
            <path key={r} d={`M${r} 0A${r} ${r} 0 0 1 0 ${r}`} />
          ))}
          <path d="M0 0H34M0 0V34" />
        </g>
      ))}
      <path d="M198 17l12 -5 12 5 -12 5zM198 253l12 -5 12 5 -12 5z" />
    </g>
  );
}
/** Imperative SVG updates share one clock; metronome extremes and beat lamps cannot drift. */
export function PillarCard({
  kind,
  bpm = 100,
  className = "",
}: {
  kind: PillarKind;
  bpm?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null),
    svg = useRef<SVGSVGElement>(null),
    m = useMotion(ref),
    id = useId().replace(/:/g, "");
  const hovered = useRef(false),
    beatPhase = useRef(0);
  useFrame(m.active, m.reduced, (time, dt) => {
    const root = svg.current;
    if (!root) return;
    const get = (q: string) => root.querySelector<SVGElement>(q);
    const transform = (q: string, value: string) =>
      get(q)?.setAttribute("transform", value);
    const opacity = (q: string, v: number) => {
      const node = get(q);
      if (node) node.style.opacity = String(v);
    };
    if (kind === "blend") {
      const t = time % 6,
        p = m.reduced ? 1 : ease((t - 0.8) / 2.6),
        fade = m.reduced ? 0 : 1 - ease((t - 5.25) / 0.65);
      [-1, 0, 1].forEach((v, i) => {
        const y = v * 40 * (1 - p) + Math.sin(time * 5 + i * 2) * 2.5 * (1 - p);
        transform(`[data-voice="${i}"]`, `translate(${165 * p} ${y})`);
        opacity(`[data-voice="${i}"]`, (1 - ease((p - 0.88) / 0.12)) * fade);
      });
      opacity("[data-unison]", m.reduced ? 1 : ease((p - 0.88) / 0.12) * fade);
      for (let i = 0; i < 3; i++) {
        const q = (t - 3.1 - i * 0.24) / 1.7;
        transform(
          `[data-ring="${i}"]`,
          `translate(284 130) scale(${0.5 + Math.max(q, 0) * 2})`,
        );
        opacity(
          `[data-ring="${i}"]`,
          m.reduced ? 0.12 : q > 0 && q < 1 ? (1 - q) * 0.55 : 0,
        );
      }
    }
    if (kind === "harmony") {
      const t = time % 6.5;
      for (let i = 0; i < 3; i++) {
        const a = m.reduced ? 0.55 : ease((t - i * 0.45) / 0.6),
          p = m.reduced ? 1 : ease((t - 2.2) / 1.2);
        transform(`[data-arp="${i}"]`, `translate(0 ${(1 - a) * 12})`);
        opacity(`[data-arp="${i}"]`, a * (1 - 0.65 * p));
        const line = get(`[data-lead="${i}"]`);
        if (line) line.style.strokeDashoffset = String(1 - p);
      }
      opacity(
        "[data-chord]",
        m.reduced ? 1 : ease((t - 3) / 0.6) * (1 - ease((t - 5.8) / 0.7)),
      );
    }
    if (kind === "precision") {
      // Hover changes the rate smoothly without introducing a second clock.
      const rate = Math.max(40, Math.min(200, bpm));
      if (!m.reduced) beatPhase.current += (dt * rate) / 60;
      const phase = beatPhase.current;
      transform(
        "[data-arm]",
        `rotate(${m.reduced ? 0 : -24 * Math.cos(Math.PI * phase)} 210 200)`,
      );
      const beat = Math.floor(phase) % 4;
      for (let i = 0; i < 4; i++)
        opacity(`[data-beat="${i}"]`, i === (m.reduced ? 0 : beat) ? 1 : 0.13);
    }
    if (kind === "presence") {
      const angle = m.reduced ? 0 : Math.sin(time * 0.52) * 9;
      transform("[data-beam]", `rotate(${angle} 210 30)`);
      for (let i = 0; i < 12; i++) {
        const p = (time * 0.035 + i / 12) % 1;
        transform(
          `[data-dust="${i}"]`,
          `translate(${190 + Math.sin(i * 13.7) * 28 + Math.sin(time * 0.3 + i) * 5} ${205 - p * 152})`,
        );
      }
      for (let i = 0; i < 3; i++) {
        const p = (time * 0.4 + i / 3) % 1;
        transform(
          `[data-carry="${i}"]`,
          `translate(210 120) scale(${0.8 + p * 0.6 + (hovered.current ? 0.08 : 0)})`,
        );
        opacity(`[data-carry="${i}"]`, m.reduced ? 0.18 : (1 - p) * 0.4);
      }
    }
  });
  return (
    <div
      ref={ref}
      className={`nm-pillar nm-pillar--${kind} ${className}`}
      data-run={m.run}
      onPointerEnter={() => {
        hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
      }}
    >
      <svg
        ref={svg}
        viewBox="0 0 420 270"
        role="img"
        aria-label={`${names[kind]}: ${kind === "blend" ? "three voices converge into unison" : kind === "harmony" ? "C E G arpeggio resolves into a chord" : kind === "precision" ? `metronome at ${bpm} beats per minute` : "vintage microphone in a moving spotlight"}`}
      >
        <defs>
          <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2=".3">
            <stop stopColor="var(--nm-silver)" />
            <stop offset=".2" stopColor="var(--nm-white)" />
            <stop offset=".38" stopColor="var(--nm-metal-dark)" />
            <stop offset=".55" stopColor="var(--nm-silver)" />
            <stop offset=".73" stopColor="var(--nm-white)" />
            <stop offset="1" stopColor="var(--nm-metal-dark)" />
          </linearGradient>
          <linearGradient id={`${id}-beam`} x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="var(--nm-white)" stopOpacity=".02" />
            <stop offset=".75" stopColor="var(--nm-white)" stopOpacity=".16" />
            <stop offset="1" stopColor="var(--hl)" stopOpacity=".1" />
          </linearGradient>
          <radialGradient id={`${id}-pool`}>
            <stop stopColor="var(--hl)" stopOpacity=".45" />
            <stop offset="1" stopColor="var(--hl)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <Frame />
        <text
          x="35"
          y="45"
          className="nm-svg-label"
        >{`0${["blend", "harmony", "precision", "presence"].indexOf(kind) + 1} / THE COLLECTIVE`}</text>
        {(kind === "blend" || kind === "harmony") && (
          <g className="nm-staff">
            {[66, 82, 98, 114, 130].map((y) => (
              <path key={y} d={`M42 ${y + 24}H377`} />
            ))}
            <text x="45" y="149" className="nm-clef">
              𝄞
            </text>
          </g>
        )}
        {kind === "blend" && (
          <>
            <g className="nm-guides">
              {[-40, 0, 40].map((y) => (
                <path
                  key={y}
                  d={`M120 ${130 + y}C200 ${130 + y},210 130,284 130`}
                />
              ))}
            </g>
            {[0, 1, 2].map((i) => (
              <g key={i} data-voice={i}>
                <Note x={119} y={130} />
              </g>
            ))}
            <g data-unison="" className="nm-accent">
              <Note x={284} y={130} />
            </g>
            {[0, 1, 2].map((i) => (
              <g data-ring={i} key={i}>
                <circle r="18" className="nm-ring" />
              </g>
            ))}
            <text className="nm-scene-caption" x="210" y="220">
              MANY VOICES. ONE FREQUENCY.
            </text>
          </>
        )}
        {kind === "harmony" && (
          <>
            <g className="nm-staff">
              <path d="M98 170h30M290 170h32" />
            </g>
            {[170, 154, 138].map((y, i) => (
              <g key={i}>
                <path
                  className="nm-voice-lead"
                  data-lead={i}
                  pathLength="1"
                  d={`M${112 + i * 55} ${y}Q265 ${y - 18},304 ${y}`}
                />
                <g data-arp={i}>
                  <Note x={112 + i * 55} y={y} />
                </g>
              </g>
            ))}
            <g data-chord="" className="nm-accent">
              {[170, 154, 138].map((y) => (
                <ellipse
                  key={y}
                  cx="305"
                  cy={y}
                  rx="9"
                  ry="6.2"
                  transform={`rotate(-22 305 ${y})`}
                />
              ))}
              <path d="M312.5 168V91" />
            </g>
            <text className="nm-scene-caption" x="210" y="220">
              C · E · G / MAJOR TRIAD
            </text>
          </>
        )}
        {kind === "precision" && (
          <>
            <path
              className="nm-metronome-body"
              d="M159 212L188 65Q210 53 232 65L261 212Z"
            />
            <path className="nm-engrave" d="M168 201L194 73H226L252 201Z" />
            <path
              className="nm-staff"
              d="M201 88H219M199 105H221M196 122H224M192 139H228M190 156H230"
            />
            <g data-arm="">
              <path
                d="M210 202V78"
                stroke={`url(#${id}-metal)`}
                strokeWidth="5"
              />
              <rect
                x="199"
                y="110"
                width="22"
                height="18"
                rx="2"
                fill={`url(#${id}-metal)`}
              />
              <path d="M200 116H220" stroke="var(--hl)" strokeWidth="3" />
            </g>
            <circle cx="210" cy="200" r="7" fill={`url(#${id}-metal)`} />
            {[0, 1, 2, 3].map((i) => (
              <circle
                key={i}
                data-beat={i}
                cx={174 + i * 24}
                cy="235"
                r="3.5"
                className="nm-beat"
              />
            ))}
            <text x="282" y="154" className="nm-tempo">
              {bpm}
            </text>
            <text x="282" y="169" className="nm-svg-label">
              BPM
            </text>
          </>
        )}
        {kind === "presence" && (
          <>
            <g data-beam="">
              <path
                d="M207 30L130 208Q210 227 290 208L213 30Z"
                fill={`url(#${id}-beam)`}
              />
              <path
                d="M209 30L157 208Q210 218 263 208L211 30Z"
                fill={`url(#${id}-beam)`}
              />
              <ellipse
                cx="210"
                cy="209"
                rx="96"
                ry="16"
                fill={`url(#${id}-pool)`}
              />
            </g>
            {Array.from({ length: 12 }, (_, i) => (
              <g data-dust={i} key={i}>
                <circle
                  r={i % 3 === 0 ? 1 : 0.5}
                  fill="var(--nm-white)"
                  opacity=".28"
                />
              </g>
            ))}
            <path d="M51 212H369" className="nm-staff" />
            <g stroke={`url(#${id}-metal)`} fill="none">
              <path d="M210 155V204M190 212Q210 199 230 212" strokeWidth="4" />
              <path
                d="M190 128V142Q190 161 210 161Q230 161 230 142V128"
                strokeWidth="3"
              />
              <rect
                x="194"
                y="89"
                width="32"
                height="59"
                rx="15"
                fill={`url(#${id}-metal)`}
              />
              <g stroke="var(--nm-metal-dark)" strokeWidth="2">
                {[100, 106, 112, 118, 124, 130, 136].map((y) => (
                  <path d={`M200 ${y}H220`} key={y} />
                ))}
              </g>
              <path d="M210 96V140" stroke="var(--nm-white)" opacity=".5" />
            </g>
            {[0, 1, 2].map((i) => (
              <g key={i} data-carry={i} className="nm-ring">
                <path d="M-38 -22Q-60 0 -38 22M38 -22Q60 0 38 22" />
              </g>
            ))}
            <text className="nm-scene-caption" x="210" y="237">
              OWN THE ROOM.
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
export const BlendCard = () => <PillarCard kind="blend" />;
export const HarmonyCard = () => <PillarCard kind="harmony" />;
export const PrecisionCard = ({ bpm = 100 }: { bpm?: number }) => (
  <PillarCard kind="precision" bpm={bpm} />
);
export const PresenceCard = () => <PillarCard kind="presence" />;
