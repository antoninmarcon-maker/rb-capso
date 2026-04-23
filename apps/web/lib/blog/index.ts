import fs from "node:fs/promises";
import path from "node:path";

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  metaDescription: string;
  tags: string[];
  publishedAt: string;
  body: string;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/**
 * Very small frontmatter parser (supports key: value and key: ["a","b"] on single lines).
 * Good enough for the small set of fields we use; avoids a full gray-matter dep.
 */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const [, front, body] = match;
  const data: Record<string, unknown> = {};

  for (const line of front.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    const value = rawValue.trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        data[key] = JSON.parse(value.replace(/'/g, '"'));
      } catch {
        data[key] = value;
      }
    } else if (value.startsWith('"') && value.endsWith('"')) {
      data[key] = value.slice(1, -1);
    } else {
      data[key] = value;
    }
  }

  return { data, body: body.trim() };
}

export async function getAllArticles(): Promise<Article[]> {
  try {
    const files = await fs.readdir(BLOG_DIR);
    const articles = await Promise.all(
      files
        .filter((f) => f.endsWith(".md"))
        .map(async (f) => {
          const raw = await fs.readFile(path.join(BLOG_DIR, f), "utf8");
          const { data, body } = parseFrontmatter(raw);
          return {
            slug: String(data.slug ?? f.replace(/\.md$/, "")),
            title: String(data.title ?? ""),
            excerpt: String(data.excerpt ?? ""),
            metaDescription: String(data.metaDescription ?? data.excerpt ?? ""),
            tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
            publishedAt: String(data.publishedAt ?? ""),
            body,
          };
        })
    );
    return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } catch {
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const all = await getAllArticles();
  return all.find((a) => a.slug === slug) ?? null;
}
