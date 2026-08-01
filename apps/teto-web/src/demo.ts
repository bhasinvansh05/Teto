import { runIntegratedPipeline, runMockSignToEnglishPipeline } from "./pipeline.js";

console.log("=== Mock pipeline ===");
const mock = await runMockSignToEnglishPipeline();
console.log("English:", mock.english.text);
console.log("Gloss:", mock.gloss.tokens.map((t) => t.gloss).join(" "));

console.log("\n=== CP5 integrated pipeline ===");
const live = await runIntegratedPipeline();
console.log("Signs:", live.sequence?.signs.map((s) => s.label).join(" "));
console.log("English:", live.english.text);
console.log("Gloss:", live.gloss.tokens.map((t) => t.gloss).join(" "));
console.log("Clips:", live.animation.clips.map((c) => c.clipId).join(", "));
console.log("--- shell ---");
console.log(live.shellHtml);
