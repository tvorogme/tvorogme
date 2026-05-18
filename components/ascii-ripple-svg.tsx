"use client";

/* eslint-disable @next/next/no-img-element -- Plain SVGs avoid next/image client runtime in the landing bundle. */

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const MAX_INTERACTIVE_GLYPHS = 5000;
const SETTLE_THRESHOLD = 0.025;

type AsciiRippleSvgProps = {
  readonly src: string;
  readonly className?: string;
  readonly ariaLabel?: string;
  readonly decorative?: boolean;
  readonly width: number;
  readonly height: number;
  readonly loading?: "eager" | "lazy";
  readonly preserveAspectRatio?: string;
  readonly radius?: number;
  readonly strength?: number;
};

type Glyph = {
  readonly element: SVGTextElement;
  cx: number;
  cy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
};

type Pulse = {
  readonly x: number;
  readonly y: number;
  readonly startedAt: number;
  readonly strength: number;
};

type RippleScene = {
  readonly svg: SVGSVGElement;
  readonly glyphs: Glyph[];
  readonly radius: number;
  readonly strength: number;
};

export function AsciiRippleSvg({
  src,
  className = "",
  ariaLabel,
  decorative = false,
  width,
  height,
  loading = "lazy",
  preserveAspectRatio = "xMidYMid meet",
  radius,
  strength,
}: AsciiRippleSvgProps) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [markup, setMarkup] = useState<string | null>(null);
  const [shouldMountRipple, setShouldMountRipple] = useState(false);

  const prepareInteractiveRipple = useCallback(() => {
    if (shouldMountRipple || typeof window === "undefined") return;

    const canAnimate =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (canAnimate) {
      setShouldMountRipple(true);
    }
  }, [shouldMountRipple]);

  useEffect(() => {
    if (!shouldMountRipple) return;

    const controller = new AbortController();

    async function loadSvg() {
      const response = await fetch(src, { signal: controller.signal });
      const text = await response.text();
      setMarkup(text.replace(/<\?xml[\s\S]*?\?>\s*/u, ""));
    }

    loadSvg().catch((error: unknown) => {
      if (!controller.signal.aborted) {
        console.error(`Failed to load ASCII SVG: ${src}`, error);
      }
    });

    return () => {
      controller.abort();
    };
  }, [shouldMountRipple, src]);

  useEffect(() => {
    const host = hostRef.current;
    const svg = host?.querySelector("svg");

    if (!host || !(svg instanceof SVGSVGElement)) {
      return;
    }

    let cleanup = () => {};
    let cancelled = false;
    const setupFrame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      cleanup = mountAsciiRipple(host, svg, {
        preserveAspectRatio,
        radius,
        strength,
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(setupFrame);
      cleanup();
    };
  }, [markup, preserveAspectRatio, radius, strength]);

  const classes = ["asciiRippleViewport", className].filter(Boolean).join(" ");
  const fallbackStyle = getFallbackObjectStyle(preserveAspectRatio);

  return (
    <span
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : ariaLabel}
      className={classes}
      onFocus={prepareInteractiveRipple}
      onPointerEnter={prepareInteractiveRipple}
      ref={hostRef}
      role={decorative ? undefined : "img"}
    >
      {markup ? (
        <span
          className="asciiRippleMount"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      ) : (
        <img
          alt=""
          aria-hidden="true"
          className="asciiRippleFallback"
          decoding="async"
          draggable={false}
          height={height}
          loading={loading}
          src={src}
          style={fallbackStyle}
          width={width}
        />
      )}
    </span>
  );
}

function getFallbackObjectStyle(preserveAspectRatio: string): CSSProperties {
  const [alignment = "xMidYMid", scale = "meet"] =
    preserveAspectRatio.trim().split(/\s+/u);
  const objectFit =
    alignment === "none" ? "fill" : scale === "slice" ? "cover" : "contain";
  const x = alignment.includes("xMin")
    ? "left"
    : alignment.includes("xMax")
      ? "right"
      : "center";
  const y = alignment.includes("YMin")
    ? "top"
    : alignment.includes("YMax")
      ? "bottom"
      : "center";

  return {
    objectFit,
    objectPosition: `${x} ${y}`,
  };
}

