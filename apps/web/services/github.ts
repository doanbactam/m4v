import { createGithubClient } from "@m4v/github"
import { env } from "~/env"

export const githubClient = createGithubClient(env.GITHUB_TOKEN)
