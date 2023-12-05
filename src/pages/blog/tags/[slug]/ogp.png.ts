import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import sharp from 'sharp'
import defaultImageSvg from '@/assets/hashtag.svg?raw'
import { getTagIcon } from '@/components/blog/icon/getTagIcon'
import { unreachable } from '@/utils/unreachable'

export async function getStaticPaths() {
  const tags = await getCollection('tags')

  return tags.map((tag) => ({
    params: { slug: tag.id },
    props: { tag },
  }))
}

export async function GET({
  props: { tag },
}: APIContext<Awaited<ReturnType<typeof getStaticPaths>>[number]['props']>) {
  const icon = await getTagIcon(tag)
  if (icon.type !== 'local-svg' && icon.type !== 'default') {
    return new Response(undefined, { status: 404 })
  }

  const ogp = await sharp(
    Buffer.from(
      icon.type === 'local-svg'
        ? icon.svg
        : icon.type === 'default'
          ? defaultImageSvg
          : unreachable(icon),
    ),
  )
    .png()
    .toBuffer()
  return new Response(ogp)
}