function mountAsciiRipple(
  host: HTMLElement,
  initialSvg: SVGSVGElement,
  options: {
    readonly preserveAspectRatio: string;
    readonly radius?: number;
    readonly strength?: number;
  },
) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reduceMotion) {
    return () => {};
  }

  const pointer = { x: 0, y: 0, inside: false };
  let scene: RippleScene | null = null;
  let sceneDirty = true;
  let pulses: Pulse[] = [];
  let frame = 0;
  let lastPulseAt = 0;
  let lastPulseX = Number.NaN;
  let lastPulseY = Number.NaN;

  const resetGlyphs = (glyphs: readonly Glyph[]) => {
    for (const glyph of glyphs) {
      glyph.element.removeAttribute("transform");
    }
  };

  const prepareScene = (svg: SVGSVGElement): RippleScene | null => {
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("preserveAspectRatio", options.preserveAspectRatio);
    svg.removeAttribute("role");
    svg.removeAttribute("aria-labelledby");

    if (!svg.querySelector(".asciiRippleGlyph")) {
      expandReferencedUses(svg);
      mountInteractiveText(svg);
    }

    svg.dataset.asciiRippleReady = "true";

    const glyphs = readGlyphs(svg);

    if (glyphs.length === 0) {
      return null;
    }

    syncGlyphCenters(svg, glyphs);

    const viewBox = svg.viewBox.baseVal;
    const minSide = Math.max(1, Math.min(viewBox.width, viewBox.height));

    return {
      svg,
      glyphs,
      radius: options.radius ?? Math.max(62, minSide * 0.16),
      strength: options.strength ?? Math.max(8, minSide * 0.018),
    };
  };

  const getScene = () => {
    const svg = host.querySelector("svg");

    if (!(svg instanceof SVGSVGElement)) {
      if (scene) {
        resetGlyphs(scene.glyphs);
      }

      scene = null;
      sceneDirty = false;

      return null;
    }

    if (!sceneDirty && scene?.svg === svg && svg.isConnected) {
      return scene;
    }

    if (scene?.svg !== svg) {
      resetGlyphs(scene?.glyphs ?? []);
      pulses = [];
      lastPulseAt = 0;
      lastPulseX = Number.NaN;
      lastPulseY = Number.NaN;
    }

    scene = prepareScene(svg);
    sceneDirty = false;

    return scene;
  };

  const toSvgPoint = (event: PointerEvent) => {
    const currentScene = getScene();

    if (!currentScene) {
      return null;
    }

    const matrix = currentScene.svg.getScreenCTM();

    if (!matrix) {
      return null;
    }

    const point = currentScene.svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    return point.matrixTransform(matrix.inverse());
  };

  const queuePulse = (now: number, intensity = 1) => {
    const moved = Math.hypot(pointer.x - lastPulseX, pointer.y - lastPulseY);

    if (now - lastPulseAt < 72 && moved < 18) {
      return;
    }

    lastPulseAt = now;
    lastPulseX = pointer.x;
    lastPulseY = pointer.y;
    pulses = [
      ...pulses.slice(-3),
      { x: pointer.x, y: pointer.y, startedAt: now, strength: intensity },
    ];
  };

  const ensureAnimation = () => {
    if (frame === 0) {
      frame = window.requestAnimationFrame(animate);
    }
  };

  const updatePointer = (event: PointerEvent) => {
    const point = toSvgPoint(event);

    if (!point) {
      return;
    }

    pointer.x = point.x;
    pointer.y = point.y;
    queuePulse(performance.now(), pointer.inside ? 0.72 : 0.9);
    ensureAnimation();
  };

  const handlePointerEnter = (event: PointerEvent) => {
    sceneDirty = true;
    pointer.inside = true;
    updatePointer(event);
  };

  const handlePointerMove = (event: PointerEvent) => {
    pointer.inside = true;
    updatePointer(event);
  };

  const handlePointerLeave = () => {
    pointer.inside = false;
    ensureAnimation();
  };

  const handleWindowPointerMove = (event: PointerEvent) => {
    if (!pointer.inside) {
      return;
    }

    if (event.target instanceof Node && host.contains(event.target)) {
      return;
    }

    pointer.inside = false;
    ensureAnimation();
  };

  function animate(now: number) {
    frame = 0;
    const currentScene = getScene();

    if (!currentScene) {
      return;
    }

    pulses = pulses.filter((pulse) => now - pulse.startedAt < 760);

    let anyMoving = false;

    for (const glyph of currentScene.glyphs) {
      const target = getTargetOffset(
        glyph,
        pointer,
        pulses,
        now,
        currentScene.radius,
        currentScene.strength,
      );

      glyph.vx = (glyph.vx + (target.x - glyph.x) * 0.19) * 0.74;
      glyph.vy = (glyph.vy + (target.y - glyph.y) * 0.19) * 0.74;
      glyph.x += glyph.vx;
      glyph.y += glyph.vy;

      const moving =
        Math.abs(glyph.x) > SETTLE_THRESHOLD ||
        Math.abs(glyph.y) > SETTLE_THRESHOLD ||
        Math.abs(glyph.vx) > SETTLE_THRESHOLD ||
        Math.abs(glyph.vy) > SETTLE_THRESHOLD;

      if (moving) {
        glyph.active = true;
        glyph.element.setAttribute(
          "transform",
          `translate(${glyph.x.toFixed(2)} ${glyph.y.toFixed(2)})`,
        );
        anyMoving = true;
      } else if (glyph.active) {
        glyph.active = false;
        glyph.x = 0;
        glyph.y = 0;
        glyph.vx = 0;
        glyph.vy = 0;
        glyph.element.removeAttribute("transform");
      }
    }

    if (pointer.inside || pulses.length > 0 || anyMoving) {
      frame = window.requestAnimationFrame(animate);
    }
  }

  host.addEventListener("pointerenter", handlePointerEnter);
  host.addEventListener("pointermove", handlePointerMove);
  host.addEventListener("pointerleave", handlePointerLeave);
  host.addEventListener("pointercancel", handlePointerLeave);
  window.addEventListener("pointermove", handleWindowPointerMove);
  window.addEventListener("blur", handlePointerLeave);

  const observer = new MutationObserver(() => {
    sceneDirty = true;

    if (pointer.inside) {
      ensureAnimation();
    }
  });

  scene = prepareScene(initialSvg);
  sceneDirty = false;
  observer.observe(host, { childList: true, subtree: true });

  return () => {
    host.removeEventListener("pointerenter", handlePointerEnter);
    host.removeEventListener("pointermove", handlePointerMove);
    host.removeEventListener("pointerleave", handlePointerLeave);
    host.removeEventListener("pointercancel", handlePointerLeave);
    window.removeEventListener("pointermove", handleWindowPointerMove);
    window.removeEventListener("blur", handlePointerLeave);
    observer.disconnect();

    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
    }

    resetGlyphs(scene?.glyphs ?? []);
  };
}

