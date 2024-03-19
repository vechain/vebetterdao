import { XApp, useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import {
  useColorModeValue,
  Card,
  CardBody,
  VStack,
  HStack,
  Skeleton,
  IconButton,
  Image,
  Text,
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useClipboard,
  useToast,
} from "@chakra-ui/react"
import { FaExternalLinkAlt } from "react-icons/fa"
import { FaCheck, FaCopy, FaEllipsisVertical, FaHandDots } from "react-icons/fa6"
import { FiArrowUpRight } from "react-icons/fi"

type Props = { xApp: XApp }
export const AppCard = ({ xApp }: Props) => {
  const {
    data: appMetadata,
    isLoading: appMetadataLoading,
    isError: isAppMetadataError,
    error: appMetadataError,
  } = useXAppMetadata(xApp.id)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)
  const { data: banner, isLoading: isBannerLoading } = useIpfsImage(appMetadata?.banner)

  const buttonIconColor = useColorModeValue("primary.500", "white")

  const { onCopy, hasCopied } = useClipboard(xApp.receiverAddress)

  const toast = useToast()
  const handleOnCopy = () => {
    onCopy()
    toast({
      title: "dApp receiver address copied",
      status: "success",
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <Card variant={"baseWithBorder"} w="full">
      <Box w="full" position={"relative"} h={100}>
        <Skeleton w="full" h="full" isLoaded={!isBannerLoading}>
          <Image w="full" src={banner?.image} h={"full"} objectFit={"cover"} borderTopRadius={"md"} />
        </Skeleton>
        <Skeleton isLoaded={!isLogoLoading} alignContent={"start"} pos={"absolute"} bottom={-7} left={5}>
          <Image src={logo?.image ?? notFoundImage} alt={"logo"} boxSize={14} borderRadius="9px" />
        </Skeleton>
      </Box>
      <CardBody mt={5}>
        <VStack alignItems={"start"} justify={"flex-start"}>
          <VStack spacing={1} align="flex-start">
            <HStack spacing={1} justifyContent={"space-between"} align="center" w={"full"}>
              <Skeleton isLoaded={!appMetadataLoading}>
                <Text fontWeight={"600"} size={"xs"}>
                  {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                </Text>
              </Skeleton>
              <Menu>
                <MenuButton as={IconButton} isRound={true} icon={<FaEllipsisVertical />} />
                <MenuList>
                  <MenuItem
                    disabled={isAppMetadataError}
                    icon={<FaExternalLinkAlt />}
                    onClick={() => window.open(appMetadata?.external_url, "_blank")}>
                    Go to the dapp
                  </MenuItem>
                  <MenuItem onClick={handleOnCopy} icon={hasCopied ? <FaCheck /> : <FaCopy />}>
                    {" "}
                    Copy receiver address
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
            <Skeleton isLoaded={!appMetadataLoading}>
              <Text fontSize={"sm"} color={"gray.500"}>
                {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
              </Text>
            </Skeleton>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
