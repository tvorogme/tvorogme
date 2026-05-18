"use client";

import type { Article } from "@/lib/articles";
import {
  SITE_LANGUAGE_COOKIE,
  SITE_LANGUAGE_OPTIONS,
  SITE_LANGUAGE_STORAGE_KEY,
  isSiteLanguage,
  normalizeSiteLanguage,
} from "@/lib/i18n";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ArticleReaderProps = {
  readonly article: Article;
  readonly contactEmail: string;
};

type ArticleDisplay = {
  readonly title: string;
  readonly description: string;
  readonly content: string;
};

type TranslationResponse = ArticleDisplay & {
  readonly language: string;
};

type LanguageState = {
  readonly preference: string;
  readonly custom: string;
};

type TranslationState = {
  readonly article: ArticleDisplay | null;
  readonly language: string;
  readonly status: "idle" | "ready" | "fallback";
};

const LANGUAGE_STORAGE_KEY = "tvorogme-article-language";
const COMMON_LANGUAGES = [
  { label: "system", value: "system" },
  ...SITE_LANGUAGE_OPTIONS.map((language) => ({
    label: language.shortLabel,
    value: language.value,
  })),
] as const;
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const ARTICLE_READER_LABELS = {
  en: {
    backHome: "< home",
    customAria: "Custom language",
    customOption: "custom",
    fallbackStatus: "Original version",
    language: "Language",
    languageOptions: {
      en: "English",
      ru: "Russian",
      zh: "Chinese",
    },
    originalPost: "Original post",
    subscribeAria: "Subscribe",
    subscribeEmail: "Subscribe email",
    subscribeRss: "Subscribe RSS",
    systemOption: "system",
  },
  ru: {
    backHome: "< домой",
    customAria: "Свой язык",
    customOption: "свой",
    fallbackStatus: "Оригинальная версия",
    language: "Язык",
    languageOptions: {
      en: "English",
      ru: "Русский",
      zh: "中文",
    },
    originalPost: "Оригинальный пост",
    subscribeAria: "Подписка",
    subscribeEmail: "Подписаться по email",
    subscribeRss: "Подписаться на RSS",
    systemOption: "система",
  },
  zh: {
    backHome: "< 首页",
    customAria: "自定义语言",
    customOption: "自定义",
    fallbackStatus: "原始版本",
    language: "语言",
    languageOptions: {
      en: "English",
      ru: "俄语",
      zh: "中文",
    },
    originalPost: "原文",
    subscribeAria: "订阅",
    subscribeEmail: "邮件订阅",
    subscribeRss: "RSS 订阅",
    systemOption: "系统",
  },
} as const;

function normalizeLanguageCode(value: string) {
  return value.trim().replaceAll("_", "-");
}

function isValidLanguageCode(value: string) {
  return /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(value);
}

function getSystemLanguage() {
  if (typeof navigator === "undefined") return "en";

  return normalizeLanguageCode(
    navigator.languages?.[0] ?? navigator.language ?? "en",
  );
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;

  return (
    document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${name}=`))
      ?.split("=")[1] ?? null
  );
}

function subscribeToSystemLanguage(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("languagechange", onStoreChange);
  return () => window.removeEventListener("languagechange", onStoreChange);
}

function getStoredLanguageState(): LanguageState {
  if (typeof window === "undefined") {
    return { custom: "ja", preference: "system" };
  }

  try {
    const storedPreference =
      window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ??
      window.localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY) ??
      readCookie(SITE_LANGUAGE_COOKIE);

    if (!storedPreference) {
      return { custom: "ja", preference: "system" };
    }

    if (
      storedPreference === "system" ||
      COMMON_LANGUAGES.some((item) => item.value === storedPreference)
    ) {
      return { custom: "ja", preference: storedPreference };
    }

    if (isValidLanguageCode(storedPreference)) {
      return { custom: storedPreference, preference: "custom" };
    }
  } catch {
    return { custom: "ja", preference: "system" };
  }

  return { custom: "ja", preference: "system" };
}

function persistSiteLanguage(value: string) {
  if (!isSiteLanguage(value)) return;

  try {
    window.localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, value);
  } catch {
    // The article selector can still work without global localStorage.
  }

  document.cookie = `${SITE_LANGUAGE_COOKIE}=${value}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function isEnglishLanguage(value: string) {
  return value.toLocaleLowerCase().startsWith("en");
}

function getArticleReaderLabels(language: string) {
  return ARTICLE_READER_LABELS[normalizeSiteLanguage(language) ?? "en"];
}

function isTranslationResponse(value: unknown): value is TranslationResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.language === "string"
  );
}

