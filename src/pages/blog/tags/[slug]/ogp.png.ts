import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import sharp from 'sharp'

export async function getStaticPaths() {
  const tags = await getCollection('tags')

  return tags
    .filter((tag) => tag.data.image.type === 'svg')
    .map((tag) => ({
      params: { slug: tag.id },
      props: { tag },
    }))
}

export async function GET({
  props: { tag },
}: APIContext<Awaited<ReturnType<typeof getStaticPaths>>[number]['props']>) {
  if (tag.data.image.type !== 'svg')
    return new Response(undefined, { status: 404 })
  const ogp = await sharp(
    Buffer.from(
      (
        await import(
          `../../../../assets/icons/blog/${tag.data.image.name}.svg?raw`
        )
      ).default,
    ),
  )
    .png()
    .toBuffer()
  return new Response(ogp)
}
