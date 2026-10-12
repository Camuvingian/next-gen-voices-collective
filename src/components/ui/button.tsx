import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/**
 * shadcn/ui Button, re-skinned for Noir Club. The look (glass gradient,
 * neon primary, centred caps label) lives in styles/noir.css on the
 * .ng-btn classes; colours all come from tokens.css.
 */
const buttonVariants = cva("ng-btn", {
  variants: {
    variant: {
      default: "ng-btn--primary",
      primary: "ng-btn--primary",
      outline: "ng-btn--outline",
      ghost: "ng-btn--ghost",
      link: "ng-btn--link",
    },
    size: {
      default: "",
      md: "",
      sm: "ng-btn--sm",
      lg: "ng-btn--lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
