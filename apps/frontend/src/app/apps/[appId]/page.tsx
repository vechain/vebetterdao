import { getNodeJsThorClient } from "@/utils"
import { getConfig } from "@repo/config"
import { Metadata, ResolvingMetadata } from "next"
import { AppDetailPage } from "./AppDetailPage"

//Need precise import to avoid having dapp-kit imported and indexed somewhere
import { getXAppMetadata } from "@/api/contracts/xApps/getXAppMetadata"
import { getXApps } from "@vechain/vechain-kit"
import { getXAppsMetadataBaseUri } from "@/api/contracts/xApps/getXAppsMetadataBaseUri"

import { getIpfsMetadata } from "@/api/ipfs"
import { compareAddresses } from "@repo/utils/AddressUtils"

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const id = params.appId

  // optionally access and extend (rather than replace) parent metadata
  //   const previousImages = (await parent).openGraph?.images || []

  const thor = await getNodeJsThorClient()

  const xApps = await getXApps(thor, getConfig().network.type)

  const allApps = xApps.active.concat(xApps.unendorsed)
  const app = allApps.find(app => compareAddresses(app.id, id))

  if (!app) throw new Error(`App ${id} not found`)

  const baseUri = await getXAppsMetadataBaseUri(thor)

  const metadata = await getXAppMetadata(`${baseUri}${app.metadataURI}`)

  if (!metadata) return {}

  const bannerImage = await getIpfsMetadata<string>(metadata.banner, false)

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

export default function AppDetail({ params }: Readonly<Props>) {
  return <AppDetailPage params={params} />
}
