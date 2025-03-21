import { slugify } from "@curiousleaf/utils"
import type { Prisma } from "@m4v/db/client"
import { similarWebClient } from "~/services/similarweb"
import { githubClient } from "~/services/github"

/**
 * Fetches the repository data for a tool and returns the data
 * in a format that can be used to update the tool.
 *
 * @param repository - The repository to fetch the data for.
 * @returns The repository data for the tool.
 */
export const getToolRepositoryData = async (repository: string) => {
  const repo = await githubClient.queryRepository(repository)
  const selfHostedTopics = ["selfhosted", "self-hosted"]

  if (!repo) return null

  return {
    stars: repo.stars,
    forks: repo.forks,
    score: repo.score,
    firstCommitDate: repo.createdAt,
    lastCommitDate: repo.pushedAt,
    isSelfHosted: repo.topics.some(topic => selfHostedTopics.includes(topic)) ? true : undefined,
    // Topics
    topics: {
      connectOrCreate: repo.topics.map(slug => ({
        where: { slug: slugify(slug) },
        create: { slug: slugify(slug) },
      })),
    },
  } satisfies Prisma.ToolUpdateInput
}

/**
 * Fetches the website data for a tool and returns the data
 * in a format that can be used to update the tool.
 *
 * @param websiteUrl - The website URL to fetch the data for.
 * @returns The website data for the tool.
 */
export const getToolWebsiteData = async (websiteUrl: string) => {
  const website = await similarWebClient.queryWebsite(websiteUrl);

  if (!website) return null;

  // Sử dụng kiểu Record để bỏ qua việc kiểm tra kiểu dữ liệu cho các trường mới
  return {
    globalRank: website.globalRank,
    categoryRank: website.categoryRank,
    monthlyVisits: website.monthlyVisits,

  } as unknown as Prisma.ToolUpdateInput;
}
