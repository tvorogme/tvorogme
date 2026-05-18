import { profile } from "@/data/site";
import { getAllArticles } from "@/lib/articles";
import { getRequestOrigin, toAbsoluteUrl } from "@/lib/site-url";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toPubDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toUTCString();
}

export function GET(request: Request) {
  const origin = getRequestOrigin(request);
  const items = getAllArticles()
    .map((article) => {
      const articleUrl = toAbsoluteUrl(origin, article.href);

      return [
        "<item>",
        `<title>${escapeXml(article.title)}</title>`,
        `<link>${escapeXml(articleUrl)}</link>`,
        `<guid isPermaLink="true">${escapeXml(articleUrl)}</guid>`,
        `<pubDate>${toPubDate(article.publishedAt)}</pubDate>`,
        `<description>${escapeXml(article.description)}</description>`,
        "</item>",
      ].join("");
    })
    .join("");

  const feed = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>${escapeXml(`${profile.brand} Articles`)}</title>`,
    `<link>${escapeXml(origin)}</link>`,
    `<description>${escapeXml("Articles by Andrey Tvorozhkov")}</description>`,
    `<managingEditor>${escapeXml(profile.contactEmail)}</managingEditor>`,
    items,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
