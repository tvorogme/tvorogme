export const ONBOARDING_RESTART_EVENT = "tvorogme:onboarding-restart";

const ONBOARDING_STORAGE_KEY = "tvorogme-onboarding-v1";
const ONBOARDING_COOKIE_NAME = "tvorogme_onboarding";
const ONBOARDING_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type OnboardingChoice = "completed" | "dismissed";

function getSecureCookieAttribute() {
  if (typeof window === "undefined") return "";

  return window.location.protocol === "https:" ? "; Secure" : "";
}

export function getStoredOnboardingChoice() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const cookieChoice = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${ONBOARDING_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (cookieChoice === "completed" || cookieChoice === "dismissed") {
    return cookieChoice;
  }

  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistOnboardingChoice(value: OnboardingChoice) {
  if (typeof document !== "undefined") {
    document.cookie = `${ONBOARDING_COOKIE_NAME}=${value}; Path=/; Max-Age=${ONBOARDING_COOKIE_MAX_AGE}; SameSite=Lax${getSecureCookieAttribute()}`;
  }

  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, value);
  } catch {
    // The in-memory close still works when storage is blocked.
  }
}

export function clearOnboardingChoice() {
  if (typeof document !== "undefined") {
    document.cookie = `${ONBOARDING_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${getSecureCookieAttribute()}`;
  }

  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // Restarting still works in-memory when storage is blocked.
  }
}

export function restartOnboarding() {
  if (typeof window === "undefined") return;

  clearOnboardingChoice();
  window.dispatchEvent(new Event(ONBOARDING_RESTART_EVENT));
}
