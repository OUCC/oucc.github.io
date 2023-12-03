import satori from 'satori'
import oucc from '@/assets/icons/oucc.svg?raw'
import fs from 'node:fs/promises'
import sharp from 'sharp'

let fontCache:
  | {
      weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
      data: Buffer
    }[]
  | null = null
let ouccIconCache: string | null

export async function createOgImage(title: string, author: string) {
  fontCache ??= await Promise.all(
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
      weight,
      data: await fs.readFile(path),
    })),
  )

  ouccIconCache ??= (await sharp(Buffer.from(oucc)).png().toBuffer()).toString(
    'base64',
  )

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
                    src: `data:image/png;base64,${ouccIconCache}`,
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
      fonts: fontCache.map((font) => ({ ...font, name: 'NotoSansJP' })),
    },
  )

  return await sharp(Buffer.from(svg)).png().toBuffer()
}
