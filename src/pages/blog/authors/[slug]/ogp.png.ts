import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import sharp from 'sharp'
import defaultImageSvg from '@/assets/avatar.svg?raw'
import { getAuthorIcon } from '@/components/blog/icon/getAuthorIcon'
import { unreachable } from '@/utils/unreachable'

export async function getStaticPaths() {
  const authors = await getCollection('authors')

  return authors.map((author) => ({
    params: { slug: author.id },
    props: { author },
  }))
}

export async function GET({
  props: { author },
}: APIContext<Awaited<ReturnType<typeof getStaticPaths>>[number]['props']>) {
  const icon = await getAuthorIcon(author)
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
