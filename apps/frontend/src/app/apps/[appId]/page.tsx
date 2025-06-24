import { getNodeJsThorClient } from "@/utils"
import { getConfig } from "@repo/config"
import { Metadata, ResolvingMetadata } from "next"
import { AppDetailPage } from "./AppDetailPage"

//Need precise import to avoid having dapp-kit imported and indexed somewhere
import { getXAppMetadata } from "@/api/contracts/xApps/getXAppMetadata"

import { getIpfsMetadata } from "@/api/ipfs"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { X2EarnApps__factory } from "@repo/contracts"
import { XApp } from "@/api"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const id = params.appId

  // optionally access and extend (rather than replace) parent metadata
  //   const previousImages = (await parent).openGraph?.images || []

  const thor = await getNodeJsThorClient()
  const contract = thor.contracts.load(address, abi)
  const clauses = [contract.clause.unendorsedApps(), contract.clause.apps()]

  const res = await thor.transactions.executeMultipleClausesCall(clauses)

  if (!res) return {}

  const xApps = [...((res[0]?.result.plain as []) ?? []), ...((res[1]?.result.plain as []) ?? [])] as XApp[]

  const app = xApps.find(app => compareAddresses(app.id, id))

  if (!app) return {}

  const baseUri = await contract.read.baseURI()

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