function getTargetOffset(
  glyph: Glyph,
  pointer: { readonly x: number; readonly y: number; readonly inside: boolean },
  pulses: readonly Pulse[],
  now: number,
  radius: number,
  strength: number,
) {
  let x = 0;
  let y = 0;

  if (pointer.inside) {
    const force = radialForce(glyph.cx, glyph.cy, pointer.x, pointer.y, radius);
    x += force.x * strength;
    y += force.y * strength;
  }

  for (const pulse of pulses) {
    const age = now - pulse.startedAt;
    const waveRadius = age * 0.42;
    const waveWidth = radius * 0.18;
    const dx = glyph.cx - pulse.x;
    const dy = glyph.cy - pulse.y;
    const distance = Math.hypot(dx, dy) || 1;
    const ring = Math.exp(-((distance - waveRadius) ** 2) / (2 * waveWidth ** 2));
    const fade = Math.max(0, 1 - age / 760);
    const push = ring * fade * pulse.strength * strength * 0.46;

    x += (dx / distance) * push;
    y += (dy / distance) * push;
  }

  return { x, y };
}

function radialForce(
  x: number,
  y: number,
  originX: number,
  originY: number,
  radius: number,
) {
  const dx = x - originX;
  const dy = y - originY;
  const distance = Math.hypot(dx, dy);

  if (distance >= radius) {
    return { x: 0, y: 0 };
  }

  const unitX = distance > 0.01 ? dx / distance : 0;
  const unitY = distance > 0.01 ? dy / distance : -1;
  const proximity = 1 - distance / radius;
  const eased = proximity * proximity * (3 - 2 * proximity);

  return {
    x: unitX * eased,
    y: unitY * eased,
  };
}

