import type { ImageMetadata } from 'astro'
import type { CollectionEntry } from 'astro:content'

export type AuthorIcon =
  | {
      type: 'local-svg'
      imageMetadata: ImageMetadata
      svg: string
    }
  | {
      type: 'local-png'
      imageMetadata: ImageMetadata
      url: string
    }
  | {
      type: 'external-url'
      url: string
    }
  | {
      type: 'default'
    }

export const getAuthorIcon = async (
  author: CollectionEntry<'authors'>,
): Promise<AuthorIcon> => {
  try {
    return {
      type: 'local-svg',
      imageMetadata: (await import(`../../../content/authors/${author.id}.svg`))
        .default,
      svg: (await import(`../../../content/authors/${author.id}.svg?raw`))
        .default,
    }
  } catch {
    try {
      return {
        type: 'local-png',
        imageMetadata: (
          await import(`../../../content/authors/${author.id}.png`)
        ).default,
        url: (await import(`../../../content/authors/${author.id}.png?url`))
          .default,
      }
    } catch {
      if (author.data.github !== undefined) {
        return {
          type: 'external-url',
          url: `https://github.com/${author.data.github}.png`,
        }
      } else {
        return { type: 'default' }
      }
    }
  }
}
