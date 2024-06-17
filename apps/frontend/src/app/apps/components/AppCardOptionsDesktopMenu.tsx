import {
  Menu,
  MenuButton,
  IconButton,
  MenuList,
  MenuItem,
  useClipboard,
  useToast,
  Skeleton,
  Link,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { FaExternalLinkAlt } from "react-icons/fa"
import { FaEllipsisVertical, FaCheck, FaCopy, FaRegImage } from "react-icons/fa6"

type Props = {
  teamWalletAddress: string
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
  const { onCopy, hasCopied } = useClipboard(teamWalletAddress)

  const toast = useToast()
  const handleOnCopy = () => {
    onCopy()
    toast({
      title: "Team wallet address copied",
      status: "success",
      duration: 3000,
      isClosable: true,
    })
  }

  const router = useRouter()
  const navigateToAppDetail = () => {
    router.push(`/apps/${xAppId}`)
  }

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        isRound={true}
        icon={<FaEllipsisVertical />}
        _hover={{
          cursor: "default",
        }}
        onClick={e => {
          e.stopPropagation()
        }}
      />
      <MenuList
        onClick={e => {
          e.stopPropagation()
        }}>
        <Skeleton isLoaded={!isLoading}>
          {showViewDetails && (
            <MenuItem onClick={navigateToAppDetail} icon={<FaRegImage />}>
              {t("View details")}
            </MenuItem>
          )}
          <MenuItem
            as={Link}
            _hover={{ textDecoration: "none" }}
            href={externalUrl ?? ""}
            isExternal
            disabled={!externalUrl}
            icon={<FaExternalLinkAlt />}>
            {externalUrl ? "Go to the App" : "No App link available"}
          </MenuItem>
        </Skeleton>
        <MenuItem onClick={handleOnCopy} icon={hasCopied ? <FaCheck /> : <FaCopy />}>
          {t("Copy team wallet address")}
        </MenuItem>
      </MenuList>
    </Menu>
  )
}
