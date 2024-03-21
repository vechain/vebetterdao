import { XApp, useXAppMetadata } from "@/api"
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
import { FaExternalLinkAlt } from "react-icons/fa"
import { FaEllipsisVertical, FaCheck, FaCopy } from "react-icons/fa6"

type Props = {
  xApp: XApp
}
export const AppCardOptionsDesktopMenu = ({ xApp }: Props) => {
  const { data: appMetadata, isLoading: appMetadataLoading } = useXAppMetadata(xApp.id)

  const { onCopy, hasCopied } = useClipboard(xApp.receiverAddress)

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

  return (
    <Menu>
      <MenuButton as={IconButton} isRound={true} icon={<FaEllipsisVertical />} />
      <MenuList>
        <Skeleton isLoaded={!appMetadataLoading}>
          <MenuItem
            as={Link}
            _hover={{ textDecoration: "none" }}
            href={appMetadata?.external_url ?? ""}
            isExternal
            disabled={!appMetadata?.external_url}
            icon={<FaExternalLinkAlt />}>
            {appMetadata?.external_url ? "Go to the App" : "No App link available"}
          </MenuItem>
        </Skeleton>
        <MenuItem onClick={handleOnCopy} icon={hasCopied ? <FaCheck /> : <FaCopy />}>
          Copy receiver address
        </MenuItem>
      </MenuList>
    </Menu>
  )
}
