import { formatNumber } from "@curiousleaf/utils"
import { ArrowUpRightIcon, GlobeIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import { Card } from "~/components/common/card"
import { H5 } from "~/components/common/heading"
import { Stack } from "~/components/common/stack"
import { ExternalLink } from "~/components/web/external-link"
import type { ToolOne } from "~/server/web/tools/payloads"
import { cx } from "~/utils/cva"

type WebsiteDetailsProps = ComponentProps<"div"> & {
  tool: ToolOne
}

export const WebsiteDetails = ({ className, tool, ...props }: WebsiteDetailsProps) => {
  return (
    <Card
      hover={false}
      focus={false}
      className={cx("items-stretch bg-transparent", className)}
      {...props}
    >
      <Stack direction="column" className="gap-4">
        <H5 as="strong">Thông tin website:</H5>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <GlobeIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Monthly visits</span>
            <span className="font-medium">{formatNumber(Number(tool.monthlyVisits), "standard")}</span>
          </div>

          {tool.globalRank && (
            <div className="flex items-center gap-2">
              <GlobeIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Global rank</span>
              <span className="font-medium">#{formatNumber(tool.globalRank, "standard")}</span>
            </div>
          )}
        </div>

        {tool.websiteUrl && (
          <Button
            size="md"
            variant="secondary"
            prefix={<GlobeIcon />}
            suffix={<ArrowUpRightIcon className="h-4 w-4" />}
            className="mt-1 self-start"
            asChild
          >
            <ExternalLink
              href={tool.websiteUrl}
              eventName="click_website"
              eventProps={{ url: tool.websiteUrl }}
            >
              Visit Website
            </ExternalLink>
          </Button>
        )}

        <p className="text-muted-foreground/75 text-[11px]">
          Auto-fetched from SimilarWeb
          {tool.lastWebUpdate && (
            <> <time dateTime={tool.lastWebUpdate.toISOString()} className="font-medium text-muted-foreground">
              {new Date(tool.lastWebUpdate).toISOString().split('T')[0]}
            </time></>
          )}.
        </p>
      </Stack>
    </Card>
  )
}