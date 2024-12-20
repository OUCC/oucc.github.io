import { createOgImage } from '@/pages/blog/articles/[slug]/_OgImageGenerator'
import type { APIContext } from 'astro'
import { getCollection, getEntry } from 'astro:content'

export async function getStaticPaths() {
  const posts = await getCollection('blogs')

  return posts.map((blog) => ({
    params: { slug: blog.id },
    props: { blog },
  }))
}

export async function GET({
  props: { blog },
}: APIContext<Awaited<ReturnType<typeof getStaticPaths>>[number]['props']>) {
  const author = await getEntry(blog.data.author)
  const ogp = await createOgImage(blog.data.title, author.data.name)
  return new Response(ogp)
}
