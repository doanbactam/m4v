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

  Yêu cầu về định dạng đầu ra:
  1. Tagline: Một câu ngắn gọn (10-60 ký tự) mô tả lợi ích cốt lõi
  2. Description: Mô tả ngắn (50-160 ký tự) về tính năng và lợi ích chính
  3. Content: Nội dung chi tiết (100-1000 ký tự) với format Markdown
  
  Lưu ý quan trọng:
  - KHÔNG sử dụng tên sản phẩm trong tagline và description
  - Sử dụng ngôn ngữ đơn giản, dễ hiểu
  - Tránh các từ ngữ marketing sáo rỗng
  - Tập trung vào lợi ích thực tế cho người dùng
`

/**
 * The schema for the content generator.
 */
const contentSchema = z.object({
  tagline: z
    .string()
    .min(10)
    .max(60)
    .describe(
      "Tạo một câu tagline (tối đa 60 ký tự) bao quát lợi ích cốt lõi và các tính năng độc đáo của công cụ mà không sử dụng tên của nó. Tập trung vào sự ngắn gọn và ấn tượng để đảm bảo phù hợp với đối tượng mục tiêu.",
    ),
  description: z
    .string()
    .min(50)
    .max(160)
    .describe(
      "Mô tả ngắn gọn sản phẩm Yêu cầu: Tối đa 160 ký tự Nổi bật các tính năng chính Nêu rõ lợi ích cho người dùng Không bao gồm tên của công cụ",
    ),
  content: z
    .string()
    .min(100)
    .max(1000)
    .describe(
      "Mô tả chi tiết và hấp dẫn về sản phẩm hoặc dịch vụ, tối đa 1000 ký tự. Đoạn văn đầu tiên nên giới thiệu tổng quan về sản phẩm hoặc dịch vụ, nêu bật các điểm mạnh và các lợi ích chính mà khách hàng có thể nhận được. Các lợi ích nên được làm nổi bật bằng chữ in đậm. Sử dụng cú pháp Markdown chính xác cho danh sách các tính năng hoặc lợi ích cụ thể, đảm bảo tính rõ ràng và dễ hiểu cho người đọc. Hãy chắc chắn rằng nội dung mạch lạc và logic, hướng đến việc khuyến khích khách hàng tìm hiểu thêm hoặc thực hiện hành động.",
    ),
})

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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
  
  try {
    // Validate URL format
    if (!url.match(/^https?:\/\/.+/)) {
      throw new Error('Invalid URL format');
    }

    // Scrape website data with improved error handling
    const scrapedData = await scrapeWebsiteData(url)

    // Validate scraped data
    if (!scrapedData.metadata?.title || !scrapedData.markdown) {
      throw new Error('Failed to extract required content from URL');
    }

    // Generate content with AI
    const { data, error } = await tryCatch(
      generateObject({
        model,
        schema: contentSchema,
        system: systemPrompt,
        temperature: 0.7, // Tăng temperature để có kết quả đa dạng hơn
        prompt: `
          Phân tích và tạo nội dung cho sản phẩm sau:

          TÊN SẢN PHẨM: ${scrapedData.metadata?.title}
          MÔ TẢ GỐC: ${scrapedData.metadata?.description}
          NỘI DUNG CHI TIẾT:
          ${scrapedData.markdown}

          YÊU CẦU QUAN TRỌNG:
          1. Tagline (10-60 ký tự):
             - Nêu bật lợi ích cốt lõi và tính năng độc đáo
             - KHÔNG sử dụng tên sản phẩm
             - Ngắn gọn và ấn tượng
          
          2. Description (50-160 ký tự):
             - Mô tả tính năng chính và lợi ích
             - KHÔNG sử dụng tên sản phẩm
             - Tập trung vào giá trị cho người dùng
          
          3. Content (100-1000 ký tự):
             - Đoạn đầu: Giới thiệu tổng quan, nêu bật điểm mạnh
             - Sử dụng **bold** cho các lợi ích quan trọng
             - Dùng Markdown cho danh sách tính năng
             - Kết thúc với call-to-action
          
          Hãy đảm bảo nội dung:
          - Đúng giới hạn ký tự cho mỗi phần
          - Không sử dụng từ ngữ marketing sáo rỗng
          - Tập trung vào lợi ích thực tế
          - Dễ hiểu và thuyết phục
        `,
        maxTokens: 2000,
      })
    )

    if (error) {
      // Log chi tiết lỗi để debug
      logger.error('AI generation error', {
        url,
        error: getErrorMessage(error),
        scrapedTitle: scrapedData.metadata?.title,
        scrapedDescription: scrapedData.metadata?.description?.slice(0, 100),
      });
      throw new Error(`AI content generation failed: ${getErrorMessage(error)}`);
    }

    // Validate kết quả trước khi trả về
    const result = data.object;
    if (!result.tagline || !result.description || !result.content) {
      throw new Error('Generated content is missing required fields');
    }

    // Log thành công
    logger.info('Content generated successfully', {
      url,
      taglineLength: result.tagline.length,
      descriptionLength: result.description.length,
      contentLength: result.content.length,
    });

    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('Content generation failed', {
        url,
        errorMessage: err.message,
        errorStack: err.stack,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to generate content: ${err.message}`);
    }
    
    // Handle non-Error objects
    const errorMessage = String(err);
    logger.error('Content generation failed', {
      url,
      errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to generate content: ${errorMessage}`);
  }
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

const logger = {
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    console.info(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};
