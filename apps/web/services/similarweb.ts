import { createSimilarWebClient } from "@m4v/similarweb";
import { env } from "~/env";

export const similarWebClient = createSimilarWebClient(env.RAPIDAPI_KEY);
