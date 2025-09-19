import createFetchClient from "openapi-fetch"
import createClient from "openapi-react-query"

import { getConfig } from "@repo/config"

import type { paths } from "./schema.d.ts"

const baseUrl = getConfig().indexerUrl

const fetchClient = createFetchClient<paths>({ baseUrl: baseUrl?.replace("/api/v1", "") })

export const indexerQueryClient = createClient(fetchClient)
