import { AppDetailPage } from "./AppDetailPage"

export type Props = {
  params: {
    appId: string
  }
}
export default function AppDetail({ params }: Readonly<Props>) {
  return <AppDetailPage params={params} />
}
