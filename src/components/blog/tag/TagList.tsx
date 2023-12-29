import TagListItemCard from './TagListItemCard'
import type { TagSearchObj } from './TagSearchSection'

interface Props {
  tags: TagSearchObj[]
}

export default function TagList({ tags }: Props) {
  return (
    <ul class="flex flex-col flex-wrap gap-3 sm:flex-row">
      {tags.map((tag) => (
        <TagListItemCard {...tag} />
      ))}
    </ul>
  )
}
