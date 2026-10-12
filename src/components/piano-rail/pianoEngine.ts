/** Notes the sample set covers (must match pianoSamples.ts, which is loaded lazily). */
const PIANO_SAMPLE_NOTES = [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108] as const;

/**
 * Piano engine: real sampled acoustic grand (see pianoSamples.ts) played
 * through Web Audio with a small concert-room reverb.
 *  - noteOn(midi) starts a note from the nearest sample, re-pitched exactly
 *  - noteOff(midi) lifts the damper: a quick, natural fade instead of a cut
 * Browsers only allow sound after a tap/click, so the first noteOn must come
 * from a user gesture (a key press or the scroll-sound button).
 */

type Voice = { src: AudioBufferSourceNode; gain: GainNode };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let buffers: Map<number, AudioBuffer> | null = null;
let loading: Promise<void> | null = null;
const voices = new Map<number, Voice[]>();

function b64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/** Synthesised impulse response: a short, warm hall tail. */
function roomImpulse(ac: AudioContext, seconds = 2.2, decay = 3.2) {
  const len = Math.floor(ac.sampleRate * seconds);
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      lp += 0.22 * ((Math.random() * 2 - 1) - lp); // gentle low-pass: darker tail
      d[i] = lp * Math.pow(1 - t, decay);
    }
  }
  return ir;
}

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.8;
  const dry = ctx.createGain();
  dry.gain.value = 1;
  const wet = ctx.createGain();
  wet.gain.value = 0.28;
  const verb = ctx.createConvolver();
  verb.buffer = roomImpulse(ctx);
  master.connect(dry).connect(ctx.destination);
  master.connect(verb).connect(wet).connect(ctx.destination);
  return ctx;
}

export function loadPiano(): Promise<void> {
  if (loading) return loading;
  const ac = ensureContext();
  loading = (async () => {
    // ~0.7 MB of samples: fetched only when the piano is first used, never in the page bundle
    const { PIANO_SAMPLES } = await import("./pianoSamples");
    const map = new Map<number, AudioBuffer>();
    await Promise.all(
      PIANO_SAMPLE_NOTES.map(async (n) => {
        const buf = await ac.decodeAudioData(b64ToArrayBuffer(PIANO_SAMPLES[n]));
        map.set(n, buf);
      }),
    );
    buffers = map;
  })();
  return loading;
}

function nearestSample(midi: number) {
  let best: number = PIANO_SAMPLE_NOTES[0];
  for (const n of PIANO_SAMPLE_NOTES) if (Math.abs(n - midi) < Math.abs(best - midi)) best = n;
  return best;
}

export async function noteOn(midi: number, velocity = 0.8) {
  const ac = ensureContext();
  if (ac.state === "suspended") await ac.resume();
  if (!buffers) await loadPiano();
  if (!buffers || !master) return;
  const root = nearestSample(midi);
  const buf = buffers.get(root);
  if (!buf) return;
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = Math.pow(2, (midi - root) / 12);
  const gain = ac.createGain();
  const t = ac.currentTime;
  const v = Math.max(0.05, Math.min(1, velocity));
  gain.gain.setValueAtTime(v * v, t); // perceptual velocity curve
  src.connect(gain).connect(master);
  src.start(t);
  const voice = { src, gain };
  const list = voices.get(midi) ?? [];
  list.push(voice);
  voices.set(midi, list);
  src.onended = () => {
    const l = voices.get(midi);
    if (l) voices.set(midi, l.filter((x) => x !== voice));
  };
}

export function noteOff(midi: number) {
  if (!ctx) return;
  const list = voices.get(midi);
  if (!list?.length) return;
  const t = ctx.currentTime;
  for (const { src, gain } of list) {
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.setTargetAtTime(0, t, 0.09); // damper
    try {
      src.stop(t + 0.6);
    } catch {
      /* already stopped */
    }
  }
  voices.set(midi, []);
}

/** Play a note for a fixed time (used when scrolling plays the keys). */
export function strike(midi: number, velocity = 0.6, holdMs = 650) {
  void noteOn(midi, velocity);
  window.setTimeout(() => noteOff(midi), holdMs);
}
