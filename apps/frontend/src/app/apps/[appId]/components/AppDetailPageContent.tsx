import { AppDetailCard } from "./AppDetailCard"

type Props = {
  appId: string
}

export const AppDetailPageContent = ({ appId }: Props) => {
  return <AppDetailCard appId={appId} />
}
