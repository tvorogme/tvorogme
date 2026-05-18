"use client";

import type { WindowManagerCopy } from "@/data/localized-site";
import {
  SITE_LANGUAGE_COOKIE,
  SITE_LANGUAGE_OPTIONS,
  SITE_LANGUAGE_STORAGE_KEY,
  getSiteLanguageHtmlLang,
  isSiteLanguage,
  type SiteLanguage,
} from "@/lib/i18n";
import { restartOnboarding } from "@/lib/onboarding-preference";
import {
  createContext,
  type CSSProperties,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_CONSTRAINTS,
  DEFAULT_GAP,
  DENSE_GRID_COLUMNS,
  DENSE_GRID_ROWS,
  GRID_SUBDIVISIONS,
  getDenseGridLine,
  getDenseGridSpan,
  getInteractionTile,
  normalizeConstraints,
  normalizeTile,
  tilesEqual,
  type InteractionState,
  type InteractionStatus,
  type ResizeEdge,
  type WindowConstraints,
  type WindowState,
  type WindowTile,
} from "./window-manager-model";

type WindowManagerContextValue = {
  readonly activeId: string | null;
  readonly beginMove: (
    id: string,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  readonly beginResize: (
    id: string,
    edge: ResizeEdge,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  readonly bringToFront: (id: string) => void;
  readonly closeWindow: (id: string) => void;
  readonly interaction: InteractionStatus | null;
  readonly layers: Record<string, number>;
  readonly layouts: Record<string, WindowTile>;
  readonly openWindow: (windowConfig: ManagedWindowConfig) => void;
  readonly registerWindow: (
    id: string,
    tile: WindowTile,
    constraints: WindowConstraints,
  ) => void;
};

const WindowManagerContext = createContext<WindowManagerContextValue | null>(
  null,
);

export type ManagedWindowConfig = {
  readonly children: ReactNode;
  readonly closeLabel?: string;
  readonly handleLabel?: string;
  readonly id: string;
  readonly initialTile: WindowTile;
  readonly minColumns?: number;
  readonly minRows?: number;
  readonly title: string;
};

const THEME_STORAGE_KEY = "tvorogme-theme";
const THEME_PREFERENCES = ["light", "dark"] as const;
const WINDOW_STACK_BREAKPOINT = "(max-width: 760px)";
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type ThemePreference = (typeof THEME_PREFERENCES)[number];

const THEME_OPTIONS: readonly {
  readonly label: string;
  readonly value: ThemePreference;
}[] = [
  { label: "light", value: "light" },
  { label: "dark", value: "dark" },
];

function applyWindowTileStyle(element: HTMLElement, tile: WindowTile) {
  element.style.setProperty("--wm-col", `${getDenseGridLine(tile.col)}`);
  element.style.setProperty(
    "--wm-col-span",
    `${getDenseGridSpan(tile.colSpan)}`,
  );
  element.style.setProperty("--wm-row", `${getDenseGridLine(tile.row)}`);
  element.style.setProperty(
    "--wm-row-span",
    `${getDenseGridSpan(tile.rowSpan)}`,
  );
}

function isThemePreference(value: string | null): value is ThemePreference {
  return THEME_PREFERENCES.some((preference) => preference === value);
}

function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "light";

  try {
    const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(storedPreference) ? storedPreference : "light";
  } catch {
    return "light";
  }
}

function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.theme = preference;
}

function persistThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage can be unavailable in private or locked-down browser contexts.
  }
}

function applyLanguagePreference(preference: SiteLanguage) {
  if (typeof document === "undefined") return;

  document.documentElement.lang = getSiteLanguageHtmlLang(preference);
  document.documentElement.dataset.language = preference;
}

