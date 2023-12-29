import {
  z,
  defineCollection,
  reference,
  type CollectionEntry,
} from 'astro:content'
import defaultTagImage from '@/assets/hashtag.svg'

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

export type ClientTag = ReturnType<typeof getClientTag>

/** クライアントで使用するタグオブジェクトを取得します */
export function getClientTag(tag: CollectionEntry<'tags'>) {
  return {
    id: tag.id,
    ...tag.data,
    image: tag.data.image?.src ?? defaultTagImage.src,
  }
}

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
