import { lazy } from '@/utils/lazy'
import { getCollection, getEntry } from 'astro:content'
import type { BlogCategory } from '@/content.config'

type TagId = string
type BlogId = string
export type TagStatistics = Readonly<
  Record<TagId, readonly Readonly<{ id: BlogId; time: number }>[]>
>
export type BlogStatistics = Readonly<
  Record<
    BlogId,
    readonly Readonly<{ collection: 'blogs'; id: BlogId; score: number }>[]
  >
>

const statistics = lazy(async () => {
  const blogs = await getCollection('blogs')
  const blogMetas = await Promise.all(
    blogs.map((b) => getEntry({ collection: 'blog-metas', id: b.id })),
  )
  const tags = await getCollection('tags')

  const blogWithMeta = blogs
    .map((b, i) => ({
      id: b.id,
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
    blogWithMeta.map(({ id, category, tags }) => {
      const result: { [K in BlogId]: { score: number; time: number } } = {}

      for (const { id, time } of categoryStatistics[category])
        (result[id] ??= { score: 0, time }).score += 2

      for (const { id: slug, time } of tags.flatMap(
        ({ id }) => tagStatistics[id]!,
      ))
        (result[slug] ??= { score: 0, time }).score += 1

      delete result[id]
      const resultArr = Object.entries(result)
        .sort(
          (
            [_, { score: score1, time: time1 }],
            [__, { score: score2, time: time2 }],
          ) => (score1 !== score2 ? score2 - score1 : time2 - time1),
        )
        .map(([id, { score }]) => ({
          id,
          score,
          collection: 'blogs',
        })) as BlogStatistics[BlogId]

      return [id, resultArr] as const
    }),
  ) as BlogStatistics

  return { blogStatistics, tagStatistics } as const
})

export async function getBlogStatistics(slug: BlogId) {
  const { blogStatistics } = await statistics()
  return blogStatistics[slug]!
}

export async function getTagStatistics(): Promise<TagStatistics>
export async function getTagStatistics(id: TagId): Promise<TagStatistics[TagId]>
export async function getTagStatistics(id?: TagId) {
  const { tagStatistics } = await statistics()
  return id === undefined ? tagStatistics : tagStatistics[id]!
}
