import { GrantPage } from "./GrantPage"

export type Props = {
  params: { grantId: string }
}
export default async function Grant({ params }: Readonly<Props>) {
  const { grantId } = params
  return <GrantPage grantId={grantId} />
}
