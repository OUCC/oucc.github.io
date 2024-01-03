/**
 * /assets/icons にあるアイコンを単色で表示する。
 *
 * 色には現在の文字色（`currentColor`）が使われる。これはCSSの`color`で変更できる。
 *
 * CSSで幅または高さを指定しないと、大きさが0pxとなり表示されない。
 * また、この要素は`<img>`と同様にデフォルトで`display: inline-block`となっている。要素の下に意図せず余白が生じる場合は`vertical-align: top`で調整できる。cf. https://stackoverflow.com/q/27536428
 */

import type { HTMLAttributes } from 'preact/compat'

type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'name' | 'alt' | 'style'> & {
  image: ImageMetadata

  // 代替テキスト（`<img>`の`alt`属性と同じ）
  alt: string

  style?: string
}

export default function Icon({
  image,
  alt,
  class: className,
  ...attrs
}: Props) {
  return (
    <span
      aria-role="img"
      aria-label={alt}
      class={`inline-block bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] ${
        className ?? ''
      }`}
      style={`-webkit-mask-image:url(${JSON.stringify(
        image.src,
      )});mask-image:url(${JSON.stringify(image.src)});aspect-ratio:${
        image.width
      }/${image.height};${attrs.style ?? ''}`}
      {...attrs}
    ></span>
  )
}
