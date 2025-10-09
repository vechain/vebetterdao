import { getConfig } from "@repo/config"
import { Metadata, ResolvingMetadata } from "next"

import { APPLICATION_NAME, IMAGE_DIMENSION, pagesMetadata } from "@/metadata/pages"
import { getDefaultMetadata } from "@/utils/metadata"

type Props = {
  children: React.ReactNode
  params: {
    roundId: string
  }
}
export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  const id = params.roundId
  if (!id) {
    return getDefaultMetadata()
  }
  const defaultAllocationImage = {
    url: `${getConfig().basePath}${pagesMetadata.allocations.image}`,
    alt: `Round ${id} | ${APPLICATION_NAME}`,
    width: IMAGE_DIMENSION.width,
    height: IMAGE_DIMENSION.height,
  }
  return {
    title: `Round ${id} | ${APPLICATION_NAME}`,
    description: `Cast your vote for round ${id} on ${APPLICATION_NAME} and earn rewards!`,
    openGraph: {
      description: `Cast your vote for round ${id} on ${APPLICATION_NAME} and earn rewards!`,
      title: `Round ${id} | ${APPLICATION_NAME}`,
      type: "website",
      url: `${getConfig().basePath}/rounds/${id}`,
      siteName: APPLICATION_NAME,
      images: [defaultAllocationImage],
    },
    twitter: {
      title: `Round ${id} | ${APPLICATION_NAME}`,
      description: `Cast your vote for round ${id} on ${APPLICATION_NAME} and earn rewards!`,
      card: "summary_large_image",
      site: getConfig().basePath,
      images: [defaultAllocationImage],
    },
  }
}
export default function CastAllocationVoteLayout({ children }: Readonly<Props>) {
  return children
}
