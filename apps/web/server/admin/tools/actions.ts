"use server"

import { slugify } from "@curiousleaf/utils"
import { db } from "@m4v/db"
import { ToolStatus } from "@m4v/db/client"
import { revalidatePath, revalidateTag } from "next/cache"
import { after } from "next/server"
import { z } from "zod"
import { isProd } from "~/env"
import { generateContent } from "~/lib/generate-content"
import { removeS3Directories, uploadFavicon, uploadScreenshot } from "~/lib/media"
import { adminProcedure } from "~/lib/safe-actions"
import { toolSchema } from "~/server/admin/tools/schemas"
import { inngest } from "~/services/inngest"

export const createTool = adminProcedure
  .createServerAction()
  .input(toolSchema)
  .handler(async ({ input: { alternatives, categories, ...input } }) => {
    const tool = await db.tool.create({
      data: {
        ...input,
        slug: input.slug || slugify(input.name),
        alternatives: { connect: alternatives?.map(id => ({ id })) },
        categories: { connect: categories?.map(id => ({ id })) },
      },
    })

    // Send an event to the Inngest pipeline
    if (tool.publishedAt) {
      isProd && (await inngest.send({ name: "tool.scheduled", data: { slug: tool.slug } }))
    }

    return tool
  })

export const updateTool = adminProcedure
  .createServerAction()
  .input(toolSchema.extend({ id: z.string() }))
  .handler(async ({ input: { id, alternatives, categories, ...input } }) => {
    const tool = await db.tool.update({
      where: { id },
      data: {
        ...input,
        alternatives: { set: alternatives?.map(id => ({ id })) },
        categories: { set: categories?.map(id => ({ id })) },
      },
    })

    revalidateTag("tools")
    revalidateTag(`tool-${tool.slug}`)

    return tool
  })

export const deleteTools = adminProcedure
  .createServerAction()
  .input(z.object({ ids: z.array(z.string()) }))
  .handler(async ({ input: { ids } }) => {
    const tools = await db.tool.findMany({
      where: { id: { in: ids } },
      select: { slug: true },
    })

    await db.tool.deleteMany({
      where: { id: { in: ids } },
    })

    revalidatePath("/admin/tools")
    revalidateTag("tools")

    // Remove the tool images from S3 asynchronously
    after(async () => {
      await removeS3Directories(tools.map(tool => `tools/${tool.slug}`))
    })

    return true
  })

export const scheduleTool = adminProcedure
  .createServerAction()
  .input(z.object({ id: z.string(), publishedAt: z.coerce.date() }))
  .handler(async ({ input: { id, publishedAt } }) => {
    const tool = await db.tool.update({
      where: { id },
      data: { status: ToolStatus.Scheduled, publishedAt },
    })

    revalidateTag("schedule")
    revalidateTag(`tool-${tool.slug}`)

    // Send an event to the Inngest pipeline
    isProd && (await inngest.send({ name: "tool.scheduled", data: { slug: tool.slug } }))

    return true
  })

export const reuploadToolAssets = adminProcedure
  .createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input: { id } }) => {
    const tool = await db.tool.findUniqueOrThrow({ where: { id } })

    const [faviconUrl, screenshotUrl] = await Promise.all([
      uploadFavicon(tool.websiteUrl, `tools/${tool.slug}/favicon`),
      uploadScreenshot(tool.websiteUrl, `tools/${tool.slug}/screenshot`),
    ])

    await db.tool.update({
      where: { id: tool.id },
      data: { faviconUrl, screenshotUrl },
    })

    revalidateTag("tools")
    revalidateTag(`tool-${tool.slug}`)

    return true
  })

export const regenerateToolContent = adminProcedure
  .createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input: { id } }) => {
    const tool = await db.tool.findUniqueOrThrow({ where: { id } })
    const data = await generateContent(tool.websiteUrl)

    await db.tool.update({
      where: { id: tool.id },
      data,
    })

    revalidateTag("tools")
    revalidateTag(`tool-${tool.slug}`)

    return true
  })


