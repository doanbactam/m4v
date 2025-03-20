import type { ComponentProps } from "react";
import { GitHubRepositoryCard } from "~/components/web/github-repository-card";
import { RepositoryDetails } from "~/components/web/repository-details";
import { WebsiteDetails } from "~/components/web/website-details";
import type { ToolOne } from "~/server/web/tools/payloads";
import { cx } from "~/utils/cva";

type ToolDetailsProps = ComponentProps<"div"> & {
  tool: ToolOne;
  useGitHubCard?: boolean;
};

export const ToolDetails = ({ tool, className, useGitHubCard = false, ...props }: ToolDetailsProps) => {
  return (
    <div className={cx("", className)} {...props}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {useGitHubCard ? (
          <GitHubRepositoryCard tool={tool} />
        ) : (
          <RepositoryDetails tool={tool} />
        )}
        <WebsiteDetails tool={tool} />
      </div>
    </div>
  );
}; 