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
import { FaExternalLinkAlt } from "react-icons/fa"
import { FaEllipsisVertical, FaCheck, FaCopy, FaFileImage, FaRegImage } from "react-icons/fa6"

type Props = {
  receiverAddress: string
  externalUrl?: string
  isLoading?: boolean
  showViewDetails?: boolean
  xAppId: string
}
export const AppCardOptionsDesktopMenu = ({
  receiverAddress,
  externalUrl,
  isLoading = false,
  xAppId,
  showViewDetails = false,
}: Props) => {
  const { onCopy, hasCopied } = useClipboard(receiverAddress)

  const toast = useToast()
  const handleOnCopy = () => {
    onCopy()
    toast({
      title: "App receiver address copied",
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
      <MenuButton as={IconButton} isRound={true} icon={<FaEllipsisVertical />} />
      <MenuList>
        <Skeleton isLoaded={!isLoading}>
          {showViewDetails && (
            <MenuItem onClick={navigateToAppDetail} icon={<FaRegImage />}>
              View details
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
          Copy receiver address
        </MenuItem>
      </MenuList>
    </Menu>
  )
}
