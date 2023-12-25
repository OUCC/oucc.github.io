import {
  cleanUpCache,
  createOgImage,
  existsOgp,
  getOgpFileName,
} from '@/pages/blog/articles/[slug]/_OgImageGenerator'
import { getImageWithSvgConvert } from '@/utils/getImageWithSvgConvert'
import { lazy } from '@/utils/lazy'
import type { APIContext } from 'astro'
import { getCollection, getEntry, type CollectionEntry } from 'astro:content'

const ogpHits = lazy(async () => {
  const blogs = await Promise.all(
    (await getCollection('blogs')).map(async (blog) => ({
      ...blog,
      data: {
        ...blog.data,
        author: await getEntry(blog.data.author),
      },
    })),
  )

  await cleanUpCache(
    blogs.map(
      (blog) =>
        `${getOgpFileName(
          blog.slug,
          blog.data.title,
          blog.data.author.data.name,
        )}.png`,
    ),
  )

  return Object.fromEntries(
    await Promise.all(
      blogs.map(async (blog) => {
        return [
          blog.slug,
          await existsOgp(
            blog.slug,
            blog.data.title,
            blog.data.author.data.name,
          ),
        ] as const
      }),
    ),
  ) as Record<CollectionEntry<'blogs'>['slug'], boolean>
})

export async function getStaticPaths() {
  const posts = await getCollection('blogs')
  const hits = await ogpHits()

  return posts
    .filter((blog) => !hits[blog.slug])
    .map((blog) => ({
      params: { slug: blog.slug },
      props: { blog },
    }))
}

export async function getOgpPath(blog: CollectionEntry<'blogs'>) {
  const exists = (await ogpHits())[blog.slug]

  if (exists) {
    const author = await getEntry(blog.data.author)
    const ogpFilename = getOgpFileName(
      blog.slug,
      blog.data.title,
      author.data.name,
    )

    return (
      await getImageWithSvgConvert({
        src: (await import(`../../../../content/ogp-cache/${ogpFilename}.png`))
          .default,
        format: 'png',
      })
    ).src
  } else {
    return `/blog/articles/${blog.slug}/ogp.png`
  }
}

export async function GET({
  props: { blog },
}: APIContext<Awaited<ReturnType<typeof getStaticPaths>>[number]['props']>) {
  const author = await getEntry(blog.data.author)
  const ogp = await createOgImage(blog.data.title, author.data.name)
  return new Response(ogp)
}