export const fetchGitHubData = adminProcedure
  .createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input: { id } }) => {
    const tool = await db.tool.findUniqueOrThrow({ where: { id } })
    
    if (!tool.repositoryUrl) {
      throw new Error("Tool does not have a repository URL")
    }

    const { getToolRepositoryData } = await import('~/lib/repositories')
    
    const repoData = await getToolRepositoryData(tool.repositoryUrl).catch(error => {
      console.error(`Failed to fetch repository data for ${tool.name}:`, error)
      throw new Error("Failed to fetch GitHub data")
    })
    
    const updatedTool = await db.tool.update({
      where: { id: tool.id },
      data: repoData || {}
    })
    
    revalidateTag("tools")
    revalidateTag(`tool-${tool.slug}`)
    
    return updatedTool
  })

// Cập nhật schema cho website data
const websiteDataSchema = z.object({
  monthlyVisits: z.number().int().optional(),
  bounceRate: z.number().optional(),
  averageVisitDuration: z.number().optional(),
  pagesPerVisit: z.number().optional(),
  globalRank: z.number().optional(),
  categoryRank: z.number().optional(),
  category: z.string().optional(),
  avgVisitDuration: z.number().optional(),
  webScore: z.number().optional(),
  lastWebUpdate: z.string().optional(),
}).strict()

export const fetchSimilarWebData = adminProcedure
  .createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input: { id } }) => {
    const tool = await db.tool.findUniqueOrThrow({ where: { id } })
    
    if (!tool.websiteUrl) {
      throw new Error("Tool does not have a website URL")
    }

    // Validate URL format
    try {
      new URL(tool.websiteUrl)
    } catch {
      throw new Error(`Invalid website URL: ${tool.websiteUrl}`)
    }

    const { getToolWebsiteData } = await import('~/lib/repositories')
    
    try {
      const websiteData = await getToolWebsiteData(tool.websiteUrl)
      
      // Validate website data structure
      const validatedData = websiteDataSchema.parse(websiteData)
      
      // Convert bigint to number before updating database
      const dataToUpdate = {
        ...validatedData,
        monthlyVisits: validatedData.monthlyVisits ? Number(validatedData.monthlyVisits) : undefined,
        lastWebUpdate: validatedData.lastWebUpdate ? new Date(validatedData.lastWebUpdate) : undefined
      }
      
      const updatedTool = await db.tool.update({
        where: { id: tool.id },
        data: dataToUpdate
      })
      
      // Revalidate all related tags
      revalidateTag("tools")
      revalidateTag(`tool-${tool.slug}`)
      revalidateTag(`tool-stats-${tool.slug}`)
      revalidateTag(`tool-analytics-${tool.slug}`)
      
      return updatedTool
    } catch (error: unknown) {
      console.error(`Failed to fetch/process SimilarWeb data for ${tool.name}:`, {
        error,
        tool: {
          id: tool.id,
          name: tool.name,
          websiteUrl: tool.websiteUrl
        }
      })

      if (error instanceof z.ZodError) {
        throw new Error(`Invalid SimilarWeb data structure: ${error.message}`)
      }

      // Type guard cho error object
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('SimilarWeb API rate limit exceeded. Please try again later.')
        }

        if (error.message.includes('network')) {
          throw new Error('Network error while fetching SimilarWeb data. Please check your connection.')
        }

        throw new Error(`Failed to fetch SimilarWeb data: ${error.message}`)
      }

      throw new Error('Failed to fetch SimilarWeb data: Unknown error')
    }
  })

export const fetchToolData = adminProcedure
  .createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input: { id } }) => {
    const tool = await db.tool.findUniqueOrThrow({ where: { id } })
    
    try {
      // Gọi các actions riêng biệt và bắt lỗi riêng
      if (tool.repositoryUrl) {
        try {
          await fetchGitHubData({ id })
        } catch (error) {
          console.error('GitHub fetch failed:', error)
        }
      }

      if (tool.websiteUrl) {
        try {
          await fetchSimilarWebData({ id })
        } catch (error) {
          console.error('SimilarWeb fetch failed:', error)
        }
      }
      
      return tool
    } catch (error) {
      console.error('Failed to fetch tool data:', error)
      throw new Error('Failed to fetch tool data')
    }
  })
