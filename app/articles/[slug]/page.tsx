import { ArticleReader } from "@/components/article-reader";
import { profile } from "@/data/site";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type ArticlePageProps = {
  readonly params: Promise<{
    readonly slug: string;
  }>;
};

export function generateStaticParams() {
  return getAllArticles().map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article not found",
    };
  }

  return {
    alternates: {
      canonical: article.href,
      types: {
        "application/rss+xml": "/rss.xml",
      },
    },
    authors: [{ name: article.author }],
    description: article.description,
    openGraph: {
      description: article.description,
      title: article.title,
      type: "article",
      url: article.href,
    },
    title: `${article.title} / tvorog.me`,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="articlePage">
      <ArticleReader article={article} contactEmail={profile.contactEmail} />
    </main>
  );
}
