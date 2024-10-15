import { ResolvingMetadata, Metadata } from "next"
import { getConfig } from "@repo/config"
import { AppDetailPage } from "./AppDetailPage"
import { getNodeJsConnex } from "@/utils"
import { getXApps } from "@/api/contracts/xApps/getXApps"
import { getXAppMetadata } from "@/api/contracts/xApps/getXAppMetadata"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { getXAppsMetadataBaseUri } from "@/api/contracts/xApps/getXAppsMetadataBaseUri"
import { getIpfsMetadata } from "@/api/ipfs"
import { unstable_cache } from "next/cache"

// Wrap the data fetching logic in a cached function
const getCachedAppData = unstable_cache(
  async (id: string) => {
    console.log("Fetching app data")
    const connex = await getNodeJsConnex()
    const xApps = await getXApps(connex.thor)
    const app = xApps.find(app => compareAddresses(app.id, id))

    if (!app) throw new Error(`App ${id} not found`)

    const baseUri = await getXAppsMetadataBaseUri(connex.thor)
    const metadata = await getXAppMetadata(`${baseUri}${app.metadataURI}`)

    if (!metadata) return null

    const bannerImage = await getIpfsMetadata<string>(metadata.banner, false)

    return { app, metadata, bannerImage }
  },
  ["app-data"],
  { revalidate: 3600 }, // Revalidate every hour
)

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  const id = params.appId
  const data = await getCachedAppData(id)

  if (!data) return {}

  const { metadata, bannerImage } = data

  return {
    title: `${metadata.name} - VeBetterDAO`,
    description: `${metadata.name} is part of VeBetterDAO! ${metadata.description}`,
    openGraph: {
      description: metadata.description,
      images: [bannerImage],
    },
    twitter: {
      title: `${metadata.name} - VeBetterDAO`,
      description: `${metadata.name} is part of VeBetterDAO! ${metadata.description}`,
      images: [bannerImage],
      card: "summary_large_image",
      site: getConfig().basePath,
    },
  }
}

type Props = {
  params: {
    appId: string
  }
}

export default async function AppDetail({ params }: Readonly<Props>) {
  return <AppDetailPage params={params} />
}
