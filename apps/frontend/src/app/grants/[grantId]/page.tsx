import { GrantPage } from "./GrantPage"

export type Props = {
  params: {
    grantId: string
  }
}
export default function Grant({ params }: Readonly<Props>) {
  return <GrantPage params={params} />
}
