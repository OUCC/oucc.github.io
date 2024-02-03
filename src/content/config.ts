import { z, defineCollection, reference } from 'astro:content'

const blogsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    description: z
      .string()
      .min(10)
      .transform((desc) => {
        desc = desc.replaceAll('\r\n', ' ').replaceAll('\n', ' ')
        return desc.length > 100 ? desc.slice(0, 100) + '…' : desc
      }),
    author: reference('authors'),
    tags: z.array(reference('tags')),
  }),
})

const blogsMetaCollection = defineCollection({
  type: 'data',
  schema: z.object({
    postDate: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value)),
    updateDate: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .optional(),
  }),
})

const authorsCollection = defineCollection({
  type: 'data',
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      github: z.string().min(1).optional(),
      image: image().optional(),
    }),
})

export const TagCategoryMapping = [
  ['tech', '技術'],
  ['circle', 'サークル'],
  ['other', '雑記'],
] as const satisfies [string, string][]
export type TagCategory = (typeof TagCategoryMapping)[number][0]

const tagsCollection = defineCollection({
  type: 'data',
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.enum(
        TagCategoryMapping.map(([category]) => category) as [
          TagCategory,
          ...TagCategory[],
        ],
      ),
      links: z
        .array(
          z.object({
            url: z.string().url(),
            text: z.string().min(1),
          }),
        )
        .default([]),
      image: image().optional(),
      fullSizeImage: z.boolean().optional(),
    }),
})

export const collections = {
  blogs: blogsCollection,
  'blog-metas': blogsMetaCollection,
  authors: authorsCollection,
  tags: tagsCollection,
}
