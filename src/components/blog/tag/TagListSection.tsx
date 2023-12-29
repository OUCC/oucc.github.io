import Section from '@/components/common/Section.preact'
import TagList from './TagList'
import type { TagSearchObj } from './TagSearchSection'

interface Props {
  title?: string
  tags: TagSearchObj[]
}

export default function TagListSection({ title, tags }: Props) {
  return (
    <Section title={title} background="secondary">
      <TagList tags={tags} />
    </Section>
  )
}
