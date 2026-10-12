"use client";

import dynamic from "next/dynamic";

/**
 * NextGenWaves, code-split: three.js and R3F load in their own chunk after
 * hydration, never in the initial bundle. `ssr: false` must live in a Client
 * Component (Next 16), which is why this wrapper exists. Use this in pages.
 */
export const NextGenWavesLazy = dynamic(() => import("./NextGenWaves"), { ssr: false });

export type { NextGenWavesHandle, NextGenWavesProps } from "./NextGenWaves";
