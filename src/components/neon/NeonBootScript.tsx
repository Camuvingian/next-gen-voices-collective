import { applyNeonSettings } from "./neonBoot";

/** Inline <head> script: paints the visitor's saved neon colour and power before first paint. */
export function NeonBootScript() {
  return <script dangerouslySetInnerHTML={{ __html: `try{(${applyNeonSettings.toString()})()}catch(e){}` }} />;
}
