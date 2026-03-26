import { getConfig } from "@repo/config"
import createFetchClient from "openapi-fetch"
import createClient from "openapi-react-query"

import type { paths } from "./schema.d.ts"

const indexerHeaders = {
  "x-project-id": "b3tr-governor",
}

const baseUrl = getConfig().indexerUrl?.replace("/api/v1", "")

export const indexerFetch = (path: string, init?: RequestInit) =>
  fetch(`${baseUrl}${path}`, { ...init, headers: { ...indexerHeaders, ...init?.headers } })

export const fetchClient = createFetchClient<paths>({
  baseUrl,
  headers: indexerHeaders,
})
export const indexerQueryClient = createClient(fetchClient)
