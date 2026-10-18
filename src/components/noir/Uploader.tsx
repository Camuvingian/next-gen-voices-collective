"use client";

import { uploadPresigned } from "@vercel/blob/client";
import { useEffect, useRef, useState } from "react";
import { VIDEO_MAX_MB as MAX_MB, VIDEO_PREFIX } from "@/lib/forms";

type Props = {
  id: string;
  file: File | null;
  onFile: (f: File | null) => void;
  /** the stored video's path once the upload finishes; null while uploading, after a failure or when cleared */
  onUploaded: (path: string | null) => void;
  error?: string;
};

function fmt(bytes: number) {
  return bytes > 1e9 ? `${(bytes / 1e9).toFixed(2)} GB` : `${(bytes / 1e6).toFixed(1)} MB`;
}

/** auditions/<random id>/<tidy file name>: unguessable, and never clashes with another upload */
const storeName = (f: File) =>
  `${VIDEO_PREFIX}${crypto.randomUUID()}/${f.name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(-80) || "audition.mp4"}`;

/**
 * Video drop-zone. The file goes straight from the browser to the private
 * Vercel Blob store (see app/api/audition-video), in parts for big files, so
 * phone videos never pass through the web server. The progress bar is real.
 */
export function Uploader({ id, file, onFile, onUploaded, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // the parent's callbacks change every render; the upload only needs the latest
  const report = useRef(onUploaded);
  const clear = useRef(onFile);
  useEffect(() => {
    report.current = onUploaded;
    clear.current = onFile;
  });

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- the upload's state follows the chosen file */
    setProgress(0);
    setDone(false);
    if (!file) {
      setPreview(null);
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    let url: string | null = null;
    try {
      url = URL.createObjectURL(file);
      setPreview(url);
    } catch {
      setPreview(null);
    }
    const ac = new AbortController();
    report.current(null);
    uploadPresigned(storeName(file), file, {
      access: "private",
      handleUploadUrl: "/api/audition-video",
      contentType: file.type,
      multipart: file.size > 25_000_000,
      abortSignal: ac.signal,
      onUploadProgress: (e) => setProgress(e.percentage),
    })
      .then((blob) => {
        setProgress(100);
        setDone(true);
        report.current(blob.pathname);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        console.error("[upload]", err);
        setLocalErr(
          err instanceof Error && /switched on|Too many/.test(err.message)
            ? err.message
            : "The upload didn't finish. Check your connection and try again, or paste a link to your video below.",
        );
        clear.current(null);
      });
    return () => {
      ac.abort();
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
        <button
          type="button"
          className="ng-btn ng-btn--ghost ng-btn--sm"
          onClick={() => {
            onUploaded(null);
            onFile(null);
          }}
        >
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
