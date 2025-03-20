import { createAnthropic } from "@ai-sdk/anthropic"
import { isTruthy } from "@curiousleaf/utils"
import { db } from "@m4v/db"
import { generateObject } from "ai"
import { z } from "zod"
import { env } from "~/env"
import { getErrorMessage } from "~/lib/handle-error"
import { firecrawlClient } from "~/services/firecrawl"
import { tryCatch } from "~/utils/helpers"

/**
 * The system prompt for the content generator.
 */
const systemPrompt = `
  Bạn là một chuyên gia người Việt Nam sáng tạo nội dung chuyên về các công cụ AI mới nhất. 
  Nhiệm vụ của bạn là tạo ra nội dung chất lượng cao, hấp dẫn để hiển thị trên một trang web thư mục. 
  Bạn không sử dụng bất kỳ cụm từ sáo rỗng nào như "Trao quyền", "Tinh gọn", v.v.
`

/**
 * The schema for the content generator.
 */
const contentSchema = z.object({
  tagline: z
    .string()
    .describe(
      "Tạo một câu tagline (tối đa 60 ký tự) bao quát lợi ích cốt lõi và các tính năng độc đáo của công cụ mà không sử dụng tên của nó. Tập trung vào sự ngắn gọn và ấn tượng để đảm bảo phù hợp với đối tượng mục tiêu.",
    ),
  description: z
    .string()
    .describe(
      "Mô tả ngắn gọn sản phẩm Yêu cầu: Tối đa 160 ký tự Nổi bật các tính năng chính Nêu rõ lợi ích cho người dùng Không bao gồm tên của công cụ",
    ),
  content: z
    .string()
    .describe(
      "Mô tả chi tiết và hấp dẫn về sản phẩm hoặc dịch vụ, tối đa 1000 ký tự. Đoạn văn đầu tiên nên giới thiệu tổng quan về sản phẩm hoặc dịch vụ, nêu bật các điểm mạnh và các lợi ích chính mà khách hàng có thể nhận được. Các lợi ích nên được làm nổi bật bằng chữ in đậm. Sử dụng cú pháp Markdown chính xác cho danh sách các tính năng hoặc lợi ích cụ thể, đảm bảo tính rõ ràng và dễ hiểu cho người đọc. Hãy chắc chắn rằng nội dung mạch lạc và logic, hướng đến việc khuyến khích khách hàng tìm hiểu thêm hoặc thực hiện hành động.",
    ),
})

/**
 * Scrapes a website and returns the scraped data.
 * @param url The URL of the website to scrape.
 * @returns The scraped data.
 */
const scrapeWebsiteData = async (url: string) => {
  const data = await firecrawlClient.scrapeUrl(url, { formats: ["markdown"] })

  if (!data.success) {
    throw new Error(data.error)
  }

  return data
}

/**
 * Generates content for a tool.
 * @param url The URL of the website to scrape.
 * @returns The generated content.
 */
export const generateContent = async (url: string) => {
  const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const model = anthropic("claude-3-5-sonnet-latest")
  const scrapedData = await scrapeWebsiteData(url)

  const { data, error } = await tryCatch(
    generateObject({
      model,
      schema: contentSchema,
      system: systemPrompt,
      temperature: 0.3,
      prompt: `
        Provide me details for the following data:
        Title: ${scrapedData.metadata?.title}
        Description: ${scrapedData.metadata?.description}
        Content: ${scrapedData.markdown}
      `,
    }),
  )

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return data.object
}

/**
 * Generates content for a tool with relations.
 * @param url The URL of the website to scrape.
 * @returns The generated content.
 */
export const generateContentWithRelations = async (url: string) => {
  const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const model = anthropic("claude-3-5-sonnet-latest")
  const scrapedData = await scrapeWebsiteData(url)

  const [categories, alternatives] = await Promise.all([
    db.category.findMany(),
    db.alternative.findMany(),
  ])

  const schema = contentSchema.extend({
    categories: z
      .array(z.string())
      .transform(a => a.map(name => categories.find(cat => cat.name === name)).filter(isTruthy))
      .describe(`
       Gán sản phẩm phần mềm AI vào các danh mục mà nó thuộc về.

Cố gắng gán công cụ vào nhiều danh mục, nhưng không quá 3.

Nếu một công cụ không thuộc bất kỳ danh mục nào, trả về một mảng rỗng.
      `),
    alternatives: z
      .array(z.string())
      .transform(a => a.map(name => alternatives.find(alt => alt.name === name)).filter(isTruthy))
      .describe(`
Gán sản phẩm phần mềm AI vào các sản phẩm phần mềm độc quyền mà nó tương tự.

Cố gắng gán công cụ vào nhiều lựa chọn thay thế.

Nếu một công cụ không có lựa chọn thay thế, trả về một mảng rỗng.
      `),
  })

  const { data, error } = await tryCatch(
    generateObject({
      model,
      schema,
      system: systemPrompt,
      temperature: 0.3,
      prompt: `
        Provide me details for the following data:
        Title: ${scrapedData.metadata?.title}
        Description: ${scrapedData.metadata?.description}
        Content: ${scrapedData.markdown}
        
        Here is the list of categories to assign to the tool:
        ${categories.map(({ name }) => name).join("\n")}

        Here is the list of proprietary software alternatives to assign to the tool:
        ${alternatives.map(({ name, description }) => `${name}: ${description}`).join("\n")}
      `,
    }),
  )

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return data.object
}
