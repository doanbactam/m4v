import { formatDate } from "@curiousleaf/utils"
import { differenceInDays } from "date-fns"
import type { ComponentProps } from "react"
import { Stack } from "~/components/common/stack"
import { cx } from "~/utils/cva"
import type { ToolMany, ToolManyExtended, ToolOne } from "~/server/web/tools/payloads"

type BadgeVariant = 
  | "default" 
  | "red" 
  | "yellow" 
  | "green" 
  | "blue" 
  | "indigo" 
  | "purple" 
  | "pink"

type BadgeProps = {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const Badge = ({ variant = "default", children, className }: BadgeProps) => {
  const baseStyles = "px-2 py-0.5 text-xs font-medium rounded-full"
  
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-gray-100 text-gray-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800", 
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    indigo: "bg-indigo-100 text-indigo-800",
    purple: "bg-purple-100 text-purple-800",
    pink: "bg-pink-100 text-pink-800"
  }

  return (
    <span className={cx(baseStyles, variantStyles[variant], className)}>
      {children}
    </span>
  )
}

type ToolBadgesProps = ComponentProps<typeof Stack> & {
  tool: ToolOne | ToolMany | ToolManyExtended
}

export const ToolBadges = ({ tool, children, className, ...props }: ToolBadgesProps) => {
  const { firstCommitDate, publishedAt, discountCode, discountAmount } = tool

  const commitDiff = firstCommitDate ? differenceInDays(new Date(), firstCommitDate) : null
  const publishedDiff = publishedAt ? differenceInDays(new Date(), publishedAt) : null

  const isNew = commitDiff !== null && commitDiff <= 365
  const isFresh = publishedDiff !== null && publishedDiff <= 30 && publishedDiff >= 0
  const isScheduled = publishedAt !== null && publishedAt > new Date()

  return (
    <Stack
      size="sm"
      wrap={false}
      className={cx("gap-2 empty:hidden", className)}
      {...props}
    >
      {isNew && (
        <Badge variant="yellow">New</Badge>
      )}

      {isFresh && (
        <Badge variant="green">Fresh</Badge>
      )}

      {isScheduled && (
        <Badge variant="blue">
          {formatDate(publishedAt)}
        </Badge>
      )}

      {discountAmount && (
        <Badge variant="red">
          {discountCode ? `${discountCode} - ${discountAmount}` : discountAmount}
        </Badge>
      )}

      {children}
    </Stack>
  )
}
