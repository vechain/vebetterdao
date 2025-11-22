import { AppDetailPage } from "./AppDetailPage"
import { getAppDetailServerData } from "./serverData"
import { AppDetailServerData } from "./types"

export type Props = {
  params: { appId: string }
}

export default async function AppDetail({ params }: Readonly<Props>) {
  const appDetailData: AppDetailServerData | null = await getAppDetailServerData(params.appId)

  if (!appDetailData) {
    // TODO: Implement error.tsx for Next.js error boundary handling
    return null
  }

  return <AppDetailPage params={params} appDetailData={appDetailData} />
}
