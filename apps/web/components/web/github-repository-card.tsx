import { formatDate, formatNumber, isTruthy } from "@curiousleaf/utils"
import { formatDistanceToNowStrict } from "date-fns"
import {
  BookIcon,
  CodeIcon,
  GitBranchIcon,
  GitForkIcon,
  GitPullRequestIcon,
  GlobeIcon,
  HistoryIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"
import Image from "next/image"
import type { ComponentProps } from "react"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { BrandGitHubIcon } from "~/components/common/icons/brand-github"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { ExternalLink } from "~/components/web/external-link"
import type { ToolOne } from "~/server/web/tools/payloads"
import { cx } from "~/utils/cva"

type GitHubRepositoryCardProps = ComponentProps<"div"> & {
  tool: ToolOne
}

export const GitHubRepositoryCard = ({ className, tool, ...props }: GitHubRepositoryCardProps) => {
  // Lấy chủ sở hữu và tên repository từ URL
  const repoUrlMatch = tool.repositoryUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  const owner = repoUrlMatch?.[1] || "owner"
  const repoName = repoUrlMatch?.[2] || tool.name

  return (
    <Card
      hover={false}
      focus={false}
      className={cx("items-stretch border-[#d0d7de] bg-white dark:border-[#30363d] dark:bg-[#0d1117]", className)}
      {...props}
    >
      <CardHeader className="pb-0 border-b border-[#d0d7de] dark:border-[#30363d]">
        <Stack size="sm" className="w-full flex-wrap">
          <BrandGitHubIcon className="h-5 w-5 text-[#24292f] dark:text-[#c9d1d9]" />
          <Stack size="xs" direction="row" className="text-base font-semibold text-[#0969da] dark:text-[#58a6ff]">
            <Link href={`https://github.com/${owner}`} className="hover:underline">
              {owner}
            </Link>
            <span className="text-[#24292f] dark:text-[#c9d1d9]">/</span>
            <Link href={tool.repositoryUrl} className="hover:underline">
              {repoName}
            </Link>
          </Stack>

          <Badge variant="outline" className="ml-auto rounded-full bg-[#ddf4ff] text-[#0969da] hover:bg-[#ddf4ff] dark:bg-[#388bfd1a] dark:text-[#58a6ff]">
            Public
          </Badge>
        </Stack>

        {tool.description && (
          <CardDescription className="mt-2">{tool.description}</CardDescription>
        )}
      </CardHeader>

      <div className="p-5">
        <Stack direction="column" className="gap-4">
          <Stack direction="row" wrap={true} className="gap-3">
            {tool.topics.slice(0, 5).map((topic) => (
              <Badge 
                key={topic.slug} 
                variant="outline" 
                className="rounded-full bg-[#ddf4ff] text-[#0969da] hover:bg-[#ddf4ff] dark:bg-[#388bfd1a] dark:text-[#58a6ff]"
              >
                {topic.slug}
              </Badge>
            ))}
          </Stack>

          <Stack direction="row" wrap={true} className="gap-x-4 gap-y-2">

            <Stack size="xs" direction="row" className="items-center text-xs text-[#57606a] dark:text-[#8b949e]">
              <StarIcon className="h-4 w-4 fill-[#57606a] dark:fill-[#8b949e]" />
              <Tooltip tooltip={`${formatNumber(tool.stars)} stars`}>
                <span>{formatNumber(tool.stars, "standard")}</span>
              </Tooltip>
            </Stack>

            <Stack size="xs" direction="row" className="items-center text-xs text-[#57606a] dark:text-[#8b949e]">
              <GitForkIcon className="h-4 w-4" />
              <Tooltip tooltip={`${formatNumber(tool.forks)} forks`}>
                <span>{formatNumber(tool.forks, "standard")}</span>
              </Tooltip>
            </Stack>

            {tool.lastCommitDate && (
              <Stack size="xs" direction="row" className="items-center text-xs text-[#57606a] dark:text-[#8b949e]">
                <HistoryIcon className="h-4 w-4" />
                <Tooltip tooltip={`Last commit on ${formatDate(tool.lastCommitDate)}`}>
                  <span>Updated {formatDistanceToNowStrict(tool.lastCommitDate, { addSuffix: true })}</span>
                </Tooltip>
              </Stack>
            )}
          </Stack>
        </Stack>
      </div>

      <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-[#d0d7de] pt-4 dark:border-[#30363d]">
        <Button
          size="sm"
          variant="secondary"
          prefix={<StarIcon className="h-4 w-4" />}
          className="w-full bg-[#f6f8fa] text-[#24292f] hover:bg-[#f3f4f6] dark:bg-[#21262d] dark:text-[#c9d1d9] dark:hover:bg-[#30363d] dark:border-[#f0f6fc1a]"
        >
          Star
        </Button>

        <ExternalLink
          href={tool.repositoryUrl}
          eventName="click_repository"
          eventProps={{ url: tool.repositoryUrl }}
          className="w-full"
        >
          <Button
            size="sm"
            variant="secondary"
            prefix={<CodeIcon className="h-4 w-4" />}
            suffix={<GitBranchIcon className="h-4 w-4 ml-1" />}
            className="w-full bg-[#f6f8fa] text-[#24292f] hover:bg-[#f3f4f6] dark:bg-[#21262d] dark:text-[#c9d1d9] dark:hover:bg-[#30363d] dark:border-[#f0f6fc1a]"
          >
            Code
          </Button>
        </ExternalLink>
      </CardFooter>
    </Card>
  )
} 