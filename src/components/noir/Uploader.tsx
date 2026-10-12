"use client";

import { useEffect, useRef, useState } from "react";

const MAX_MB = 500;

type Props = {
  id: string;
  file: File | null;
  onFile: (f: File | null) => void;
  error?: string;
};

function fmt(bytes: number) {
  return bytes > 1e9 ? `${(bytes / 1e9).toFixed(2)} GB` : `${(bytes / 1e6).toFixed(1)} MB`;
}

/**
 * Video drop-zone. In production the file goes straight from the browser to
 * storage via a presigned URL (Mux Direct Upload / Cloudflare R2 / S3 multipart),
 * so large phone videos never pass through the web server. Progress here is
 * simulated for the prototype.
 */
export function Uploader({ id, file, onFile, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- replays the intro animation on prop change (prototype behaviour)
      setProgress(0);
      setPreview(null);
      return;
    }
    let url: string | null = null;
    try {
      url = URL.createObjectURL(file);
      setPreview(url);
    } catch {
      setPreview(null);
    }
    setProgress(0);
    let p = 0;
    const t = window.setInterval(() => {
      p = Math.min(100, p + 4 + Math.random() * 9);
      setProgress(p);
      if (p >= 100) clearInterval(t);
    }, 120);
    return () => {
      clearInterval(t);
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  const accept = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) return setLocalErr("That file isn't a video. Use MP4, MOV or WebM.");
    if (f.size > MAX_MB * 1e6) return setLocalErr(`That video is ${fmt(f.size)}. The limit is ${MAX_MB} MB, so trim it or export at 1080p.`);
    setLocalErr(null);
    onFile(f);
  };

  const err = localErr || error;

  if (file) {
    const done = progress >= 100;
    return (
      <div className={["ng-upload is-file", done && "is-done"].filter(Boolean).join(" ")}>
        {preview ? <video src={preview} muted playsInline className="ng-upload-thumb" /> : <span className="ng-upload-thumb" />}
        <div className="ng-upload-meta">
          <strong>{file.name}</strong>
          <span>
            {fmt(file.size)} · {done ? "Uploaded" : `Uploading ${Math.round(progress)}%`}
          </span>
          <span className="ng-upload-bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </span>
        </div>
        <button type="button" className="ng-btn ng-btn--ghost ng-btn--sm" onClick={() => onFile(null)}>
          <span className="ng-btn-label">Replace</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <label
        htmlFor={id}
        className={["ng-upload", drag && "is-drag", err && "has-error"].filter(Boolean).join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          accept(e.dataTransfer.files?.[0]);
        }}
      >
        <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="6" y="12" width="28" height="24" rx="4" />
          <path d="M34 20l8-5v18l-8-5" />
          <path d="M20 30V18M15 23l5-5 5 5" stroke="var(--ng-accent)" />
        </svg>
        <span className="ng-upload-title">
          Drop your video here, or <u>choose a file</u>
        </span>
        <span className="ng-upload-sub">MP4, MOV or WebM · up to {MAX_MB} MB · 1–3 minutes · filmed on a phone is fine</span>
        <input ref={input} id={id} type="file" accept="video/*" className="ng-sr" onChange={(e) => accept(e.target.files?.[0])} />
      </label>
      {err && (
        <p className="ng-error" role="alert">
          {err}
        </p>
      )}
    </>
  );
}
