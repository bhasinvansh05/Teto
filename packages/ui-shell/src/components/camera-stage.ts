import type { SignSequence } from "@teto/contracts";
import { signLabels } from "../view-model.js";

export interface CameraStageProps {
  signSequence?: SignSequence;
  active?: boolean;
}

/** Full-bleed camera placeholder for Sign→English capture. */
export function renderCameraStage(props: CameraStageProps): string {
  const active = props.active !== false;
  const labels = signLabels(props.signSequence);
  const labelSummary = labels.length ? labels.join(" · ") : "Awaiting signs";

  return [
    `<section`,
    `  class="teto-stage teto-camera-stage${active ? " is-active" : ""}"`,
    `  aria-label="Camera capture stage"`,
    `  data-stage="camera"`,
    `  data-active="${active}"`,
    `  ${props.signSequence ? `data-sequence-id="${escapeAttr(props.signSequence.sequenceId)}"` : ""}`,
    `  data-sign-count="${labels.length}"`,
    `>`,
    `  <div class="teto-stage__plane" aria-hidden="true">`,
    `    <div class="teto-camera-stage__frame">`,
    `      <span class="teto-camera-stage__corner teto-camera-stage__corner--tl"></span>`,
    `      <span class="teto-camera-stage__corner teto-camera-stage__corner--tr"></span>`,
    `      <span class="teto-camera-stage__corner teto-camera-stage__corner--bl"></span>`,
    `      <span class="teto-camera-stage__corner teto-camera-stage__corner--br"></span>`,
    `    </div>`,
    `    <div class="teto-stage__specular"></div>`,
    `  </div>`,
    `  <div class="teto-stage__caption">`,
    `    <p class="teto-stage__eyebrow">Camera</p>`,
    `    <p class="teto-stage__title">${escapeHtml(labelSummary)}</p>`,
    `  </div>`,
    `</section>`,
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