function expandReferencedUses(svg: SVGSVGElement) {
  const uses = Array.from(svg.querySelectorAll("use"));

  for (const useElement of uses) {
    const href =
      useElement.href.baseVal ||
      useElement.getAttribute("href") ||
      useElement.getAttributeNS(XLINK_NS, "href");

    if (!href?.startsWith("#")) {
      continue;
    }

    const referenced = svg.querySelector(`#${CSS.escape(href.slice(1))}`);

    if (!(referenced instanceof SVGElement)) {
      continue;
    }

    const clone = referenced.cloneNode(true) as SVGElement;
    const classes = [
      referenced.getAttribute("class"),
      useElement.getAttribute("class"),
    ]
      .filter(Boolean)
      .join(" ");

    clone.removeAttribute("id");

    if (classes) {
      clone.setAttribute("class", classes);
    }

    const transform = useElement.getAttribute("transform");
    const x = Number(useElement.getAttribute("x") ?? 0);
    const y = Number(useElement.getAttribute("y") ?? 0);

    if (transform || x !== 0 || y !== 0) {
      clone.setAttribute(
        "transform",
        `${transform ?? ""} translate(${x} ${y})`.trim(),
      );
    }

    useElement.replaceWith(clone);
  }
}

function splitVisibleText(svg: SVGSVGElement) {
  const textElements = Array.from(svg.querySelectorAll("text")).filter(
    (textElement) => !textElement.closest("defs"),
  );

  for (const textElement of textElements) {
    splitTextElement(textElement as SVGTextElement);
  }
}

function mountInteractiveText(svg: SVGSVGElement) {
  const glyphCount = countVisibleGlyphCandidates(svg);

  if (glyphCount > MAX_INTERACTIVE_GLYPHS) {
    mountSampledTextOverlay(svg, glyphCount, MAX_INTERACTIVE_GLYPHS);
    return;
  }

  splitVisibleText(svg);
}

function splitTextElement(textElement: SVGTextElement) {
  const chunks = Array.from(textElement.querySelectorAll("tspan"));

  if (chunks.length === 0) {
    chunks.push(textElement);
  }

  const group = document.createElementNS(SVG_NS, "g");
  copyInheritedTextAttributes(textElement, group);

  for (const chunk of chunks) {
    const content = chunk.textContent ?? "";
    const count = Math.min(content.length, chunk.getNumberOfChars());

    for (let index = 0; index < count; index += 1) {
      const character = content[index];

      if (!character || /\s/u.test(character)) {
        continue;
      }

      const glyph = document.createElementNS(SVG_NS, "text") as SVGTextElement;

      try {
        const position = chunk.getStartPositionOfChar(index);
        const extent = chunk.getExtentOfChar(index);
        const centerX = position.x + extent.width / 2;
        const centerY = position.y + extent.height / 2;

        glyph.textContent = character;
        glyph.setAttribute("class", "asciiRippleGlyph");
        glyph.setAttribute("x", position.x.toFixed(2));
        glyph.setAttribute("y", position.y.toFixed(2));
        glyph.dataset.cx = centerX.toFixed(2);
        glyph.dataset.cy = centerY.toFixed(2);
        group.appendChild(glyph);
      } catch {
        continue;
      }
    }
  }

  textElement.replaceWith(group);
}

