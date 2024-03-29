import { z, defineCollection, reference } from 'astro:content'

export const BlogCategoryMapping = {
  tech: '技術',
  club: 'クラブ',
  other: '雑記',
} as const satisfies Record<string, string>
export type BlogCategory = keyof typeof BlogCategoryMapping
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
    category: z.enum(
      Object.keys(BlogCategoryMapping) as [BlogCategory, ...BlogCategory[]],
    ),
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

const tagsCollection = defineCollection({
  type: 'data',
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
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
