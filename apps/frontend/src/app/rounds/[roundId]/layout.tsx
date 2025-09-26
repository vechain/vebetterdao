import { getConfig } from "@repo/config"
import { Metadata, ResolvingMetadata } from "next"

type Props = {
  children: React.ReactNode
  params: {
    roundId: string
  }
}

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const id = params.roundId

  // optionally access and extend (rather than replace) parent metadata
  //   const previousImages = (await parent).openGraph?.images || []

  return {
    title: `Round ${id} - VeBetter`,
    description: `Cast your vote for round ${id} on VeBetter and earn rewards!`,
    openGraph: {
      description: `Cast your vote for round ${id} on VeBetter and earn rewards!`,
    },
    twitter: {
      title: `Round ${id} - VeBetter`,
      description: `Cast your vote for round ${id} on VeBetter and earn rewards!`,
      card: "summary_large_image",
      site: getConfig().basePath,
    },
  }
}

export default function CastAllocationVoteLayout({ children }: Readonly<Props>) {
  return children
}
