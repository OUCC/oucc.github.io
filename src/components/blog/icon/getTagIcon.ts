import type { ImageMetadata } from 'astro'
import type { CollectionEntry } from 'astro:content'

export type TagIcon =
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

export const getTagIcon = async (
  tag: CollectionEntry<'tags'>,
): Promise<TagIcon> => {
  try {
    return {
      type: 'local-svg',
      imageMetadata: (await import(`../../../content/tags/${tag.id}.svg`))
        .default,
      svg: (await import(`../../../content/tags/${tag.id}.svg?raw`)).default,
    }
  } catch {
    try {
      return {
        type: 'local-png',
        imageMetadata: (await import(`../../../content/tags/${tag.id}.png`))
          .default,
        url: (await import(`../../../content/tags/${tag.id}.png?url`)).default,
      }
    } catch {
      return { type: 'default' }
    }
  }
}
