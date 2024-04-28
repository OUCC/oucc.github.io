import { lazy } from '@/utils/lazy'
import { type CollectionEntry, getCollection, getEntry } from 'astro:content'
import type { BlogCategory } from './config'

type TagId = CollectionEntry<'tags'>['id']
type BlogSlug = CollectionEntry<'blogs'>['slug']
export type TagStatistics = Readonly<
  Record<TagId, readonly Readonly<{ slug: BlogSlug; time: number }>[]>
>
export type BlogStatistics = Readonly<
  Record<
    BlogSlug,
    readonly Readonly<{ collection: 'blogs'; slug: BlogSlug; score: number }>[]
  >
>

const statistics = lazy(async () => {
  const blogs = await getCollection('blogs')
  const blogMetas = await Promise.all(
    blogs.map((b) => getEntry({ collection: 'blog-metas', id: b.slug })),
  )
  const tags = await getCollection('tags')

  const blogWithMeta = blogs
    .map((b, i) => ({
      slug: b.slug,
      category: b.data.category,
      tags: b.data.tags,
      time:
        blogMetas[i]?.data.updateDate?.getTime() ??
        blogMetas[i]?.data.postDate.getTime() ??
        Date.now(),
    }))
    .sort((blog1, blog2) => blog2.time - blog1.time)

  const tagStatistics = Object.fromEntries(
    tags.map(
      (tag) =>
        [
          tag.id,
          blogWithMeta
            .filter((b) => b.tags.some((t) => t.id === tag.id))
            .map(({ tags: _, ...b }) => b) as TagStatistics[TagId],
        ] as const,
    ),
  ) as TagStatistics
  const categoryStatistics = {
    tech: blogWithMeta.filter((b) => b.category === 'tech'),
    club: blogWithMeta.filter((b) => b.category === 'club'),
    other: blogWithMeta.filter((b) => b.category === 'other'),
  } as const satisfies Record<BlogCategory, any>

  const blogStatistics = Object.fromEntries(
    blogWithMeta.map(({ slug, category, tags }) => {
      const result: { [K in BlogSlug]?: { score: number; time: number } } = {}

      for (const { slug, time } of categoryStatistics[category])
        (result[slug] ??= { score: 0, time }).score += 2

      for (const { slug, time } of tags.flatMap(({ id }) => tagStatistics[id]))
        (result[slug] ??= { score: 0, time }).score += 1

      delete result[slug]
      const resultArr = Object.entries(result)
        .sort(
          (
            [_, { score: score1, time: time1 }],
            [__, { score: score2, time: time2 }],
          ) => (score1 !== score2 ? score2 - score1 : time2 - time1),
        )
        .map(([slug, { score }]) => ({
          slug,
          score,
          collection: 'blogs',
        })) as BlogStatistics[BlogSlug]

      return [slug, resultArr] as const
    }),
  ) as BlogStatistics

  return { blogStatistics, tagStatistics } as const
})

export async function getBlogStatistics(slug: BlogSlug) {
  const { blogStatistics } = await statistics()
  return blogStatistics[slug]
}

export async function getTagStatistics(): Promise<TagStatistics>
export async function getTagStatistics(id: TagId): Promise<TagStatistics[TagId]>
export async function getTagStatistics(id?: TagId) {
  const { tagStatistics } = await statistics()
  return id === undefined ? tagStatistics : tagStatistics[id]
}
