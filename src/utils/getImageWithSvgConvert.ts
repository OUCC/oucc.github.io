import type { ImageTransform } from 'astro'
import { getImage } from 'astro:assets'

/**
 * `astro:assets`の`getImage`を拡張し、SVGからラスター画像への変換を可能にしたもの。
 *
 * `getImage`は入力にSVGを与えたとき、オプションでの出力フォーマット指定を無視し必ずSVGを返してしまう。
 * これではOGP画像生成の際にSVGからPNGへの変換ができず困るので、この関数では出力フォーマットを無視しないよう修正した。
 */
export const getImageWithSvgConvert = async (
  options: Omit<ImageTransform, 'src'> & {
    src: ImageMetadata | Promise<{ default: ImageMetadata }>
  },
) => {
  // `src`がPromiseである場合、そのPromiseが解決されるまで待機する。
  const src =
    typeof options.src === 'object' && 'then' in options.src
      ? (await options.src).default ?? (await options.src)
      : options.src

  // 入力画像がSVGかつ出力フォーマット指定がSVG以外のとき
  if (src.format === 'svg' && options.format !== 'svg') {
    // 入力画像がPNGであるかのようにAstroを騙し、ラスター画像への変換を可能にする。
    // 具体的には次のチェックを回避している：https://github.com/withastro/astro/blob/895ebcb5bfeb2fe08ae939eaceeb0405cff91ca5/packages/astro/src/assets/services/service.ts#L199-L202
    return await getImage({ ...options, src: { ...src, format: 'png' } })
  } else {
    return await getImage(options)
  }
}
