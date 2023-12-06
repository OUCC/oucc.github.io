import { unreachable } from '@/utils/unreachable'
import { type CollectionEntry, getCollection, getEntry } from 'astro:content'

type TagId = CollectionEntry<'tags'>['id']
type BlogSlug = CollectionEntry<'blogs'>['slug']
export type TagStatistics = Readonly<
  Record<
    TagId,
    readonly Readonly<{ slug: BlogSlug; time: number; timeScore: number }>[]
  >
>
export type BlogStatistics = Readonly<
  Record<
    BlogSlug,
    readonly Readonly<{ collection: 'blogs'; slug: BlogSlug; score: number }>[]
  >
>

let tagStatistics: TagStatistics | null = null
let blogStatistics: BlogStatistics | null = null

function calcTimeScore(milliseconds: number): number {
  const diff = Date.now() - milliseconds

  if (diff <= 365 * 24 * 3600_000) return 3
  else if (diff <= 2 * 365 * 24 * 3600_000) return 2
  else return 1
}

async function analyze() {
  if (blogStatistics === null || tagStatistics === null) {
    const blogs = await getCollection('blogs')

    const blogMetas = await Promise.all(
      blogs.map((b) => getEntry({ collection: 'blog-metas', id: b.slug })),
    )

    const blogWithMeta = blogs
      .map((b, i) => ({
        slug: b.slug,
        tags: b.data.tags,
        time:
          blogMetas[i]?.data.updateDate?.getTime() ??
          blogMetas[i]?.data.postDate.getTime() ??
          Date.now(),
        timeScore: calcTimeScore(
          blogMetas[i]?.data.updateDate?.getTime() ??
            blogMetas[i]?.data.postDate.getTime() ??
            Date.now(),
        ),
      }))
      .sort((blog1, blog2) => blog2.time - blog1.time)
    const tags = await getCollection('tags')
    tagStatistics = Object.fromEntries(
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

    blogStatistics = Object.fromEntries(
      blogs.map((blog) => {
        const result: { [K in BlogSlug]?: { score: number; time: number } } = {}
        blog.data.tags
          .flatMap((t) => tagStatistics![t.id])
          .forEach(({ slug, timeScore, time }) => {
            if (slug !== blog.slug) {
              result[slug] ??= { score: 0, time }
              result[slug]!.score += timeScore
            }
          })
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

        return [blog.slug, resultArr] as const
      }),
    ) as BlogStatistics
  }
}

export async function getBlogStatistics(slug: BlogSlug) {
  await analyze()
  if (tagStatistics === null || blogStatistics === null) return unreachable()

  return blogStatistics[slug]
}

export async function getTagStatistics(): Promise<TagStatistics>
export async function getTagStatistics(id: TagId): Promise<TagStatistics[TagId]>
export async function getTagStatistics(id?: TagId) {
  await analyze()
  if (tagStatistics === null || blogStatistics === null) return unreachable()

  return id === undefined ? tagStatistics : tagStatistics[id]
}
