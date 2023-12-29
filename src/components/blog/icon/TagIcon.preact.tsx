import type { ClientTag } from '@/content/config'

interface Props {
  tag: Pick<ClientTag, 'name' | 'image' | 'fullSizeImage'>

  size: number
  fullSizeImage?: boolean
}

export default function TagIcon({ tag, size }: Props) {
  return (
    <img
      src={tag.image}
      alt={`${tag.name} のアイコン`}
      class={`aspect-square ${tag.fullSizeImage ? 'rounded-full' : ''}`}
      width={size}
      height={size}
    />
  )
}
