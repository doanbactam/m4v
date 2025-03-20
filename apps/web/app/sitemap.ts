import { allPosts as posts } from "content-collections"
import type { MetadataRoute } from "next"
import { config } from "~/config"
import { findAlternativeSlugs } from "~/server/web/alternatives/queries"
import { findCategorySlugs } from "~/server/web/categories/queries"
import { findToolSlugs } from "~/server/web/tools/queries"
import { findTopicSlugs } from "~/server/web/topics/queries"

type Entry = MetadataRoute.Sitemap[number]

const createEntry = (path: string, lastModified: Date, options?: Partial<Entry>): Entry => ({
  url: `${config.site.url}${path}`,
  lastModified,
  changeFrequency: "weekly",
  ...options,
})

export default async function Sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tools, categories, alternatives, topics] = await Promise.all([
    findToolSlugs({}),
    findCategorySlugs({}),
    findAlternativeSlugs({}),
    findTopicSlugs({}),
  ])

  const pages = ["/about", "/advertise", "/submit", "/self-hosted"]
  const now = new Date()

  return [
    // Home
    createEntry("", now, { changeFrequency: "daily", priority: 1 }),

    // Static pages
    ...pages.map(p => createEntry(p, now, { changeFrequency: "monthly" })),

    // Posts
    createEntry("/blog", now),
    ...posts.map(p => createEntry(`/blog/${p._meta.path}`, new Date(p.updatedAt ?? p.publishedAt))),

    // Tools
    ...tools.map((t: { slug: string; updatedAt: Date }) => createEntry(`/${t.slug}`, t.updatedAt)),

    // Categories
    createEntry("/categories", now),
    ...categories.map((c: { slug: string; updatedAt: Date }) => createEntry(`/categories/${c.slug}`, c.updatedAt)),
    ...categories.map((c: { slug: string; updatedAt: Date }) => createEntry(`/categories/${c.slug}/self-hosted`, c.updatedAt)),
    ...categories.flatMap((c: { slug: string; updatedAt: Date }) => []),

    // Alternatives
    createEntry("/alternatives", now),
    ...alternatives.map((a: { slug: string; updatedAt: Date }) => createEntry(`/alternatives/${a.slug}`, a.updatedAt)),

    // Topics
    createEntry("/topics", now),
    ...config.site.alphabet.split("").map(letter => createEntry(`/topics/letter/${letter}`, now)),
    ...topics.map((t: { slug: string; updatedAt: Date }) => createEntry(`/topics/${t.slug}`, t.updatedAt)),

  ]
}
