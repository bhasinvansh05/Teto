import type { AnimationCommand } from "@teto/contracts";
import { animationDurationMs } from "../view-model.js";

export interface AvatarStageProps {
  animation?: AnimationCommand;
  active?: boolean;
}

/** Full-bleed avatar placeholder consuming AnimationCommand metadata. */
export function renderAvatarStage(props: AvatarStageProps): string {
  const active = props.active !== false;
  const clips = props.animation?.clips ?? [];
  const durationMs = animationDurationMs(props.animation);
  const rate = props.animation?.playbackRate ?? 1;

  const clipSummary =
    clips.length > 0
      ? clips
          .map(
            (clip) =>
              `<li class="teto-avatar-stage__clip" data-clip-id="${escapeAttr(clip.clipId)}" data-token-id="${escapeAttr(clip.tokenId)}">${escapeHtml(clip.clipId)}</li>`,
          )
          .join("\n")
      : `<li class="teto-avatar-stage__clip teto-avatar-stage__clip--empty">Waiting for animation</li>`;

  return [
    `<section`,
    `  class="teto-stage teto-avatar-stage${active ? " is-active" : ""}"`,
    `  aria-label="Avatar signing stage"`,
    `  data-stage="avatar"`,
    `  data-active="${active}"`,
    `  ${props.animation ? `data-command-id="${escapeAttr(props.animation.commandId)}"` : ""}`,
    `  ${props.animation ? `data-gloss-id="${escapeAttr(props.animation.glossId)}"` : ""}`,
    `  data-clip-count="${clips.length}"`,
    `  data-duration-ms="${durationMs}"`,
    `  data-playback-rate="${rate}"`,
    `>`,
    `  <div class="teto-stage__plane" aria-hidden="true">`,
    `    <div class="teto-avatar-stage__silhouette"></div>`,
    `    <div class="teto-stage__specular"></div>`,
    `  </div>`,
    `  <div class="teto-stage__caption">`,
    `    <p class="teto-stage__eyebrow">Avatar</p>`,
    `    <p class="teto-stage__title">${clips.length ? `${clips.length} clips · ${durationMs}ms` : "Ready to sign"}</p>`,
    `  </div>`,
    `  <ul class="teto-avatar-stage__clips visually-hidden">`,
    clipSummary,
    `  </ul>`,
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
