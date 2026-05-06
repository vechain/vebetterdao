import { GrantPage } from "./GrantPage"

type Props = {
  params: Promise<{ grantId: string }>
}
export default async function Grant({ params }: Readonly<Props>) {
  const { grantId } = await params
  return <GrantPage grantId={grantId} />
}
