import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

const ARTICLES_DIRECTORY = path.join(process.cwd(), "content", "articles");

export type ArticleSummary = {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly publishedAt: string;
  readonly author: string;
  readonly sourceUrl?: string;
  readonly href: string;
  readonly readingTime: string;
};

export type Article = ArticleSummary & {
  readonly content: string;
};

function getRequiredString(
  data: Record<string, unknown>,
  key: string,
  slug: string,
) {
  const value = data[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Article "${slug}" is missing frontmatter: ${key}`);
  }

  return value;
}

function getOptionalString(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
}

const readArticleBySlug = cache((slug: string): Article => {
  const filePath = path.join(ARTICLES_DIRECTORY, `${slug}.md`);
  const file = fs.readFileSync(filePath, "utf8");
  const parsed = matter(file);
  const data = parsed.data as Record<string, unknown>;

  return {
    author: getRequiredString(data, "author", slug),
    content: parsed.content.trim(),
    description: getRequiredString(data, "description", slug),
    publishedAt: getRequiredString(data, "publishedAt", slug),
    readingTime: estimateReadingTime(parsed.content),
    slug,
    sourceUrl: getOptionalString(data, "sourceUrl"),
    title: getRequiredString(data, "title", slug),
    href: `/articles/${slug}`,
  };
});

export const getArticleSlugs = cache(() => {
  if (!fs.existsSync(ARTICLES_DIRECTORY)) return [];

  return fs
    .readdirSync(ARTICLES_DIRECTORY)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => fileName.replace(/\.md$/, ""));
});

export const getAllArticles = cache((): readonly Article[] => {
  return getArticleSlugs()
    .map(readArticleBySlug)
    .sort((left, right) =>
      right.publishedAt.localeCompare(left.publishedAt),
    );
});

export const getArticleBySlug = cache((slug: string) => {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  if (!getArticleSlugs().includes(slug)) return null;

  return readArticleBySlug(slug);
});
