import { createSimilarWebClient } from "@openalternative/similarweb";
import { env } from "~/env";

export const similarWebClient = createSimilarWebClient(env.SIMILARWEB_API_KEY);
