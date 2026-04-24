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

const BLOG_ROOT = path.join(process.cwd(), "content", "blog");

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

async function loadDir(dir: string): Promise<Article[]> {
  try {
    const files = await fs.readdir(dir);
    return Promise.all(
      files
        .filter((f) => f.endsWith(".md"))
        .map(async (f) => {
          const raw = await fs.readFile(path.join(dir, f), "utf8");
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
  } catch {
    return [];
  }
}

export async function getAllArticles(locale = "fr"): Promise<Article[]> {
  const primary = await loadDir(path.join(BLOG_ROOT, locale));
  if (primary.length > 0) {
    return primary.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }
  // Fallback to French if the locale folder is empty or missing
  const fallback = await loadDir(path.join(BLOG_ROOT, "fr"));
  return fallback.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getArticleBySlug(
  slug: string,
  locale = "fr"
): Promise<Article | null> {
  const all = await getAllArticles(locale);
  return all.find((a) => a.slug === slug) ?? null;
}