export function ArticleReader({ article, contactEmail }: ArticleReaderProps) {
  const canonicalArticle = useMemo<ArticleDisplay>(
    () => ({
      content: article.content,
      description: article.description,
      title: article.title,
    }),
    [article.content, article.description, article.title],
  );
  const [languageState, setLanguageState] = useState(getStoredLanguageState);
  const [translationState, setTranslationState] = useState<TranslationState>(
    {
      article: null,
      language: "en",
      status: "idle",
    },
  );
  const systemLanguage = useSyncExternalStore(
    subscribeToSystemLanguage,
    getSystemLanguage,
    () => "en",
  );
  const languagePreference = languageState.preference;
  const customLanguage = languageState.custom;

  const requestedLanguage =
    languagePreference === "system"
      ? systemLanguage
      : languagePreference === "custom"
        ? normalizeLanguageCode(customLanguage)
        : languagePreference;
  const canTranslate = isValidLanguageCode(requestedLanguage);
  const labels = getArticleReaderLabels(requestedLanguage);
  const shouldTranslate = canTranslate && !isEnglishLanguage(requestedLanguage);
  const displayArticle =
    shouldTranslate &&
    translationState.language === requestedLanguage &&
    translationState.article
      ? translationState.article
      : canonicalArticle;
  const status =
    shouldTranslate && translationState.language === requestedLanguage
      ? translationState.status
      : "idle";

  useEffect(() => {
    try {
      const storedValue =
        languagePreference === "custom"
          ? normalizeLanguageCode(customLanguage)
          : languagePreference;

      if (languagePreference === "custom" && !isValidLanguageCode(storedValue)) {
        return;
      }

      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, storedValue);
      persistSiteLanguage(storedValue);
    } catch {
      // Language preference is nice to have; the reader still works without it.
    }
  }, [customLanguage, languagePreference]);

  useEffect(() => {
    if (canTranslate) {
      document.documentElement.lang = requestedLanguage;
    }
  }, [canTranslate, requestedLanguage]);

  useEffect(() => {
    const controller = new AbortController();

    if (!canTranslate || !shouldTranslate) {
      return () => controller.abort();
    }

    async function translateArticle() {
      try {
        const response = await fetch(
          `/api/articles/${article.slug}/translate?lang=${encodeURIComponent(
            requestedLanguage,
          )}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Translation failed: ${response.status}`);
        }

        const payload: unknown = await response.json();

        if (!isTranslationResponse(payload)) {
          throw new Error("Translation payload is invalid");
        }

        setTranslationState({
          article: {
            content: payload.content,
            description: payload.description,
            title: payload.title,
          },
          language: requestedLanguage,
          status: "ready",
        });
      } catch {
        if (controller.signal.aborted) return;

        setTranslationState({
          article: null,
          language: requestedLanguage,
          status: "fallback",
        });
      }
    }

    translateArticle();

    return () => controller.abort();
  }, [
    article.slug,
    canTranslate,
    requestedLanguage,
    shouldTranslate,
  ]);

  return (
    <article className="articleReader">
      <div className="articleChrome">
        <Link href="/" className="articleBackLink">
          {labels.backHome}
        </Link>
        <form className="articleLanguage" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="article-language">{labels.language}</label>
          <select
            id="article-language"
            onChange={(event) =>
              setLanguageState((current) => ({
                ...current,
                preference: event.target.value,
              }))
            }
            value={languagePreference}
          >
            {COMMON_LANGUAGES.map((language) => (
              <option key={language.value} value={language.value}>
                {language.value === "system"
                  ? labels.systemOption
                  : labels.languageOptions[language.value]}
              </option>
            ))}
            <option value="custom">{labels.customOption}</option>
          </select>
          <input
            aria-label={labels.customAria}
            disabled={languagePreference !== "custom"}
            onChange={(event) =>
              setLanguageState((current) => ({
                ...current,
                custom: event.target.value,
              }))
            }
            pattern="[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*"
            placeholder="ja"
            value={customLanguage}
          />
        </form>
      </div>

      <header className="articleHero">
        <p>
          <time dateTime={article.publishedAt}>{article.publishedAt}</time>
          {" / "}
          {article.readingTime}
        </p>
        <h1>{displayArticle.title}</h1>
        <p>{displayArticle.description}</p>
        <div className="articleSubscribe" aria-label={labels.subscribeAria}>
          <a href={`mailto:${contactEmail}?subject=Subscribe`}>
            {labels.subscribeEmail}
          </a>
          <a href="/rss.xml">{labels.subscribeRss}</a>
        </div>
        {status === "fallback" ? (
          <p className="articleTranslationStatus">{labels.fallbackStatus}</p>
        ) : null}
      </header>

      <div className="articleBody">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {displayArticle.content}
        </ReactMarkdown>
      </div>

      {article.sourceUrl ? (
        <footer className="articleSource">
          <a href={article.sourceUrl} rel="noreferrer" target="_blank">
            {labels.originalPost}
          </a>
        </footer>
      ) : null}
    </article>
  );
}
