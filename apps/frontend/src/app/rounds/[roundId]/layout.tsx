import { getConfig } from "@repo/config"
import { Metadata, ResolvingMetadata } from "next"

type Props = {
  children: React.ReactNode
  params: Promise<{
    roundId: string
  }>
}

export async function generateMetadata(props: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params
  // read route params
  const id = params.roundId

  // optionally access and extend (rather than replace) parent metadata
  //   const previousImages = (await parent).openGraph?.images || []

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

export default function CastAllocationVoteLayout({ children }: Readonly<Props>) {
  return children
}
