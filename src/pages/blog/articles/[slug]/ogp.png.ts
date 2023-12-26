import {
  createOgImage,
  getOgpFileName,
} from '@/pages/blog/articles/[slug]/_OgImageGenerator'
import fs from 'fs/promises'
import { getImageWithSvgConvert } from '@/utils/getImageWithSvgConvert'
import { lazy } from '@/utils/lazy'
import type { APIContext } from 'astro'
import { getCollection, getEntry, type CollectionEntry } from 'astro:content'

const ogpCacheHits = lazy(async () => {
  const blogs = await Promise.all(
    (await getCollection('blogs')).map(async (blog) => ({
      ...blog,
      data: {
        ...blog.data,
        author: await getEntry(blog.data.author),
      },
    })),
  )
  const targetFileNames = blogs.map(
    (blog) =>
      ({
        file: `${getOgpFileName(
          blog.slug,
          blog.data.title,
          blog.data.author.data.name,
        )}.png`,
        slug: blog.slug,
        title: blog.data.title,
        author: blog.data.author.data.name,
      }) as const,
  )

  const existingFileNames = await fs
    .readdir('dist/cache/article-ogps')
    .catch(async () => {
      await fs.mkdir('dist/cache/article-ogps')
      return [] as string[]
    })

  const clearTarget = existingFileNames.filter((fileName) =>
    targetFileNames.every(({ file }) => file !== fileName),
  )

  const hitList = Object.fromEntries(
    targetFileNames.map(
      ({ slug, file }) => [slug, existingFileNames.includes(file)] as const,
    ),
  ) as Record<CollectionEntry<'blogs'>['slug'], boolean>
  const addTarget = targetFileNames.filter(({ slug }) => !hitList[slug])

  await Promise.all(
    clearTarget
      .map((file) => fs.rm(`dist/cache/article-ogps/${file}`))
      .concat(
        addTarget.map(async ({ file, title, author }): Promise<void> => {
          const ogp = await createOgImage(title, author)
          await fs.writeFile(`dist/cache/article-ogps/${file}`, ogp)
        }),
      ),
  )

  return hitList
})

export async function getStaticPaths() {
  const posts = await getCollection('blogs')
  const hits = await ogpCacheHits()

  return posts
    .filter((blog) => !hits[blog.slug])
    .map((blog) => ({
      params: { slug: blog.slug },
      props: { blog },
    }))
}

export async function getOgpPath(blog: CollectionEntry<'blogs'>) {
  const exists = (await ogpCacheHits())[blog.slug]

  if (exists) {
    const author = await getEntry(blog.data.author)
    const ogpFilename = getOgpFileName(
      blog.slug,
      blog.data.title,
      author.data.name,
    )

    return (
      await getImageWithSvgConvert({
        src: (
          await import(
            `../../../../../dist/cache/article-ogps/${ogpFilename}.png`
          )
        ).default,
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
