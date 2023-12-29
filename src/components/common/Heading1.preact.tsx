import { unreachable } from '@/utils/unreachable'
import type { ReactNode } from 'preact/compat'

export default function Heading1({
  children,
  variant = 'primary',
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary'
}) {
  return (
    <h2
      class={`w-full border-x-[2rem] p-2.5 text-3xl font-bold ${
        variant === 'primary'
          ? 'border-primary text-black'
          : variant === 'secondary'
            ? 'border-secondary text-secondary'
            : unreachable(variant)
      }`}
    >
      {children}
    </h2>
  )
}
