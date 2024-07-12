import { getConfig } from "@repo/config"
import { Metadata, ResolvingMetadata } from "next"
import { CastVoteLayoutContent } from "./components/CastVoteLayoutContent"

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

  console.log("Generating metadata for round", id)

  return {
    title: `Round ${id} - VeBetterDAO`,
    description: `Cast your vote for round ${id} on VeBetterDAO and earn rewards!`,
    openGraph: {
      description: `Cast your vote for round ${id} on VeBetterDAO and earn rewards!`,
    },
    twitter: {
      title: `Round ${id} - VeBetterDAO`,
      description: `Cast your vote for round ${id} on VeBetterDAO and earn rewards!`,
      card: "summary_large_image",
      site: getConfig().basePath,
    },
  }
}

export default function CastAllocationVoteLayout({ children, params }: Readonly<Props>) {
  return <CastVoteLayoutContent params={params}>{children}</CastVoteLayoutContent>
}
