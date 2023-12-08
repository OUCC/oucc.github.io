import satori, { type Font } from 'satori'
import oucc from '@/assets/oucc.svg?raw'
import fs from 'node:fs/promises'
import sharp from 'sharp'
import { lazy } from '@/utils/lazy'

const fonts = lazy<Font[]>(() =>
  Promise.all(
    (
      [
        {
          weight: 400,
          path: './fonts/Noto_Sans_JP/static/NotoSansJP-Regular.ttf',
        },
        {
          weight: 600,
          path: './fonts/Noto_Sans_JP/static/NotoSansJP-SemiBold.ttf',
        },
        {
          weight: 700,
          path: './fonts/Noto_Sans_JP/static/NotoSansJP-Bold.ttf',
        },
      ] as const
    ).map(async ({ weight, path }) => ({
      name: 'NotoSansJP',
      weight,
      data: await fs.readFile(path),
    })),
  ),
)

const ouccLogo = lazy(async () =>
  (await sharp(Buffer.from(oucc)).png().toBuffer()).toString('base64'),
)

export async function createOgImage(title: string, author: string) {
  const svg = await satori(
    {
      type: 'body',
      props: {
        tw: 'bg-[#1a2872] h-full w-full flex flex-col p-10',
        children: [
          {
            type: 'div',
            props: {
              tw: 'bg-[#f1f2f7] rounded-t-3xl flex justify-center items-center grow',
              children: {
                type: 'div',
                props: {
                  children: title,
                  tw: 'text-6xl font-bold px-8',
                  // satori の tailwind のバージョンは v3.1.8 で line-clamp のサポートは v3.3 からのため
                  style:
                    'overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;',
                },
              },
            },
          },
          {
            type: 'div',
            props: {
              tw: 'bg-[#f1f2f7] rounded-b-3xl flex p-8 items-center',
              children: [
                {
                  type: 'div',
                  props: {
                    tw: 'grow text-3xl pl-4',
                    children: `@${author}`,
                  },
                },
                {
                  type: 'img',
                  props: {
                    src: `data:image/png;base64,${await ouccLogo()}`,
                    height: 80,
                  },
                },
                {
                  type: 'p',
                  props: {
                    children: 'BLOG',
                    tw: 'text-5xl font-semibold px-2',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: await fonts(),
    },
  )

  return await sharp(Buffer.from(svg)).png().toBuffer()
}
