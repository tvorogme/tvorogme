import { getArticleBySlug } from "@/lib/articles";
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_TRANSLATION_MODEL = "gpt-5.4-mini";
const CACHE_DIRECTORY =
  process.env.ARTICLE_TRANSLATION_CACHE_DIR ??
  (process.env.VERCEL
    ? path.join("/tmp", "tvorogme-article-translations")
    : path.join(process.cwd(), ".next", "article-translations"));

type TranslationPayload = {
  readonly language: string;
  readonly title: string;
  readonly description: string;
  readonly content: string;
  readonly translatedAt: string;
};

type OpenAITranslationPayload = Omit<TranslationPayload, "translatedAt">;

type RouteContext = {
  readonly params: Promise<{
    readonly slug: string;
  }>;
};

function normalizeLanguageCode(value: string) {
  return value.trim().replaceAll("_", "-");
}

function isValidLanguageCode(value: string) {
  return /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(value);
}

function isEnglishLanguage(value: string) {
  return value.toLocaleLowerCase().startsWith("en");
}

function getCachePath(slug: string, language: string) {
  const safeLanguage = language.toLocaleLowerCase().replace(/[^a-z0-9-]/g, "-");
  return path.join(CACHE_DIRECTORY, `${slug}.${safeLanguage}.json`);
}

function isTranslationPayload(value: unknown): value is TranslationPayload {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.language === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.translatedAt === "string"
  );
}

function isOpenAITranslationPayload(
  value: unknown,
): value is OpenAITranslationPayload {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.language === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.content === "string"
  );
}

async function readCachedTranslation(cachePath: string) {
  try {
    const cachedFile = await fs.readFile(cachePath, "utf8");
    const payload: unknown = JSON.parse(cachedFile);

    return isTranslationPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}

async function writeCachedTranslation(
  cachePath: string,
  payload: TranslationPayload,
) {
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return Response.json({ error: "article_not_found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const language = normalizeLanguageCode(url.searchParams.get("lang") ?? "");

  if (!isValidLanguageCode(language)) {
    return Response.json({ error: "invalid_language" }, { status: 400 });
  }

  if (isEnglishLanguage(language)) {
    return Response.json({
      content: article.content,
      description: article.description,
      language,
      title: article.title,
      translatedAt: article.publishedAt,
    });
  }

  const cachePath = getCachePath(article.slug, language);
  const cachedTranslation = await readCachedTranslation(cachePath);

  if (cachedTranslation) {
    return Response.json(cachedTranslation);
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "translation_unavailable" },
      { status: 503 },
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    input: JSON.stringify({
      article: {
        content: article.content,
        description: article.description,
        title: article.title,
      },
      targetLanguage: language,
    }),
    instructions: [
      "Translate the article into the requested BCP-47 target language.",
      "Keep Markdown structure, headings, lists, inline code, fenced code, URLs, product names, proper nouns, and technical identifiers intact.",
      "Return only the structured JSON payload.",
    ].join(" "),
    max_output_tokens: 20000,
    model: process.env.OPENAI_TRANSLATION_MODEL ?? DEFAULT_TRANSLATION_MODEL,
    store: false,
    text: {
      format: {
        description: "A translated article payload.",
        name: "article_translation",
        schema: {
          additionalProperties: false,
          properties: {
            content: { type: "string" },
            description: { type: "string" },
            language: { type: "string" },
            title: { type: "string" },
          },
          required: ["language", "title", "description", "content"],
          type: "object",
        },
        strict: true,
        type: "json_schema",
      },
    },
  });

  const parsedPayload: unknown = JSON.parse(response.output_text);

  if (!isOpenAITranslationPayload(parsedPayload)) {
    return Response.json(
      { error: "invalid_translation_payload" },
      { status: 502 },
    );
  }

  const payload: TranslationPayload = {
    content: parsedPayload.content,
    description: parsedPayload.description,
    language: parsedPayload.language,
    title: parsedPayload.title,
    translatedAt: new Date().toISOString(),
  };

  await writeCachedTranslation(cachePath, payload);

  return Response.json(payload);
}
