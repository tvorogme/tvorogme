"use client";

import type { OnboardingCopy } from "@/data/localized-site";
import {
  ONBOARDING_RESTART_EVENT,
  getStoredOnboardingChoice,
  persistOnboardingChoice,
} from "@/lib/onboarding-preference";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

type OnboardingMode = "hidden" | "prompt" | "tour";
type OnboardingTarget = {
  readonly preferredCardSide?: "left" | "right";
  readonly selector: string;
};

const TOUR_CARD_GAP = 16;
const TOUR_EDGE_GAP = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getOnboardingTarget(href: string): OnboardingTarget {
  if (href === "#skilltree") {
    return {
      preferredCardSide: "left",
      selector: '[data-window-id="skills-window"]',
    };
  }
  if (href === "#profile") {
    return { selector: '[data-window-id="profile-window"]' };
  }
  if (href === "#questlines") {
    return { selector: '[data-window-id="questlines-window"]' };
  }
  if (href === "#chronicles") {
    return { selector: '[data-window-id="incubating-window"]' };
  }
  if (href === "#articles") {
    return { selector: '[data-window-id="articles-window"]' };
  }
  if (href === "#lorelog") return { selector: '[data-window-id="lore-window"]' };

  return { selector: href };
}

function prepareOnboardingStep(href: string) {
  if (href !== "#chronicles") return;

  const pausedTab = document.getElementById(
    "quest-arc-paused",
  ) as HTMLInputElement | null;

  if (pausedTab) pausedTab.checked = true;
}

function clearOnboardingTargets() {
  document
    .querySelectorAll("[data-onboarding-active-target]")
    .forEach((target) => target.removeAttribute("data-onboarding-active-target"));
}

function setTourLayerFallback(layer: HTMLElement, card: HTMLElement | null) {
  const cardBounds = card?.getBoundingClientRect();
  const cardWidth = cardBounds?.width ?? Math.min(390, window.innerWidth - 24);
  const cardHeight = cardBounds?.height ?? 260;

  layer.dataset.spotlight = "missing";
  layer.style.setProperty("--onboarding-spotlight-left", "16px");
  layer.style.setProperty("--onboarding-spotlight-top", "48px");
  layer.style.setProperty(
    "--onboarding-spotlight-width",
    `${Math.max(0, window.innerWidth - 32)}px`,
  );
  layer.style.setProperty(
    "--onboarding-spotlight-height",
    `${Math.max(0, window.innerHeight - 112)}px`,
  );
  layer.style.setProperty(
    "--onboarding-card-left",
    `${clamp(window.innerWidth - cardWidth - 16, 12, window.innerWidth)}px`,
  );
  layer.style.setProperty(
    "--onboarding-card-top",
    `${clamp(window.innerHeight - cardHeight - 52, 12, window.innerHeight)}px`,
  );
}

function getStoredOnboardingMode(): OnboardingMode {
  if (typeof window === "undefined") return "hidden";

  return getStoredOnboardingChoice() ? "hidden" : "prompt";
}

