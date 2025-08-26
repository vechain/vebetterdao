import { Menu, IconButton, useClipboard, Skeleton, Link, Portal } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { FaExternalLinkAlt } from "react-icons/fa"
import { FaEllipsisVertical, FaCheck, FaCopy, FaRegImage } from "react-icons/fa6"
import { toaster } from "@/components/ui/toaster"

type Props = {
  teamWalletAddress?: string
  externalUrl?: string
  isLoading?: boolean
  showViewDetails?: boolean
  xAppId?: string
}
export const AppCardOptionsDesktopMenu = ({
  teamWalletAddress,
  externalUrl,
  isLoading = false,
  xAppId,
  showViewDetails = false,
}: Props) => {
  const { t } = useTranslation()
  const { copy: onCopy, copied: hasCopied } = useClipboard({
    value: teamWalletAddress ?? "",
  })

  const handleOnCopy = () => {
    onCopy()
    toaster.success({
      title: t("Treasury address copied"),
      duration: 3000,
      closable: true,
    })
  }

  const router = useRouter()
  const navigateToAppDetail = () => {
    router.push(`/apps/${xAppId}`)
  }

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          variant="subtle"
          rounded="full"
          _hover={{
            cursor: "default",
          }}>
          <FaEllipsisVertical />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            bg={{
              base: "white",
              _dark: "#2D3748",
            }}>
            <Skeleton loading={isLoading}>
              {showViewDetails && (
                <Menu.Item value="view-details" onClick={navigateToAppDetail}>
                  <FaRegImage />
                  {t("View details")}
                </Menu.Item>
              )}
              <Menu.Item value="go-to-app" disabled={!externalUrl}>
                <FaExternalLinkAlt />
                <Link href={externalUrl ?? ""} target="_blank" rel="noreferrer">
                  {externalUrl ? t("Go to the App") : t("No App link available")}
                </Link>
              </Menu.Item>
            </Skeleton>
            <Menu.Item value="copy-team-wallet-address" onClick={handleOnCopy}>
              {hasCopied ? <FaCheck /> : <FaCopy />}
              {t("Copy team wallet address")}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
