import { z, defineCollection, reference } from 'astro:content'
import { glob } from 'astro/loaders'
import path from 'node:path'

export const BlogCategoryMapping = {
  tech: '技術',
  club: 'クラブ',
  other: '雑記',
} as const satisfies Record<string, string>
export type BlogCategory = keyof typeof BlogCategoryMapping
const blogsCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/content/blogs' }),
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
  loader: glob({ pattern: '*.json', base: 'src/content/blog-metas' }),
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
  loader: glob({
    pattern: '*.json',
    base: 'src/content/authors',
    generateId: (o) => path.basename(o.entry).replace('.json', ''),
  }),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      github: z.string().min(1).optional(),
      image: image().optional(),
    }),
})

const tagsCollection = defineCollection({
  loader: glob({
    pattern: '*.json',
    base: 'src/content/tags',
    generateId: (o) => path.basename(o.entry).replace('.json', ''),
  }),
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
