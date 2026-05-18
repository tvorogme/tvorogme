import type { CSSProperties } from "react";
import { AsciiRippleSvg } from "./ascii-ripple-svg";

export function ProgressBar({
  value,
  size = 12,
}: {
  readonly value: number;
  readonly size?: number;
}) {
  const clampedValue = Math.max(0, Math.min(value, 100));
  const filled = Math.round((clampedValue / 100) * size);
  const empty = size - filled;

  return (
    <span
      className="progressGlyph"
      aria-label={`${clampedValue}%`}
      style={{ "--value": `${clampedValue}%` } as CSSProperties}
    >
      [{"■".repeat(filled)}
      {"□".repeat(empty)}]
    </span>
  );
}

export function Avatar() {
  return (
    <div className="avatarButton animatedAvatar">
      <AsciiRippleSvg
        ariaLabel="Cyberpunk ASCII portrait of Andrey"
        className="avatarStaticImage"
        height={1024}
        loading="eager"
        src="/avatar-cyberpunk.svg"
        preserveAspectRatio="xMidYMid slice"
        radius={240}
        strength={18}
        width={1024}
      />
    </div>
  );
}

export function EraBeforeScene() {
  return (
    <AsciiRippleSvg
      ariaLabel="ASCII scene before the AI agents era"
      className="eraSceneImage"
      height={260}
      preserveAspectRatio="xMidYMid slice"
      radius={84}
      src="/era-before-ai-agents.svg?scene=road-v3"
      strength={9}
      width={520}
    />
  );
}

export function EraAfterScene() {
  return (
    <AsciiRippleSvg
      ariaLabel="ASCII scene after the AI agents era"
      className="eraSceneImage"
      height={260}
      preserveAspectRatio="xMidYMid slice"
      radius={84}
      src="/era-after-ai-agents.svg?scene=road-v3"
      strength={9}
      width={520}
    />
  );
}

export function ArticlesScene() {
  return (
    <div className="articlesScene" aria-label="ASCII article desk">
      <pre aria-hidden="true">{String.raw`
        .      .    .
      .    .-""""-.    .
          /  _  _  \
         |  ( || )  |
          \   \_/  /
           '.___.'
          __/| |\__
         /___| |___\
`}</pre>
    </div>
  );
}
