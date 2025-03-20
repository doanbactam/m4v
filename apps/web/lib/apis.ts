import type { RepositoryData } from "@openalternative/github"
import type { AllowedKeys } from "@specfy/stack-analyser"
import wretch from "wretch"
import { env } from "~/env"

export type AnalyzerAPIResult = {
  stack: AllowedKeys[]
  repository: RepositoryData
}


export type BrandLinkAPIResult = Record<string, Array<Record<string, string> & { url: string }>>

export const brandLinkApi = wretch("https://brandlink.piotr-f64.workers.dev/api")
  .errorType("json")
  .resolve(r => r.json<BrandLinkAPIResult>())
