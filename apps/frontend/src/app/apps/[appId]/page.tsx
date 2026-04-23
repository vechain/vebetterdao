import { AppDetailPage } from "./AppDetailPage"

export type Props = {
  params: { appId: string }
}
export default async function AppDetail({ params }: Readonly<Props>) {
  const { appId } = params
  return <AppDetailPage appId={appId} />
}
