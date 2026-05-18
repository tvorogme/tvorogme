"use client";

import type { CodexCopy, ProjectPopoverCopy } from "@/data/localized-site";
import type { Quest } from "@/data/site";
import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  startTransition,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useWorkspaceWindows } from "./window-manager";
import {
  loadProjectWindowConfig,
  preloadProjectWindowContent,
} from "./project-window-loader";

type ProjectPopoverProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly codexLabels: CodexCopy;
  readonly labels: ProjectPopoverCopy;
  readonly quest: Quest;
};

const PROJECT_PREVIEW_GAP = 8;
const PROJECT_PREVIEW_MARGIN = 12;
const PROJECT_PREVIEW_MIN_BOTTOM_SPACE = 180;
const PROJECT_PREVIEW_WIDTH = 376;

type ProjectPreviewPlacement = "top" | "bottom";

type ProjectPreviewPosition = {
  readonly left: number;
  readonly placement: ProjectPreviewPlacement;
  readonly top: number;
};

function previewPositionsEqual(
  left: ProjectPreviewPosition | null,
  right: ProjectPreviewPosition,
) {
  return (
    left?.left === right.left &&
    left.placement === right.placement &&
    left.top === right.top
  );
}

export function ProjectPopover({
  children,
  className = "",
  codexLabels,
  labels,
  quest,
}: ProjectPopoverProps) {
  const { openWindow } = useWorkspaceWindows();
  const cardRef = useRef<HTMLElement | null>(null);
  const previewFrameRef = useRef<number | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] =
    useState<ProjectPreviewPosition | null>(null);
  const previewId = useId();

  const readPreviewPosition = useCallback(() => {
    if (!cardRef.current || typeof window === "undefined") return;

    const rect = cardRef.current.getBoundingClientRect();
    const previewWidth = Math.min(
      PROJECT_PREVIEW_WIDTH,
      window.innerWidth - PROJECT_PREVIEW_MARGIN * 2,
    );
    const maxLeft = Math.max(
      PROJECT_PREVIEW_MARGIN,
      window.innerWidth - previewWidth - PROJECT_PREVIEW_MARGIN,
    );
    const left = Math.min(
      Math.max(rect.left, PROJECT_PREVIEW_MARGIN),
      maxLeft,
    );
    const bottomSpace = window.innerHeight - rect.bottom;
    const placement: ProjectPreviewPlacement =
      bottomSpace >= PROJECT_PREVIEW_MIN_BOTTOM_SPACE ||
      bottomSpace >= rect.top
        ? "bottom"
        : "top";

    return {
      left,
      placement,
      top:
        placement === "bottom"
          ? rect.bottom + PROJECT_PREVIEW_GAP
          : rect.top - PROJECT_PREVIEW_GAP,
    };
  }, []);

  const commitPreviewPosition = useCallback(() => {
    const nextPosition = readPreviewPosition();

    if (!nextPosition) return;

    setPreviewPosition((currentPosition) =>
      previewPositionsEqual(currentPosition, nextPosition)
        ? currentPosition
        : nextPosition,
    );
  }, [readPreviewPosition]);

  const updatePreviewPosition = useCallback(() => {
    if (previewFrameRef.current !== null) return;

    previewFrameRef.current = window.requestAnimationFrame(() => {
      previewFrameRef.current = null;
      commitPreviewPosition();
    });
  }, [commitPreviewPosition]);

  const openProjectWindow = useCallback(() => {
    void loadProjectWindowConfig({ codexLabels, labels, quest }).then(
      (windowConfig) => {
        startTransition(() => openWindow(windowConfig));
      },
    );
  }, [codexLabels, labels, openWindow, quest]);

  const handleOpenProjectWindow = useCallback(() => {
    setIsPreviewVisible(false);
    openProjectWindow();
  }, [openProjectWindow]);

  const showPreview = useCallback(() => {
    void preloadProjectWindowContent();
    commitPreviewPosition();
    setIsPreviewVisible(true);
  }, [commitPreviewPosition]);

  const hidePreview = useCallback(() => {
    setIsPreviewVisible(false);
  }, []);

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const nextFocused = event.relatedTarget;

      if (
        nextFocused instanceof Node &&
        event.currentTarget.contains(nextFocused)
      ) {
        return;
      }

      hidePreview();
    },
    [hidePreview],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      handleOpenProjectWindow();
    },
    [handleOpenProjectWindow],
  );

  useEffect(() => {
    if (!isPreviewVisible) return;

    window.addEventListener("resize", updatePreviewPosition);
    window.addEventListener("scroll", updatePreviewPosition, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", updatePreviewPosition);
      window.removeEventListener("scroll", updatePreviewPosition, {
        capture: true,
      });
    };
  }, [isPreviewVisible, updatePreviewPosition]);

  useEffect(
    () => () => {
      if (previewFrameRef.current !== null) {
        window.cancelAnimationFrame(previewFrameRef.current);
      }
    },
    [],
  );

  const preview =
    isPreviewVisible &&
    previewPosition &&
    typeof document !== "undefined"
      ? createPortal(
          <ProjectHoverPreview
            id={previewId}
            labels={labels}
            position={previewPosition}
            quest={quest}
          />,
          document.body,
        )
      : null;

  return (
    <>
      <article
        ref={cardRef}
        aria-describedby={previewId}
        aria-haspopup="dialog"
        aria-label={`${labels.openWindow}: ${quest.name}`}
        className={`projectCard ${className}`.trim()}
        data-project-id={quest.id}
        onBlur={handleBlur}
        onClick={handleOpenProjectWindow}
        onFocus={showPreview}
        onKeyDown={handleKeyDown}
        onPointerEnter={showPreview}
        onPointerLeave={hidePreview}
        role="button"
        tabIndex={0}
      >
        {children}
      </article>
      {preview}
    </>
  );
}

function ProjectHoverPreview({
  id,
  labels,
  position,
  quest,
}: {
  readonly id: string;
  readonly labels: ProjectPopoverCopy;
  readonly position: ProjectPreviewPosition;
  readonly quest: Quest;
}) {
  const heading = quest.tagline ?? quest.summary;
  const summary =
    quest.detail && quest.detail !== heading
      ? quest.detail
      : quest.summary !== heading
        ? quest.summary
        : quest.description;

  return (
    <aside
      className="projectHoverPreview"
      data-placement={position.placement}
      id={id}
      style={
        {
          "--project-hover-left": `${position.left}px`,
          "--project-hover-top": `${position.top}px`,
        } as CSSProperties
      }
    >
      <div className="projectHoverPreviewChrome" aria-hidden="true">
        <span>QUEST {quest.name.toLocaleUpperCase()}</span>
        <span>{quest.progress}%</span>
      </div>
      <strong>{quest.name}</strong>
      <p>{heading}</p>
      <small>{summary}</small>
      <span className="projectHoverPreviewHint">{labels.hoverHint}</span>
    </aside>
  );
}
