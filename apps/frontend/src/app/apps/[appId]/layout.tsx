import { getConfig } from "@repo/config"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { Metadata, ResolvingMetadata } from "next"
//Need precise import to avoid having dapp-kit imported and indexed somewhere

import { getXAppMetadata } from "@/api/contracts/xApps/getXAppMetadata"
import { APPLICATION_NAME, IMAGE_DIMENSION, pagesMetadata } from "@/metadata/pages"
import { getDefaultMetadata } from "@/utils/metadata"

import { XApp } from "../../../api/contracts/xApps/getXApps"
import { getNodeJsThorClient } from "../../../utils/getNodeJsThorClient"
import { convertUriToUrl } from "../../../utils/uri"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress

type Props = {
  params: Promise<{ appId: string }>
}

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  try {
    const { appId: id } = await params

    if (!id) {
      return getDefaultMetadata()
    }

    const thor = await getNodeJsThorClient()
    const contract = thor.contracts.load(address, abi)
    const clauses = [contract.clause.apps(), contract.clause.unendorsedApps()]

    const res = await thor.transactions.executeMultipleClausesCall(clauses)
    if (!res) return getDefaultMetadata()

    const xApps = [...((res[0]?.result.plain as []) ?? []), ...((res[1]?.result.plain as []) ?? [])] as XApp[]
    const app = xApps.find(app => compareAddresses(app.id, id))

    if (!app) return getDefaultMetadata()

    const baseUri = await contract.read?.baseURI()
    if (!baseUri) return getDefaultMetadata()

    const metadata = await getXAppMetadata(`${baseUri}${app.metadataURI}`)
    if (!metadata?.name || !metadata?.description) return getDefaultMetadata()

    // Get the config and the page url
    const config = getConfig()
    const pageUrl = `${config.basePath}/apps/${id}`

    // Safely handle banner image
    const bannerImageUrl = metadata.banner
      ? convertUriToUrl(metadata.banner)
      : `${config.basePath}${pagesMetadata.apps.image}` // fallback to default apps metadata image

    const title = `${metadata.name} | ${APPLICATION_NAME}`
    const description = `${metadata.name} is part of ${APPLICATION_NAME}! ${metadata.description}`
    const defaultAppImage = {
      url: bannerImageUrl,
      alt: `${metadata.name} | ${APPLICATION_NAME}`,
      width: IMAGE_DIMENSION.width,
      height: IMAGE_DIMENSION.height,
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description: metadata.description,
        type: "website",
        url: pageUrl,
        siteName: APPLICATION_NAME,
        ...(bannerImageUrl && {
          images: [defaultAppImage],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        site: config.basePath,
        ...(bannerImageUrl && {
          images: [defaultAppImage],
        }),
      },
    }
  } catch (error) {
    console.error("Error generating metadata for app:", error)
    return getDefaultMetadata()
  }
}

export default function AppsLayout({ children }: { children: React.ReactNode }) {
  return children
}
