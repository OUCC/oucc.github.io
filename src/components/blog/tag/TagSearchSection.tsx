import { useState } from 'preact/hooks'
import TagListSection from './TagListSection'
import type { ClientTag } from '@/content/config'
import Section from '@/components/common/Section.preact'
import Icon from '@/components/common/Icon.preact'
import SearchIcon from '@/assets/icons/search.svg'

export type TagSearchObj = ClientTag & {
  articleCount: number
}

export default function TagSearchSection({ tags }: { tags: TagSearchObj[] }) {
  const [displayingTags, setDisplayingTags] = useState(tags)

  return (
    <div class="min-h-[80vh]">
      <Section background="secondary">
        <div class="relative w-full text-gray-400 focus-within:text-sky-400">
          <label
            for="search-input"
            class="absolute left-3 flex h-full items-center"
          >
            <Icon image={SearchIcon} alt="検索" class="w-5" />
          </label>
          <input
            id="search-input"
            class="h-12 w-full rounded-full border pl-10 text-black outline-none focus:border-sky-500 focus:ring focus:ring-sky-200"
            onInput={(e) => {
              if (e.currentTarget.value === '') setDisplayingTags(tags)
              else
                setDisplayingTags(
                  tags.filter((t) =>
                    t.name
                      .toLowerCase()
                      .includes(e.currentTarget.value.toLowerCase()),
                  ),
                )
            }}
          />
        </div>
      </Section>
      <TagListSection tags={displayingTags} />
    </div>
  )
}
