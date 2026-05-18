import { AsciiRippleSvg } from "./ascii-ripple-svg";

export function SpaceScene() {
  return (
    <button
      aria-label="Activate the campaign star map"
      className="asciiButton spaceScene"
      type="button"
    >
      <AsciiRippleSvg
        className="spaceSceneImage"
        decorative
        height={538}
        loading="eager"
        preserveAspectRatio="xMidYMax meet"
        radius={112}
        src="/campaign-space-ascii.svg"
        strength={11}
        width={1133}
      />
    </button>
  );
}
