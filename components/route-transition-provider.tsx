"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import {
  startTransition,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

const LazyAsciiCursor = dynamic(
  () => import("./ascii-cursor").then((module) => module.AsciiCursor),
  {
    loading: () => null,
    ssr: false,
  },
);

type RouteTransitionProviderProps = {
  readonly children: ReactNode;
};

type CursorInitialPointer = {
  readonly x: number;
  readonly y: number;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    readonly finished: Promise<void>;
  };
};

function isModifiedClick(event: MouseEvent) {
  return (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.button !== 0
  );
}

function isAppPageRoute(pathname: string) {
  return pathname === "/" || pathname.startsWith("/articles/");
}

function getAnchorFromEvent(event: MouseEvent) {
  const target = event.target;

  if (!(target instanceof Element)) return null;

  return target.closest<HTMLAnchorElement>("a[href]");
}

export function RouteTransitionProvider({
  children,
}: RouteTransitionProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const fallbackTimerRef = useRef<number | null>(null);
  const pendingPathRef = useRef<string | null>(null);
  const [cursorInitialPointer, setCursorInitialPointer] =
    useState<CursorInitialPointer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRenderCursor, setShouldRenderCursor] = useState(false);

  useEffect(() => {
    if (pendingPathRef.current && pendingPathRef.current === pathname) {
      pendingPathRef.current = null;
      if (fallbackTimerRef.current !== null) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      window.requestAnimationFrame(() => setIsLoading(false));
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current !== null) {
        window.clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointer.matches || reducedMotion.matches) return;

    let didShow = false;
    const showCursor = (event?: PointerEvent) => {
      if (didShow) return;

      didShow = true;
      if (event) {
        setCursorInitialPointer({ x: event.clientX, y: event.clientY });
      }
      setShouldRenderCursor(true);
    };
    const idleTimer = window.setTimeout(() => showCursor(), 2500);

    window.addEventListener("pointermove", showCursor, {
      once: true,
      passive: true,
    });

    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener("pointermove", showCursor);
    };
  }, []);

  useEffect(() => {
    function beginInternalNavigation(href: string, nextPathname: string) {
      if (fallbackTimerRef.current !== null) {
        window.clearTimeout(fallbackTimerRef.current);
      }

      pendingPathRef.current = nextPathname;
      setIsLoading(true);
      fallbackTimerRef.current = window.setTimeout(() => {
        pendingPathRef.current = null;
        setIsLoading(false);
      }, 4000);

      const documentWithTransition = document as ViewTransitionDocument;

      if (documentWithTransition.startViewTransition) {
        documentWithTransition.startViewTransition(() => {
          startTransition(() => router.push(href));
        });
        return;
      }

      startTransition(() => router.push(href));
    }

    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) return;

      const anchor = getAnchorFromEvent(event);

      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href");

      if (!rawHref || rawHref.startsWith("#")) return;

      const url = new URL(rawHref, window.location.href);

      if (url.origin !== window.location.origin) return;
      if (!isAppPageRoute(url.pathname)) return;

      const currentUrl = new URL(window.location.href);
      const isSameDocument =
        url.pathname === currentUrl.pathname && url.search === currentUrl.search;

      if (isSameDocument && url.hash) return;
      if (isSameDocument && !url.hash) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      beginInternalNavigation(
        `${url.pathname}${url.search}${url.hash}`,
        url.pathname,
      );
    }

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [router]);

  return (
    <>
      <div className="routeTransitionView">{children}</div>
      <div
        aria-hidden={!isLoading}
        aria-live="polite"
        className="routeTransitionLayer"
        data-visible={isLoading ? "true" : "false"}
      >
        <span>loading</span>
      </div>
      {shouldRenderCursor ? (
        <LazyAsciiCursor initialPointer={cursorInitialPointer} />
      ) : null}
    </>
  );
}
