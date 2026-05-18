"use client";

import { useEffect, useRef } from "react";

type CursorIntent =
  | "default"
  | "grab"
  | "pointer"
  | "resize-se"
  | "resize-x"
  | "resize-y"
  | "text";

type CursorDirection = {
  readonly angle: number;
  readonly glyph: string;
  readonly label: string;
};

type TrailPoint = {
  x: number;
  y: number;
};

type TailParticle = TrailPoint & {
  age: number;
  glyph: string;
  ttl: number;
  vx: number;
  vy: number;
};

type RibbonPoint = TrailPoint & {
  age: number;
  ttl: number;
};

type CursorColors = {
  readonly accent: string;
  readonly background: string;
  readonly cyan: string;
  readonly fontFamily: string;
  readonly pink: string;
};

type InitialPointer = {
  readonly x: number;
  readonly y: number;
};

type AsciiCursorProps = {
  readonly initialPointer?: InitialPointer | null;
};

const PARTICLE_GLYPHS = [":", ".", "'", "`", "."] as const;
const TRAIL_POINT_COUNT = 10;
const MAX_PARTICLES = 14;
const MAX_RIBBON_POINTS = 14;
const MAX_RENDER_DELTA_MS = 32;
const MIN_PARTICLE_DISTANCE = 24;
const TRAIL_IDLE_DISTANCE = 0.55;

const POINTER_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  "[data-cursor-intent='pointer']",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[tabindex]:not([tabindex='-1'])",
  "[onclick]",
  "summary",
  "label[for]",
  "input[type='button']:not(:disabled)",
  "input[type='checkbox']:not(:disabled)",
  "input[type='radio']:not(:disabled)",
  "input[type='range']:not(:disabled)",
  "input[type='reset']:not(:disabled)",
  "input[type='submit']:not(:disabled)",
  ".projectCard",
  ".questArcTabList label",
  ".skillTabList label",
].join(",");

const TEXT_SELECTOR = [
  "input:not(:disabled):not([type='button']):not([type='checkbox']):not([type='file']):not([type='hidden']):not([type='radio']):not([type='range']):not([type='reset']):not([type='submit'])",
  "textarea:not(:disabled)",
  "[contenteditable='true']",
].join(",");

const DEFAULT_DIRECTION: CursorDirection = {
  angle: 0,
  glyph: ">",
  label: "right",
};

const POINTER_MEDIA_QUERY = "(pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function getTargetElement(target: EventTarget | null): Element | null {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;

  return null;
}

function getCursorIntent(target: EventTarget | null): CursorIntent {
  const element = getTargetElement(target);

  if (!element) return "default";

  if (element.closest("[data-cursor-intent='pointer']")) return "pointer";
  if (element.closest(".wmResizeHandleSE")) return "resize-se";
  if (element.closest(".wmResizeHandleE")) return "resize-x";
  if (element.closest(".wmResizeHandleS, [data-internal-resize-handle]")) {
    return "resize-y";
  }
  if (element.closest(TEXT_SELECTOR)) return "text";
  if (element.closest(POINTER_SELECTOR)) return "pointer";
  if (element.closest("[data-window-id^='project-window-'] [data-wm-drag-handle]")) {
    return "pointer";
  }
  if (element.closest("[data-wm-drag-handle], .panelHeader")) return "grab";

  return "default";
}

function getCursorDirection(deltaX: number, deltaY: number): CursorDirection {
  const angle = Math.atan2(deltaY, deltaX);
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX > absY * 1.35) {
    return deltaX >= 0
      ? { angle, glyph: ">", label: "right" }
      : { angle, glyph: "<", label: "left" };
  }

  if (absY > absX * 1.35) {
    return deltaY >= 0
      ? { angle, glyph: "v", label: "down" }
      : { angle, glyph: "^", label: "up" };
  }

  if (deltaX >= 0 && deltaY < 0) return { angle, glyph: "/", label: "up-right" };
  if (deltaX < 0 && deltaY >= 0) return { angle, glyph: "/", label: "down-left" };

  return deltaX >= 0
    ? { angle, glyph: "\\", label: "down-right" }
    : { angle, glyph: "\\", label: "up-left" };
}

function getHeadText(intent: CursorIntent, direction: CursorDirection) {
  if (intent === "pointer") return "[x]";
  if (intent === "grab") return `${direction.glyph}:`;
  if (intent === "resize-se") return "\\\\";
  if (intent === "resize-x") return "<->";
  if (intent === "resize-y") return "^v";
  if (intent === "text") return "|";

  return direction.glyph;
}

