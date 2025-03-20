import { slugify } from "@curiousleaf/utils";
import type { Prisma } from "@openalternative/db/client";
import { similarWebClient } from "~/services/similarweb";

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

  return {
    globalRank: website.globalRank,
    categoryRank: website.categoryRank,
    monthlyVisits: website.monthlyVisits,
    lastWebUpdate: website.lastWebUpdate,
  } as unknown as Prisma.ToolUpdateInput;
};