function persistLanguagePreference(preference: SiteLanguage) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  try {
    window.localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, preference);
  } catch {
    // Language still updates through the cookie when localStorage is blocked.
  }

  document.cookie = `${SITE_LANGUAGE_COOKIE}=${preference}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function useWindowManager() {
  const value = useContext(WindowManagerContext);

  if (!value) {
    throw new Error("WindowItem must be rendered inside WindowManager");
  }

  return value;
}

export function useWorkspaceWindows() {
  return useWindowManager();
}

type WindowManagerProps = {
  readonly children: ReactNode;
  readonly footerCenter?: string;
  readonly footerLeft?: string;
  readonly footerRight?: string;
  readonly labels: WindowManagerCopy;
  readonly language: SiteLanguage;
};

export function WindowManager({
  children,
  footerCenter,
  footerLeft,
  footerRight,
  labels,
  language,
}: WindowManagerProps) {
  const constraintsRef = useRef<Record<string, WindowConstraints>>({});
  const defaultsRef = useRef<Record<string, WindowTile>>({});
  const interactionElementRef = useRef<HTMLElement | null>(null);
  const cleanupInteractionRef = useRef<(() => void) | null>(null);
  const interactionRef = useRef<InteractionState | null>(null);
  const pendingInteractionTileRef = useRef<WindowTile | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const [interaction, setInteraction] = useState<InteractionStatus | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [languagePreference, setLanguagePreference] =
    useState<SiteLanguage>(language);
  const [managedWindows, setManagedWindows] = useState<
    readonly ManagedWindowConfig[]
  >([]);
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    getStoredThemePreference,
  );
  const [state, setState] = useState<WindowState>({
    activeId: null,
    gap: DEFAULT_GAP,
    layers: {},
    layouts: {},
    nextLayer: 1,
  });

  const getConstraints = useCallback(
    (id: string) => constraintsRef.current[id] ?? DEFAULT_CONSTRAINTS,
    [],
  );

  const bringToFront = useCallback(
    (id: string, options: { readonly force?: boolean } = {}) => {
      setState((current) => {
        const currentLayer = current.layers[id] ?? 0;
        const topLayer = Math.max(0, ...Object.values(current.layers));

        if (
          !options.force &&
          current.activeId === id &&
          currentLayer === topLayer
        ) {
          return current;
        }

        const nextLayer = Math.max(current.nextLayer, topLayer + 1);

        return {
          ...current,
          activeId: id,
          layers: {
            ...current.layers,
            [id]: nextLayer,
          },
          nextLayer: nextLayer + 1,
        };
      });
    },
    [],
  );

  const registerWindow = useCallback(
    (id: string, tile: WindowTile, constraints: WindowConstraints) => {
      const normalizedConstraints = normalizeConstraints(constraints);
      const normalizedTile = normalizeTile(tile, normalizedConstraints);

      constraintsRef.current[id] = normalizedConstraints;
      defaultsRef.current[id] = normalizedTile;

      setState((current) => {
        const existingTile = current.layouts[id];

        if (existingTile) {
          const constrainedTile = normalizeTile(
            existingTile,
            normalizedConstraints,
          );

          if (tilesEqual(existingTile, constrainedTile)) return current;

          return {
            ...current,
            layouts: {
              ...current.layouts,
              [id]: constrainedTile,
            },
          };
        }

        return {
          ...current,
          layers: current.layers[id]
            ? current.layers
            : {
                ...current.layers,
                [id]: current.nextLayer,
              },
          layouts: {
            ...current.layouts,
            [id]: normalizedTile,
          },
          nextLayer: current.layers[id]
            ? current.nextLayer
            : current.nextLayer + 1,
        };
      });
    },
    [],
  );

  const previewInteraction = useCallback(
    (point: { x: number; y: number }) => {
      const currentInteraction = interactionRef.current;
      const interactionElement = interactionElementRef.current;
      if (!currentInteraction || !interactionElement) return;

      const nextTile = getInteractionTile(
        currentInteraction,
        point,
        getConstraints(currentInteraction.id),
      );
      const pendingTile = pendingInteractionTileRef.current;

      if (pendingTile && tilesEqual(pendingTile, nextTile)) return;

      pendingInteractionTileRef.current = nextTile;
      applyWindowTileStyle(interactionElement, nextTile);
    },
    [getConstraints],
  );

  const commitInteraction = useCallback(() => {
    const currentInteraction = interactionRef.current;
    const nextTile = pendingInteractionTileRef.current;
    if (!currentInteraction || !nextTile) return;

    pendingInteractionTileRef.current = null;

    setState((current) => {
      const currentTile = current.layouts[currentInteraction.id];

      if (currentTile && tilesEqual(currentTile, nextTile)) {
        return current.activeId === currentInteraction.id
          ? current
          : { ...current, activeId: currentInteraction.id };
      }

      return {
        ...current,
        activeId: currentInteraction.id,
        layouts: {
          ...current.layouts,
          [currentInteraction.id]: nextTile,
        },
      };
    });
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      previewInteraction({ x: event.clientX, y: event.clientY });
    },
    [previewInteraction],
  );

  useEffect(
    () => () => {
      cleanupInteractionRef.current?.();
    },
    [],
  );

  useEffect(() => {
    applyThemePreference(themePreference);
    persistThemePreference(themePreference);
  }, [themePreference]);

  useEffect(() => {
    applyLanguagePreference(languagePreference);
    persistLanguagePreference(languagePreference);
  }, [languagePreference]);

  const startInteraction = useCallback(
    (
      id: string,
      event: ReactPointerEvent<HTMLElement>,
      kind: InteractionState["kind"],
      edge?: ResizeEdge,
    ) => {
      if (window.matchMedia(WINDOW_STACK_BREAKPOINT).matches) return;

      const stage = stageRef.current;
      const tile = state.layouts[id];
      const interactionElement = event.currentTarget.closest(".wmWindow");

      if (!stage || !tile || !(interactionElement instanceof HTMLElement)) {
        return;
      }

      const stageBounds = stage.getBoundingClientRect();
      if (stageBounds.width <= 0 || stageBounds.height <= 0) return;

      event.preventDefault();
      bringToFront(id, { force: true });
      cleanupInteractionRef.current?.();
      const interactionTarget = event.currentTarget;
      const interactionClasses =
        kind === "move"
          ? ["wmMoving"]
          : [
              "wmResizing",
              edge === "s"
                ? "wmResizingY"
                : edge === "e"
                  ? "wmResizingX"
                  : "wmResizingCorner",
            ];

      document.body.classList.add(...interactionClasses);
      setInteraction({ id, kind });
      interactionElementRef.current = interactionElement;
      pendingInteractionTileRef.current = tile;
      interactionRef.current = {
        edge,
        id,
        kind,
        pointerX: event.clientX,
        pointerY: event.clientY,
        stageHeight: stageBounds.height,
        stageWidth: stageBounds.width,
        startTile: tile,
      };

      try {
        interactionTarget.setPointerCapture(event.pointerId);
      } catch {
        // Some browsers can refuse capture after synthetic pointer starts.
      }

      const stopInteraction = (nextEvent?: PointerEvent) => {
        if (nextEvent) {
          previewInteraction({ x: nextEvent.clientX, y: nextEvent.clientY });
        }

        commitInteraction();

        if (nextEvent) {
          try {
            if (interactionTarget.hasPointerCapture(nextEvent.pointerId)) {
              interactionTarget.releasePointerCapture(nextEvent.pointerId);
            }
          } catch {
            // Capture may already be gone after pointer cancellation.
          }
        }

        interactionRef.current = null;
        interactionElementRef.current = null;
        pendingInteractionTileRef.current = null;
        cleanupInteractionRef.current = null;
        document.body.classList.remove(
          "wmMoving",
          "wmResizing",
          "wmResizingX",
          "wmResizingY",
          "wmResizingCorner",
        );
        setInteraction(null);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", stopInteraction);
        window.removeEventListener("pointercancel", stopInteraction);
      };

      cleanupInteractionRef.current = stopInteraction;
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      window.addEventListener("pointerup", stopInteraction);
      window.addEventListener("pointercancel", stopInteraction);
    },
    [
      bringToFront,
      commitInteraction,
      handlePointerMove,
      previewInteraction,
      state.layouts,
    ],
  );

  const beginMove = useCallback(
    (id: string, event: ReactPointerEvent<HTMLElement>) =>
      startInteraction(id, event, "move"),
    [startInteraction],
  );

  const beginResize = useCallback(
    (id: string, edge: ResizeEdge, event: ReactPointerEvent<HTMLElement>) =>
      startInteraction(id, event, "resize", edge),
    [startInteraction],
  );

  const closeWindow = useCallback((id: string) => {
    if (interactionRef.current?.id === id) {
      cleanupInteractionRef.current?.();
    }

    delete constraintsRef.current[id];
    delete defaultsRef.current[id];
    setManagedWindows((current) =>
      current.filter((windowConfig) => windowConfig.id !== id),
    );
    setState((current) => {
      const layouts = { ...current.layouts };
      const layers = { ...current.layers };

      delete layouts[id];
      delete layers[id];

      return {
        ...current,
        activeId: current.activeId === id ? null : current.activeId,
        layers,
        layouts,
      };
    });
  }, []);

  const openWindow = useCallback(
    (windowConfig: ManagedWindowConfig) => {
      setManagedWindows((current) => {
        const existingIndex = current.findIndex(
          (item) => item.id === windowConfig.id,
        );

        if (existingIndex < 0) return [...current, windowConfig];

        return current.map((item, index) =>
          index === existingIndex ? windowConfig : item,
        );
      });
      bringToFront(windowConfig.id, { force: true });
    },
    [bringToFront],
  );

  const resetLayout = useCallback(() => {
    setState((current) => ({
      ...current,
      activeId: null,
      layouts: { ...defaultsRef.current },
    }));
  }, []);

  const handleRestartOnboarding = useCallback(() => {
    restartOnboarding();
    setIsSettingsOpen(false);
  }, []);

  const handleThemeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextPreference = event.currentTarget.value;

      if (isThemePreference(nextPreference)) {
        setThemePreference(nextPreference);
      }
    },
    [],
  );

  const handleLanguageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextPreference = event.currentTarget.value;

      if (!isSiteLanguage(nextPreference)) return;

      setLanguagePreference(nextPreference);
      applyLanguagePreference(nextPreference);
      persistLanguagePreference(nextPreference);
      window.location.reload();
    },
    [],
  );

  const contextValue = useMemo<WindowManagerContextValue>(
    () => ({
      activeId: state.activeId,
      beginMove,
      beginResize,
      bringToFront,
      closeWindow,
      interaction,
      layers: state.layers,
      layouts: state.layouts,
      openWindow,
      registerWindow,
    }),
    [
      beginMove,
      beginResize,
      bringToFront,
      closeWindow,
      interaction,
      openWindow,
      registerWindow,
      state.activeId,
      state.layers,
      state.layouts,
    ],
  );
  const settingsButton = (
    <button
      aria-expanded={isSettingsOpen}
      aria-label={labels.openSettingsAria}
      className="wmSettingsButton"
      data-testid="workspace-settings-button"
      id="settings"
      onClick={() => setIsSettingsOpen((value) => !value)}
      type="button"
    >
      ⚙
    </button>
  );

  return (
    <WindowManagerContext.Provider value={contextValue}>
      <div className="workspace">
        <main
          className="wmStage"
          id="main"
          ref={stageRef}
          style={
            {
              "--wm-grid-columns": `${DENSE_GRID_COLUMNS}`,
              "--wm-grid-rows": `${DENSE_GRID_ROWS}`,
              "--wm-dense-gap": `${state.gap / GRID_SUBDIVISIONS}px`,
              "--wm-gap": `${state.gap}px`,
            } as CSSProperties
          }
        >
          {children}
          {managedWindows.map((windowConfig) => (
            <WindowItem
              closeLabel={windowConfig.closeLabel}
              handleLabel={windowConfig.handleLabel}
              id={windowConfig.id}
              initialTile={windowConfig.initialTile}
              key={windowConfig.id}
              minColumns={windowConfig.minColumns}
              minRows={windowConfig.minRows}
              onClose={() => closeWindow(windowConfig.id)}
              title={windowConfig.title}
            >
              {windowConfig.children}
            </WindowItem>
          ))}
          {isSettingsOpen ? (
            <section
              aria-label={labels.panelAria}
              className="wmSettingsPanel"
              data-testid="workspace-settings-panel"
            >
              <div className="wmSettingsHeader">
                <strong>{labels.heading}</strong>
                <button
                  aria-label={labels.closeSettingsAria}
                  onClick={() => setIsSettingsOpen(false)}
                  type="button"
                >
                  x
                </button>
              </div>
              <label className="wmSettingControl">
                <span>{labels.gapLabel}</span>
                <input
                  aria-label={labels.gapAria}
                  max="40"
                  min="0"
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      gap: Number(event.target.value),
                    }))
                  }
                  type="range"
                  value={state.gap}
                />
                <output>{state.gap}px</output>
              </label>
              <fieldset className="wmThemeControl">
                <legend>{labels.themeLegend}</legend>
                <div className="wmThemeOptions">
                  {THEME_OPTIONS.map(({ label, value }) => (
                    <label className="wmThemeOption" key={value}>
                      <input
                        checked={themePreference === value}
                        name="workspace-theme"
                        onChange={handleThemeChange}
                        type="radio"
                        value={value}
                      />
                      <span>{labels.themeOptions[value] ?? label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="wmThemeControl">
                <legend>{labels.languageLegend}</legend>
                <div className="wmThemeOptions">
                  {SITE_LANGUAGE_OPTIONS.map(({ value }) => (
                    <label className="wmThemeOption" key={value}>
                      <input
                        checked={languagePreference === value}
                        name="workspace-language"
                        onChange={handleLanguageChange}
                        type="radio"
                        value={value}
                      />
                      <span>{labels.languageOptions[value]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button
                className="wmResetButton"
                onClick={resetLayout}
                type="button"
              >
                {labels.resetLayout}
              </button>
              <button
                className="wmResetButton"
                data-testid="restart-onboarding-button"
                onClick={handleRestartOnboarding}
                type="button"
              >
                {labels.restartOnboarding}
              </button>
            </section>
          ) : null}
        </main>
      </div>
      {footerLeft || footerCenter || footerRight ? (
        <footer className="footerBar">
          <span>{footerLeft}</span>
          <span>{footerCenter}</span>
          <div className="footerBar__right">
            <span>{footerRight}</span>
            {settingsButton}
          </div>
        </footer>
      ) : (
        <div className="wmSettingsFallback">{settingsButton}</div>
      )}
    </WindowManagerContext.Provider>
  );
}

type WindowItemProps = {
  readonly children: ReactNode;
  readonly closeLabel?: string;
  readonly handleLabel?: string;
  readonly id: string;
  readonly initialTile: WindowTile;
  readonly minColumns?: number;
  readonly minRows?: number;
  readonly onClose?: () => void;
  readonly title: string;
};

function formatWindowTitle(title: string) {
  return title.replace(/\s*\/\s*/gu, " ").trim().toLocaleUpperCase();
}

export function WindowItem({
  children,
  closeLabel = "Close window",
  handleLabel,
  id,
  initialTile,
  minColumns = DEFAULT_CONSTRAINTS.minColSpan,
  minRows = DEFAULT_CONSTRAINTS.minRowSpan,
  onClose,
  title,
}: WindowItemProps) {
  const {
    activeId,
    beginMove,
    beginResize,
    bringToFront,
    interaction,
    layers,
    layouts,
    registerWindow,
  } = useWindowManager();
  const { col, colSpan, row, rowSpan } = initialTile;
  const tile = layouts[id] ?? initialTile;
  const isActive = activeId === id;
  const isMoving = interaction?.id === id && interaction.kind === "move";
  const isResizing = interaction?.id === id && interaction.kind === "resize";
  const layer = layers[id] ?? 0;
  const displayHandleLabel = handleLabel ? formatWindowTitle(handleLabel) : null;

  useEffect(() => {
    registerWindow(
      id,
      { col, colSpan, row, rowSpan },
      {
        minColSpan: minColumns,
        minRowSpan: minRows,
      },
    );
  }, [
    col,
    colSpan,
    id,
    minColumns,
    minRows,
    registerWindow,
    row,
    rowSpan,
  ]);

  const onPointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;

      const target = event.target as HTMLElement;
      if (target.closest("a, button, input, output, select, textarea")) {
        bringToFront(id);
        return;
      }

      if (target.closest(".wmResizeHandle")) {
        return;
      }

      const handle = target.closest("[data-wm-drag-handle], .panelHeader");
      if (!handle || !event.currentTarget.contains(handle)) {
        bringToFront(id);
        return;
      }

      beginMove(id, event);
    },
    [beginMove, bringToFront, id],
  );

  return (
    <section
      aria-label={formatWindowTitle(title)}
      className={`wmWindow${isActive ? " isActive" : ""}${
        displayHandleLabel ? " wmWindowWithChrome" : ""
      }${isMoving ? " isMoving" : ""}${isResizing ? " isResizing" : ""}`}
      data-stack-layer={layer}
      data-window-id={id}
      onPointerDownCapture={onPointerDownCapture}
      style={
        {
          "--wm-col": `${getDenseGridLine(tile.col)}`,
          "--wm-col-span": `${getDenseGridSpan(tile.colSpan)}`,
          "--wm-row": `${getDenseGridLine(tile.row)}`,
          "--wm-row-span": `${getDenseGridSpan(tile.rowSpan)}`,
          "--wm-z": layer,
        } as CSSProperties
      }
    >
      {displayHandleLabel ? (
        <div className="wmDragHandle" data-wm-drag-handle>
          <span>:: {displayHandleLabel}</span>
          {onClose ? (
            <button
              aria-label={closeLabel}
              className="wmWindowCloseButton"
              data-cursor-intent="pointer"
              onClick={onClose}
              type="button"
            >
              x
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="wmWindowContent">{children}</div>
      <span
        aria-hidden="true"
        className="wmResizeHandle wmResizeHandleE"
        onPointerDown={(event) => beginResize(id, "e", event)}
      />
      <span
        aria-hidden="true"
        className="wmResizeHandle wmResizeHandleS"
        onPointerDown={(event) => beginResize(id, "s", event)}
      />
      <span
        aria-hidden="true"
        className="wmResizeHandle wmResizeHandleSE"
        onPointerDown={(event) => beginResize(id, "se", event)}
      />
    </section>
  );
}
