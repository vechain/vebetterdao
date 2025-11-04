import { getConfig } from "@repo/config"
import createFetchClient from "openapi-fetch"
import createClient from "openapi-react-query"

import type { paths } from "./schema.d.ts"

const baseUrl = getConfig().indexerUrl
export const fetchClient = createFetchClient<paths>({
  baseUrl: baseUrl?.replace("/api/v1", ""),
  headers: {
    "x-project-id": "B3tr Governor",
  },
})
export const indexerQueryClient = createClient(fetchClient)