function subscribeToOnboardingChoice(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function OnboardingTour({ labels }: { readonly labels: OnboardingCopy }) {
  const tourLayerRef = useRef<HTMLDivElement | null>(null);
  const tourCardRef = useRef<HTMLElement | null>(null);
  const storedMode = useSyncExternalStore(
    subscribeToOnboardingChoice,
    getStoredOnboardingMode,
    () => "hidden",
  );
  const [modeOverride, setModeOverride] = useState<OnboardingMode | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const mode = modeOverride ?? storedMode;
  const totalSteps = labels.steps.length;
  const currentStepNumber = stepIndex + 1;
  const step = labels.steps[stepIndex];
  const isLastStep = currentStepNumber === totalSteps;

  const updateSpotlight = useCallback(() => {
    const layer = tourLayerRef.current;

    if (!layer || mode !== "tour" || !step) return;

    prepareOnboardingStep(step.href);

    const targetConfig = getOnboardingTarget(step.href);
    const target = document.querySelector<HTMLElement>(targetConfig.selector);

    if (!target) {
      clearOnboardingTargets();
      setTourLayerFallback(layer, tourCardRef.current);
      return;
    }

    clearOnboardingTargets();
    target.setAttribute("data-onboarding-active-target", "true");
    target.scrollIntoView({ block: "center", inline: "nearest" });

    const targetBounds = target.getBoundingClientRect();
    const cardBounds = tourCardRef.current?.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spotlightPadding = viewportWidth <= 640 ? 8 : 10;
    const spotlightLeft = clamp(
      targetBounds.left - spotlightPadding,
      TOUR_EDGE_GAP,
      viewportWidth - TOUR_EDGE_GAP,
    );
    const spotlightTop = clamp(
      targetBounds.top - spotlightPadding,
      TOUR_EDGE_GAP,
      viewportHeight - TOUR_EDGE_GAP,
    );
    const spotlightRight = clamp(
      targetBounds.right + spotlightPadding,
      TOUR_EDGE_GAP,
      viewportWidth - TOUR_EDGE_GAP,
    );
    const spotlightBottom = clamp(
      targetBounds.bottom + spotlightPadding,
      TOUR_EDGE_GAP,
      viewportHeight - TOUR_EDGE_GAP,
    );
    const cardWidth = cardBounds?.width ?? Math.min(390, viewportWidth - 24);
    const cardHeight = cardBounds?.height ?? 260;
    const roomRight = viewportWidth - spotlightRight - TOUR_CARD_GAP;
    const roomLeft = spotlightLeft - TOUR_CARD_GAP;
    const canPlaceRight = roomRight >= cardWidth;
    const canPlaceLeft = roomLeft >= cardWidth;
    let preferredLeft = spotlightLeft;

    if (targetConfig.preferredCardSide === "left") {
      preferredLeft = canPlaceLeft
        ? spotlightLeft - cardWidth - TOUR_CARD_GAP
        : canPlaceRight
          ? spotlightRight + TOUR_CARD_GAP
          : spotlightLeft;
    } else if (targetConfig.preferredCardSide === "right") {
      preferredLeft = canPlaceRight
        ? spotlightRight + TOUR_CARD_GAP
        : canPlaceLeft
          ? spotlightLeft - cardWidth - TOUR_CARD_GAP
          : spotlightLeft;
    } else {
      preferredLeft = canPlaceRight
        ? spotlightRight + TOUR_CARD_GAP
        : canPlaceLeft
          ? spotlightLeft - cardWidth - TOUR_CARD_GAP
          : spotlightLeft;
    }
    const preferredTop =
      spotlightTop + cardHeight > viewportHeight - TOUR_EDGE_GAP
        ? spotlightBottom - cardHeight
        : spotlightTop;

    layer.dataset.spotlight = "ready";
    layer.style.setProperty("--onboarding-spotlight-left", `${spotlightLeft}px`);
    layer.style.setProperty("--onboarding-spotlight-top", `${spotlightTop}px`);
    layer.style.setProperty(
      "--onboarding-spotlight-width",
      `${Math.max(0, spotlightRight - spotlightLeft)}px`,
    );
    layer.style.setProperty(
      "--onboarding-spotlight-height",
      `${Math.max(0, spotlightBottom - spotlightTop)}px`,
    );
    layer.style.setProperty(
      "--onboarding-card-left",
      `${clamp(
        preferredLeft,
        TOUR_EDGE_GAP,
        viewportWidth - cardWidth - TOUR_EDGE_GAP,
      )}px`,
    );
    layer.style.setProperty(
      "--onboarding-card-top",
      `${clamp(
        preferredTop,
        TOUR_EDGE_GAP,
        viewportHeight - cardHeight - TOUR_EDGE_GAP,
      )}px`,
    );
  }, [mode, step]);

  useEffect(() => {
    if (mode !== "tour") {
      clearOnboardingTargets();
      return undefined;
    }

    updateSpotlight();
    window.addEventListener("resize", updateSpotlight);

    return () => {
      clearOnboardingTargets();
      window.removeEventListener("resize", updateSpotlight);
    };
  }, [mode, stepIndex, updateSpotlight]);

  useEffect(() => {
    const handleRestart = () => {
      setStepIndex(0);
      setModeOverride("tour");
    };

    window.addEventListener(ONBOARDING_RESTART_EVENT, handleRestart);
    return () =>
      window.removeEventListener(ONBOARDING_RESTART_EVENT, handleRestart);
  }, []);

  const dismiss = useCallback(() => {
    persistOnboardingChoice("dismissed");
    setModeOverride("hidden");
  }, []);

  const complete = useCallback(() => {
    persistOnboardingChoice("completed");
    setModeOverride("hidden");
  }, []);

  const goToPreviousStep = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const goToNextStep = useCallback(() => {
    setStepIndex((current) => Math.min(totalSteps - 1, current + 1));
  }, [totalSteps]);

  if (mode === "hidden") return null;

  return (
    <div
      className={`onboardingLayer${mode === "tour" ? " onboardingLayerTour" : ""}`}
      data-testid="onboarding-layer"
      ref={tourLayerRef}
    >
      {mode === "tour" ? (
        <>
          <span className="onboardingBackdrop" aria-hidden="true" />
          <span className="onboardingSpotlight" aria-hidden="true" />
        </>
      ) : null}

      <aside
        aria-labelledby="onboarding-title"
        aria-live="polite"
        className={`onboardingToast${mode === "tour" ? " onboardingToastTour" : ""}`}
        data-testid="onboarding-toast"
        ref={tourCardRef}
        role="dialog"
      >
        <header className="onboardingHeader">
          <span>{labels.title}</span>
          <button
            aria-label={labels.close}
            className="onboardingCloseButton"
            data-testid="onboarding-close"
            onClick={dismiss}
            type="button"
          >
            x
          </button>
        </header>

        {mode === "prompt" ? (
          <div className="onboardingBody">
            <h2 id="onboarding-title">{labels.promptTitle}</h2>
            <p>{labels.promptBody}</p>
            <div className="onboardingActions">
              <button
                className="onboardingButton onboardingButtonPrimary"
                data-testid="onboarding-start"
                onClick={() => {
                  setStepIndex(0);
                  setModeOverride("tour");
                }}
                type="button"
              >
                {labels.start}
              </button>
              <button
                className="onboardingButton"
                data-testid="onboarding-decline"
                onClick={dismiss}
                type="button"
              >
                {labels.decline}
              </button>
            </div>
          </div>
        ) : (
          <div className="onboardingBody">
            <div className="onboardingStepMeta">
              <span data-testid="onboarding-step-counter">
                {labels.counterLabel} {currentStepNumber} / {totalSteps}
              </span>
              <span aria-hidden="true">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <i
                    className={index === stepIndex ? "isActive" : undefined}
                    key={index}
                  />
                ))}
              </span>
            </div>
            <h2 id="onboarding-title">{step.title}</h2>
            <p>{step.body}</p>
            <div className="onboardingActions onboardingActionsSplit">
              <button
                className="onboardingButton"
                disabled={stepIndex === 0}
                onClick={goToPreviousStep}
                type="button"
              >
                {labels.previous}
              </button>
              <button
                className="onboardingButton onboardingButtonPrimary"
                data-testid={isLastStep ? "onboarding-finish" : "onboarding-next"}
                onClick={() => {
                  if (isLastStep) {
                    complete();
                    return;
                  }

                  goToNextStep();
                }}
                type="button"
              >
                {isLastStep ? labels.finish : labels.next}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
