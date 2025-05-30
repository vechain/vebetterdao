import { XApp } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { HStack, Checkbox, Text, Box, Skeleton, Image } from "@chakra-ui/react"
import { useXAppMetadata } from "@vechain/vechain-kit"

type Props = {
  app: XApp
  isSelected: boolean
  onSelect: () => void
}

export const AppSelectableCard = ({ app, isSelected, onSelect }: Props) => {
  const { data: appMetadata } = useXAppMetadata(app.id)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  return (
    <Box
      w="full"
      p={4}
      bgColor={isSelected ? "#E5EEFF" : "inherit"}
      _hover={{ bgColor: isSelected ? "#E5EEFF" : "#F7F9FC" }}
      borderWidth="1px"
      borderRadius="12px"
      borderColor={"gray.200"}
      onClick={onSelect}
      cursor="pointer"
      data-testid={`vote-app-card-${app.name}`}>
      <HStack w="full" spacing={4} justify="space-between">
        <HStack spacing={4}>
          <Skeleton isLoaded={!isLogoLoading}>
            <Image src={logo?.image ?? notFoundImage} alt={appMetadata?.name} boxSize={"32px"} borderRadius="9px" />
          </Skeleton>
          <Text fontSize="18px" fontWeight={600}>
            {app.name}
          </Text>
        </HStack>
        <Checkbox
          pointerEvents={"none"}
          isChecked={isSelected}
          onChange={onSelect}
          colorScheme="primary"
          data-testid={`select-app-checkbox-${app.name}`}
        />
      </HStack>
    </Box>
  )
}
