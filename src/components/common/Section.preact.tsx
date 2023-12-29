import { unreachable } from '@/utils/unreachable'
import Heading1 from './Heading1.preact'
import type { ReactNode } from 'preact/compat'

export default function Section({
  background,
  title,
  children,
}: {
  background: 'white' | 'primary' | 'secondary'
  title?: string
  children: ReactNode
}) {
  return (
    <section
      class={`bg-dot flex justify-center py-8 ${
        background === 'white'
          ? 'bg-dot-white'
          : background === 'primary'
            ? 'bg-dot-primary'
            : background === 'secondary'
              ? 'bg-dot-secondary'
              : unreachable(background)
      }`}
    >
      <div class="flex w-full max-w-padded-container flex-col gap-5">
        {title && (
          <Heading1
            variant={background === 'primary' ? 'secondary' : 'primary'}
          >
            {title}
          </Heading1>
        )}
        <div class="px-8">{children}</div>
      </div>
    </section>
  )
}
