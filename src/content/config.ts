import { z, defineCollection, reference } from 'astro:content'

const blogsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    description: z
      .string()
      .min(10)
      .transform((desc) =>
        desc.length > 100 ? desc.slice(0, 100) + '…' : desc,
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
  schema: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    github: z.string().min(1).optional(),
    image: z
      .discriminatedUnion('type', [
        z.object({
          type: z.literal('svg'),
          name: z.string().min(1),
        }),
        z.object({
          type: z.literal('external-url'),
          url: z.string().url(),
        }),
      ])
      .default({ type: 'svg', name: 'default_user' }),
  }),
})

const tagsAboutSchema = z.object({
  url: z.string().url(),
  text: z.string().optional(),
})

const tagsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string().min(1),
    image: z
      .discriminatedUnion('type', [
        z.object({
          type: z.literal('svg'),
          name: z.string().min(1),
        }),
        z.object({
          type: z.literal('external-url'),
          url: z.string().url(),
        }),
      ])
      .default({ type: 'svg', name: 'hashtag' }),
    description: z.string().optional(),
    site: tagsAboutSchema.optional(),
    document: tagsAboutSchema.optional(),
    github: tagsAboutSchema.optional(),
  }),
})

export const collections = {
  blogs: blogsCollection,
  'blog-metas': blogsMetaCollection,
  authors: authorsCollection,
  tags: tagsCollection,
}