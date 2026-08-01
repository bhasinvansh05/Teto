import { renderShellMarkup, createShellState } from "@teto/ui-shell";
import { runMockSignToEnglishPipeline } from "./pipeline.js";

const result = await runMockSignToEnglishPipeline();
const html = renderShellMarkup({
  state: createShellState("sign_to_english"),
  english: result.english,
  gloss: result.gloss,
});

console.log("Pipeline OK");
console.log("English:", result.english.text);
console.log("Gloss:", result.gloss.tokens.map((t) => t.gloss).join(" "));
console.log("Clips:", result.animation.clips.map((c) => c.clipId).join(", "));
console.log("--- markup ---");
console.log(html);
