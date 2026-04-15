import { ChallengeDetailPageContent } from "../components/ChallengeDetailPageContent"

export default async function ChallengeDetailPage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params

  return <ChallengeDetailPageContent challengeId={challengeId} />
}
