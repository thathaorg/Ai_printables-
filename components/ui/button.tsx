import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--kiwi)] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          'btn-chunky btn-primary-chunky',
        destructive:
          'btn-chunky bg-[var(--coral)] text-white',
        outline:
          'btn-chunky btn-soft-chunky',
        secondary:
          'btn-chunky btn-secondary-chunky',
        ghost:
          'rounded-full hover:bg-[var(--muted)] text-[var(--ink)]',
        link: 'text-[var(--kiwi)] underline-offset-4 hover:underline font-display',
        soft:
          'btn-chunky bg-[var(--sun)] text-[var(--ink)]',
        sky:
          'btn-chunky bg-[var(--sky)] text-white',
      },
      size: {
        default: 'h-11 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-9 rounded-full gap-1.5 px-3.5 has-[>svg]:px-3 text-xs',
        lg: 'h-13 min-h-13 px-7 py-3.5 has-[>svg]:px-5 text-base',
        xl: 'h-14 px-8 py-4 text-lg',
        icon: 'size-11 rounded-full border-2 border-[color-mix(in_oklab,var(--ink)_12%,transparent)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