function resolveCssColor(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function readCursorColors(): CursorColors {
  return {
    accent: resolveCssColor("--accent"),
    background: resolveCssColor("--background"),
    cyan: resolveCssColor("--neon-cyan"),
    fontFamily: getComputedStyle(document.body).fontFamily,
    pink: resolveCssColor("--neon-pink"),
  };
}

function hexToRgba(value: string, alpha: number) {
  const normalized = value.trim();
  const hex = normalized.startsWith("#") ? normalized.slice(1) : normalized;

  if (hex.length !== 6) return normalized;

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function setNodeTransform({
  node,
  rotate = 0,
  scale = 1,
  x,
  y,
}: {
  readonly node: HTMLElement;
  readonly rotate?: number;
  readonly scale?: number;
  readonly x: number;
  readonly y: number;
}) {
  node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotate}rad) scale(${scale})`;
}

function drawSmoothTrail(
  context: CanvasRenderingContext2D,
  points: readonly TrailPoint[],
) {
  if (points.length < 3) return;

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length - 1; index += 1) {
    const midX = (points[index].x + points[index + 1].x) / 2;
    const midY = (points[index].y + points[index + 1].y) / 2;

    context.quadraticCurveTo(points[index].x, points[index].y, midX, midY);
  }

  const last = points[points.length - 1];
  context.lineTo(last.x, last.y);
}

function getPointDistance(point: TrailPoint, x: number, y: number) {
  return Math.hypot(point.x - x, point.y - y);
}

function pushTailParticle({
  angle,
  particles,
  x,
  y,
}: {
  readonly angle: number;
  readonly particles: TailParticle[];
  readonly x: number;
  readonly y: number;
}) {
  const glyph = PARTICLE_GLYPHS[particles.length % PARTICLE_GLYPHS.length];
  const drift = 0.34 + Math.random() * 0.24;
  const side = Math.random() > 0.5 ? 1 : -1;
  const sideAngle = angle + Math.PI / 2;

  particles.push({
    age: 0,
    glyph,
    ttl: 260 + Math.random() * 180,
    vx: Math.cos(angle + Math.PI) * drift + Math.cos(sideAngle) * side * 0.1,
    vy: Math.sin(angle + Math.PI) * drift + Math.sin(sideAngle) * side * 0.1,
    x,
    y,
  });

  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES);
  }
}

export function AsciiCursor({ initialPointer = null }: AsciiCursorProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const initialPointerRef = useRef(initialPointer);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const root = document.documentElement;
    const finePointer = window.matchMedia(POINTER_MEDIA_QUERY);
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);

    if (!finePointer.matches || reducedMotion.matches) {
      layer.hidden = true;
      root.removeAttribute("data-ascii-cursor");
      return;
    }

    const canvas = layer.querySelector<HTMLCanvasElement>(".asciiCursorCanvas");
    const head = layer.querySelector<HTMLElement>(".asciiCursorHead");
    const glyph = layer.querySelector<HTMLElement>(".asciiCursorGlyph");
    const context = canvas?.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });

    if (!canvas || !context || !head || !glyph) return;

    root.dataset.asciiCursor = "true";
    layer.hidden = false;

    let animationFrame = 0;
    let colors = readCursorColors();
    let intent: CursorIntent = "default";
    let direction = DEFAULT_DIRECTION;
    let headText = getHeadText(intent, direction);
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let hasPointer = false;
    let isVisible = false;
    let clickPulseTimer = 0;
    let lastFrameTime = performance.now();
    let lastParticleX = targetX;
    let lastParticleY = targetY;
    const particles: TailParticle[] = [];
    const ribbonPoints: RibbonPoint[] = [];
    const trail = Array.from({ length: TRAIL_POINT_COUNT }, () => ({
      x: targetX,
      y: targetY,
    }));

    const resizeCanvas = () => {
      const pixelRatio = 1;

      canvas.width = Math.ceil(window.innerWidth * pixelRatio);
      canvas.height = Math.ceil(window.innerHeight * pixelRatio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const isTrailSettled = () => {
      const headDistance = getPointDistance(trail[0], targetX, targetY);
      const tailDistance = getPointDistance(
        trail[trail.length - 1],
        targetX,
        targetY,
      );

      return (
        headDistance < TRAIL_IDLE_DISTANCE &&
        tailDistance < TRAIL_IDLE_DISTANCE
      );
    };

    const shouldKeepAnimating = () =>
      isVisible &&
      (!isTrailSettled() || particles.length > 0 || ribbonPoints.length > 0);

    const drawCanvas = (deltaMs: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (!isVisible) return;

      for (let index = ribbonPoints.length - 1; index >= 0; index -= 1) {
        ribbonPoints[index].age += deltaMs;

        if (ribbonPoints[index].age >= ribbonPoints[index].ttl) {
          ribbonPoints.splice(index, 1);
        }
      }

      context.save();
      context.globalCompositeOperation = "source-over";
      context.lineCap = "round";
      context.lineJoin = "round";

      if (ribbonPoints.length > 2) {
        const ribbonTrail = ribbonPoints.slice(0, 10);
        const tailEnd = ribbonTrail[ribbonTrail.length - 1];
        const ribbonGradient = context.createLinearGradient(
          ribbonTrail[0].x,
          ribbonTrail[0].y,
          tailEnd.x,
          tailEnd.y,
        );

        ribbonGradient.addColorStop(0, hexToRgba(colors.cyan, 0.0));
        ribbonGradient.addColorStop(0.18, hexToRgba(colors.cyan, 0.1));
        ribbonGradient.addColorStop(0.54, hexToRgba(colors.pink, 0.07));
        ribbonGradient.addColorStop(1, hexToRgba(colors.accent, 0.0));

        drawSmoothTrail(context, ribbonTrail);
        context.strokeStyle = hexToRgba(colors.background, 0.05);
        context.lineWidth = 16;
        context.shadowBlur = 5;
        context.shadowColor = hexToRgba(colors.cyan, 0.06);
        context.stroke();

        drawSmoothTrail(context, ribbonTrail);
        context.strokeStyle = ribbonGradient;
        context.lineWidth = 5.5;
        context.shadowBlur = 6;
        context.shadowColor = hexToRgba(colors.pink, 0.08);
        context.stroke();

        drawSmoothTrail(context, ribbonTrail.slice(1));
        context.strokeStyle = hexToRgba(
          colors.cyan,
          intent === "pointer" ? 0.2 : 0.14,
        );
        context.lineWidth = 0.8;
        context.shadowBlur = 3;
        context.shadowColor = hexToRgba(colors.cyan, 0.14);
        context.stroke();
      }

      context.font = `700 10px ${colors.fontFamily}`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];

        particle.age += deltaMs;
        particle.x += particle.vx * (deltaMs / 16);
        particle.y += particle.vy * (deltaMs / 16);

        if (particle.age >= particle.ttl) {
          particles.splice(index, 1);
          continue;
        }

        const life = 1 - particle.age / particle.ttl;
        context.globalAlpha = life * 0.28;
        context.shadowBlur = 3.5 * life;
        context.shadowColor = index % 2 ? colors.pink : colors.cyan;
        context.fillStyle = index % 2
          ? hexToRgba(colors.pink, 0.46)
          : hexToRgba(colors.accent, 0.5);
        context.fillText(particle.glyph, particle.x, particle.y);
      }

      context.restore();
      context.globalAlpha = 1;
    };

    const animate = (now: number) => {
      const deltaMs = Math.min(MAX_RENDER_DELTA_MS, now - lastFrameTime);

      animationFrame = 0;
      lastFrameTime = now;
      trail[0].x += (targetX - trail[0].x) * 0.66;
      trail[0].y += (targetY - trail[0].y) * 0.66;

      for (let index = 1; index < trail.length; index += 1) {
        trail[index].x += (trail[index - 1].x - trail[index].x) * 0.5;
        trail[index].y += (trail[index - 1].y - trail[index].y) * 0.5;
      }

      drawCanvas(deltaMs);

      if (shouldKeepAnimating()) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }

      layer.dataset.animating = "false";
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };

    const startAnimation = () => {
      if (animationFrame !== 0) return;

      lastFrameTime = performance.now();
      layer.dataset.animating = "true";
      animationFrame = window.requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }

      layer.dataset.animating = "false";
    };

    const clearTail = () => {
      particles.splice(0);
      ribbonPoints.splice(0);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };

    const setVisible = (nextVisible: boolean) => {
      if (isVisible === nextVisible) return;

      isVisible = nextVisible;
      layer.dataset.visible = nextVisible ? "true" : "false";

      if (!nextVisible) {
        clearTail();
        stopAnimation();
      }
    };

    const setCursorState = (
      nextIntent: CursorIntent,
      nextDirection = direction,
    ) => {
      const nextHeadText = getHeadText(nextIntent, nextDirection);

      if (
        intent === nextIntent &&
        direction.label === nextDirection.label &&
        headText === nextHeadText
      ) {
        return;
      }

      intent = nextIntent;
      direction = nextDirection;
      headText = nextHeadText;
      layer.dataset.intent = nextIntent;
      layer.dataset.direction = nextDirection.label;
      glyph.textContent = nextHeadText;
    };

    const seedInitialPointer = () => {
      const initialPoint = initialPointerRef.current;

      if (!initialPoint) return;

      const initialTarget = document.elementFromPoint(
        initialPoint.x,
        initialPoint.y,
      );
      const nextIntent = getCursorIntent(initialTarget);

      hasPointer = true;
      targetX = initialPoint.x;
      targetY = initialPoint.y;
      trail.forEach((point) => {
        point.x = initialPoint.x;
        point.y = initialPoint.y;
      });
      lastParticleX = initialPoint.x;
      lastParticleY = initialPoint.y;
      setVisible(true);
      setCursorState(nextIntent);
      setNodeTransform({ node: head, x: initialPoint.x, y: initialPoint.y });
      startAnimation();
    };

    const updatePointer = (event: PointerEvent) => {
      const nextIntent = getCursorIntent(event.target);
      const nextX = event.clientX;
      const nextY = event.clientY;

      if (!hasPointer) {
        hasPointer = true;
        targetX = nextX;
        targetY = nextY;
        trail.forEach((point) => {
          point.x = nextX;
          point.y = nextY;
        });
        lastParticleX = nextX;
        lastParticleY = nextY;
        setVisible(true);
        setCursorState(nextIntent);
        setNodeTransform({ node: head, x: nextX, y: nextY });
        startAnimation();
        return;
      }

      const deltaX = nextX - targetX;
      const deltaY = nextY - targetY;

      targetX = event.clientX;
      targetY = event.clientY;
      setVisible(true);
      setNodeTransform({ node: head, x: nextX, y: nextY });
      startAnimation();

      if (Math.hypot(deltaX, deltaY) > 2) {
        const nextDirection = getCursorDirection(deltaX, deltaY);
        const particleDistance = Math.hypot(
          nextX - lastParticleX,
          nextY - lastParticleY,
        );

        if (particleDistance >= MIN_PARTICLE_DISTANCE) {
          ribbonPoints.unshift({
            age: 0,
            ttl: 360,
            x: nextX - Math.cos(nextDirection.angle) * 12,
            y: nextY - Math.sin(nextDirection.angle) * 12,
          });
          if (ribbonPoints.length > MAX_RIBBON_POINTS) {
            ribbonPoints.splice(MAX_RIBBON_POINTS);
          }
          pushTailParticle({
            angle: nextDirection.angle,
            particles,
            x: nextX - Math.cos(nextDirection.angle) * 16,
            y: nextY - Math.sin(nextDirection.angle) * 16,
          });
          lastParticleX = nextX;
          lastParticleY = nextY;
        }

        setCursorState(nextIntent, nextDirection);
        return;
      }

      setCursorState(nextIntent);
    };

    const hideWhenLeavingViewport = (event: PointerEvent) => {
      if (event.relatedTarget === null) setVisible(false);
    };
    const handleWindowBlur = () => setVisible(false);
    const playClickPulse = (event: PointerEvent) => {
      if (event.button !== 0 || getCursorIntent(event.target) !== "pointer") {
        return;
      }

      window.clearTimeout(clickPulseTimer);
      layer.dataset.click = "false";
      void glyph.offsetWidth;
      layer.dataset.click = "true";
      clickPulseTimer = window.setTimeout(() => {
        layer.dataset.click = "false";
      }, 220);
    };

    resizeCanvas();
    setCursorState(intent);
    seedInitialPointer();
    document.addEventListener("pointermove", updatePointer, { passive: true });
    document.addEventListener("pointerover", updatePointer, { passive: true });
    document.addEventListener("pointerdown", playClickPulse, { passive: true });
    document.addEventListener("pointerout", hideWhenLeavingViewport, {
      passive: true,
    });
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("resize", resizeCanvas);
    const themeObserver = new MutationObserver(() => {
      colors = readCursorColors();
    });

    themeObserver.observe(root, {
      attributeFilter: ["data-theme"],
      attributes: true,
    });

    return () => {
      stopAnimation();
      window.clearTimeout(clickPulseTimer);
      root.removeAttribute("data-ascii-cursor");
      themeObserver.disconnect();
      document.removeEventListener("pointermove", updatePointer);
      document.removeEventListener("pointerover", updatePointer);
      document.removeEventListener("pointerdown", playClickPulse);
      document.removeEventListener("pointerout", hideWhenLeavingViewport);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="asciiCursorLayer"
      data-animating="false"
      data-click="false"
      data-intent="default"
      data-visible="false"
      hidden
      ref={layerRef}
    >
      <canvas className="asciiCursorCanvas" />
      <span className="asciiCursorHead">
        <span className="asciiCursorGlyph">&gt;</span>
      </span>
    </div>
  );
}
