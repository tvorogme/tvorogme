"use client";

import {
  Children,
  Fragment,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_MIN_SECTION_SIZE = 32;
const STACK_DIVIDER_SIZE = 10;
const STACK_RESIZE_BREAKPOINT = "(max-width: 760px)";

type ResizeState = {
  readonly dividerIndex: number;
  readonly minAfter: number;
  readonly minBefore: number;
  readonly pairSize: number;
  readonly sizes: readonly number[];
  readonly startY: number;
};

type ResizableStackProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly initialFractions?: readonly number[];
  readonly label: string;
  readonly minPixels?: readonly number[];
  readonly paneClassName?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function classNames(...values: readonly (string | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

function getGridTemplateRows(
  sectionCount: number,
  getSectionSize: (index: number) => string,
) {
  return Array.from({ length: sectionCount })
    .flatMap((_, index) => {
      const sectionSize = getSectionSize(index);

      if (index === sectionCount - 1) return [sectionSize];

      return [sectionSize, `${STACK_DIVIDER_SIZE}px`];
    })
    .join(" ");
}

export function ResizableStack({
  children,
  className,
  initialFractions = [],
  label,
  minPixels = [],
  paneClassName,
}: ResizableStackProps) {
  const sections = useMemo(() => Children.toArray(children), [children]);
  const cleanupResizeRef = useRef<(() => void) | null>(null);
  const pendingSizesRef = useRef<readonly number[] | null>(null);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const resizeRef = useRef<ResizeState | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const [sizes, setSizes] = useState<readonly number[] | null>(null);
  const activeSizes = sizes?.length === sections.length ? sizes : null;

  const getMinSize = useCallback(
    (index: number) => minPixels[index] ?? DEFAULT_MIN_SECTION_SIZE,
    [minPixels],
  );

  const measureSections = useCallback(
    () =>
      sections.map((_, index) => {
        const measured =
          sectionRefs.current[index]?.getBoundingClientRect().height ?? 0;

        return Math.max(getMinSize(index), Math.round(measured));
      }),
    [getMinSize, sections],
  );

  const getRowsForSizes = useCallback(
    (nextSizes: readonly number[]) =>
      getGridTemplateRows(sections.length, (index) => `${nextSizes[index]}px`),
    [sections.length],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const resize = resizeRef.current;
      if (!resize) return;

      const nextSizes = [...resize.sizes];
      const nextBefore = clamp(
        resize.sizes[resize.dividerIndex] + event.clientY - resize.startY,
        resize.minBefore,
        resize.pairSize - resize.minAfter,
      );

      nextSizes[resize.dividerIndex] = nextBefore;
      nextSizes[resize.dividerIndex + 1] = resize.pairSize - nextBefore;
      pendingSizesRef.current = nextSizes;
      stackRef.current?.style.setProperty(
        "grid-template-rows",
        getRowsForSizes(nextSizes),
      );
    },
    [getRowsForSizes],
  );

  const stopResize = useCallback(() => {
    cleanupResizeRef.current?.();
  }, []);

  const beginResize = useCallback(
    (dividerIndex: number, event: ReactPointerEvent<HTMLElement>) => {
      if (window.matchMedia(STACK_RESIZE_BREAKPOINT).matches) return;

      const measuredSizes = measureSections();
      const minBefore = getMinSize(dividerIndex);
      const minAfter = getMinSize(dividerIndex + 1);
      const pairSize = Math.max(
        measuredSizes[dividerIndex] + measuredSizes[dividerIndex + 1],
        minBefore + minAfter,
      );

      event.preventDefault();
      event.stopPropagation();
      setSizes(measuredSizes);
      pendingSizesRef.current = measuredSizes;
      resizeRef.current = {
        dividerIndex,
        minAfter,
        minBefore,
        pairSize,
        sizes: measuredSizes,
        startY: event.clientY,
      };

      const cleanupResize = () => {
        const pendingSizes = pendingSizesRef.current;

        resizeRef.current = null;
        cleanupResizeRef.current = null;
        pendingSizesRef.current = null;
        document.body.classList.remove("internalResizingY");
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", stopResize);
        window.removeEventListener("pointercancel", stopResize);

        if (pendingSizes) {
          setSizes(pendingSizes);
        }
      };

      cleanupResizeRef.current?.();
      document.body.classList.add("internalResizingY");
      cleanupResizeRef.current = cleanupResize;
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      window.addEventListener("pointerup", stopResize);
      window.addEventListener("pointercancel", stopResize);
    },
    [getMinSize, handlePointerMove, measureSections, stopResize],
  );

  useEffect(() => stopResize, [stopResize]);

  const gridTemplateRows = getGridTemplateRows(sections.length, (index) => {
    const sectionSize = activeSizes?.[index]
      ? `${activeSizes[index]}px`
      : `minmax(${getMinSize(index)}px, ${initialFractions[index] ?? 1}fr)`;

    return sectionSize;
  });

  if (sections.length <= 1) {
    return <>{children}</>;
  }

  return (
    <div
      className={classNames("internalResizeStack", className)}
      ref={stackRef}
      style={{ gridTemplateRows } as CSSProperties}
    >
      {sections.map((section, index) => (
        <Fragment key={index}>
          <div
            className={classNames("internalResizePane", paneClassName)}
            ref={(element) => {
              sectionRefs.current[index] = element;
            }}
          >
            {section}
          </div>
          {index < sections.length - 1 ? (
            <div
              aria-label={`${label}: resize section ${index + 1}`}
              aria-orientation="horizontal"
              className="internalResizeHandle dashRule"
              data-internal-resize-handle
              onPointerDown={(event) => beginResize(index, event)}
              role="separator"
            />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
