import { AppDetailPage } from "./AppDetailPage"

type Props = {
  params: Promise<{ appId: string }>
}
export default async function AppDetail({ params }: Readonly<Props>) {
  const { appId } = await params
  return <AppDetailPage appId={appId} />
}
