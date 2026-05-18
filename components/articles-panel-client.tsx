"use client";

import type { ArticlesPanelCopy } from "@/data/localized-site";
import type { ArticleSummary } from "@/lib/articles";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ArticlesScene } from "./ascii-scenes";

type ArticlesPanelClientProps = {
  readonly articles: readonly ArticleSummary[];
  readonly labels: ArticlesPanelCopy;
};

export function ArticlesPanelClient({
  articles,
  labels,
}: ArticlesPanelClientProps) {
  const [query, setQuery] = useState("");
  const featuredArticle = articles[0] ?? null;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const getArticleTitle = useCallback(
    (article: ArticleSummary) =>
      labels.articleTitles[article.slug] ?? article.title,
    [labels.articleTitles],
  );
  const filteredArticles = useMemo(() => {
    if (!normalizedQuery) return articles;

    return articles.filter((article) => {
      const localizedTitle = getArticleTitle(article).toLocaleLowerCase();

      return (
        localizedTitle.includes(normalizedQuery) ||
        article.title.toLocaleLowerCase().includes(normalizedQuery)
      );
    });
  }, [articles, getArticleTitle, normalizedQuery]);

  if (!featuredArticle) {
    return <p className="panelLead">{labels.noArticles}</p>;
  }

  return (
    <div className="articlesLayout">
      <Link
        className="featuredArticleCard"
        href={`/articles/${featuredArticle.slug}`}
        prefetch={false}
      >
        <ArticlesScene />
        <h2>{getArticleTitle(featuredArticle)}</h2>
      </Link>

      <div className="articleSplitRail" aria-hidden="true" />

      <div className="articleIndexPane">
        <input
          aria-label={labels.searchAria}
          className="articleSearch"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.searchPlaceholder}
          suppressHydrationWarning
          type="search"
          value={query}
        />
        <ol className="articleTitleList" aria-label={labels.listAria}>
          {filteredArticles.map((article) => (
            <li key={article.slug}>
              <Link href={`/articles/${article.slug}`} prefetch={false}>
                {getArticleTitle(article)}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
