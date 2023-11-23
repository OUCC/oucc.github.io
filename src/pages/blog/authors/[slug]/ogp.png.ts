import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import sharp from 'sharp'

export async function getStaticPaths() {
  const authors = await getCollection('authors')

  return authors
    .filter((author) => author.data.image?.type === 'svg')
    .map((author) => ({
      params: { slug: author.id },
      props: { author },
    }))
}

export async function GET({
  props: { author },
}: APIContext<Awaited<ReturnType<typeof getStaticPaths>>[number]['props']>) {
  if (author.data.image?.type !== 'svg')
    return new Response(undefined, { status: 404 })
  const ogp = await sharp(
    Buffer.from(
      (
        await import(
          `../../../../assets/icons/blog/${author.data.image.name}.svg?raw`
        )
      ).default,
    ),
  )
    .png()
    .toBuffer()
  return new Response(ogp)
}