function mountSampledTextOverlay(
  svg: SVGSVGElement,
  totalGlyphCount: number,
  maxGlyphCount: number,
) {
  const textElements = Array.from(svg.querySelectorAll("text")).filter(
    (textElement) => !textElement.closest("defs"),
  );
  let glyphIndex = 0;
  let previousSlot = -1;

  for (const textElement of textElements) {
    const chunks = Array.from(textElement.querySelectorAll("tspan"));

    if (chunks.length === 0) {
      chunks.push(textElement);
    }

    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "asciiRippleSampledLayer");
    copyInheritedTextAttributes(textElement as SVGTextElement, group);
    let hasGlyphs = false;

    for (const chunk of chunks) {
      const content = chunk.textContent ?? "";
      const count = Math.min(content.length, chunk.getNumberOfChars());

      for (let index = 0; index < count; index += 1) {
        const character = content[index];

        if (!character || /\s/u.test(character)) {
          continue;
        }

        const slot = Math.floor((glyphIndex * maxGlyphCount) / totalGlyphCount);
        glyphIndex += 1;

        if (slot === previousSlot) {
          continue;
        }

        previousSlot = slot;

        try {
          const glyph = createRippleGlyph(chunk, index, character);

          group.appendChild(glyph);
          hasGlyphs = true;
        } catch {
          continue;
        }
      }
    }

    if (hasGlyphs) {
      textElement.parentNode?.insertBefore(group, textElement.nextSibling);
    }
  }
}

function countVisibleGlyphCandidates(svg: SVGSVGElement) {
  const textElements = Array.from(svg.querySelectorAll("text")).filter(
    (textElement) => !textElement.closest("defs"),
  );

  return textElements.reduce((total, textElement) => {
    const chunks = Array.from(textElement.querySelectorAll("tspan"));
    const textNodes = chunks.length > 0 ? chunks : [textElement];

    return (
      total +
      textNodes.reduce((chunkTotal, chunk) => {
        const content = chunk.textContent ?? "";

        return chunkTotal + content.replace(/\s/gu, "").length;
      }, 0)
    );
  }, 0);
}

function createRippleGlyph(
  chunk: SVGTextContentElement,
  index: number,
  character: string,
) {
  const glyph = document.createElementNS(SVG_NS, "text") as SVGTextElement;
  const position = chunk.getStartPositionOfChar(index);
  const extent = chunk.getExtentOfChar(index);
  const centerX = position.x + extent.width / 2;
  const centerY = position.y + extent.height / 2;

  glyph.textContent = character;
  glyph.setAttribute("class", "asciiRippleGlyph");
  glyph.setAttribute("x", position.x.toFixed(2));
  glyph.setAttribute("y", position.y.toFixed(2));
  glyph.dataset.cx = centerX.toFixed(2);
  glyph.dataset.cy = centerY.toFixed(2);

  return glyph;
}

function copyInheritedTextAttributes(
  source: SVGTextElement,
  target: SVGGElement,
) {
  for (const attribute of Array.from(source.attributes)) {
    if (attribute.name === "x" || attribute.name === "y") {
      continue;
    }

    target.setAttribute(attribute.name, attribute.value);
  }
}

function readGlyphs(svg: SVGSVGElement): Glyph[] {
  return Array.from(svg.querySelectorAll(".asciiRippleGlyph")).map((element) => {
    const glyph = element as SVGTextElement;

    return {
      element: glyph,
      cx: Number(glyph.dataset.cx ?? 0),
      cy: Number(glyph.dataset.cy ?? 0),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      active: false,
    };
  });
}

function syncGlyphCenters(svg: SVGSVGElement, glyphs: readonly Glyph[]) {
  const svgScreenMatrix = svg.getScreenCTM();
  const svgScreenInverse = svgScreenMatrix?.inverse();

  for (const glyph of glyphs) {
    const baseX = Number(glyph.element.dataset.cx ?? 0);
    const baseY = Number(glyph.element.dataset.cy ?? 0);
    const parent = glyph.element.parentElement;

    if (
      parent instanceof SVGGraphicsElement &&
      svgScreenMatrix &&
      svgScreenInverse
    ) {
      const parentScreenMatrix = parent.getScreenCTM();

      if (parentScreenMatrix) {
        const point = svg.createSVGPoint();
        point.x = baseX;
        point.y = baseY;
        const transformed = point
          .matrixTransform(parentScreenMatrix)
          .matrixTransform(svgScreenInverse);

        glyph.cx = transformed.x;
        glyph.cy = transformed.y;
        continue;
      }
    }

    glyph.cx = baseX;
    glyph.cy = baseY;
  }
}
