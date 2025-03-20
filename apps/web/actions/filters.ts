"use server"

import { createServerAction } from "zsa"
import { findAlternatives } from "~/server/web/alternatives/queries"
import { findCategories } from "~/server/web/categories/queries"

export const findFilterOptions = createServerAction().handler(async () => {
  const filters = await Promise.all([
    findAlternatives({}),
    findCategories({}),
  ])

  // Map the filters to the expected format
  const [alternative, category] = filters.map(r =>
    r.map(({ slug, name, _count }) => ({ slug, name, count: _count.tools })),
  )

  return { alternative, category } as const
})
