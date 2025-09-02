import { XApp, useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { HStack, Checkbox, Text, Box, Skeleton, Image } from "@chakra-ui/react"

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
      bgColor={isSelected ? "b3tr-balance-bg" : "inherit"}
      _hover={{ bgColor: isSelected ? "contrast-bg-muted" : "hover-contrast-bg" }}
      borderWidth="1px"
      borderRadius="12px"
      borderColor={"gray.200"}
      onClick={onSelect}
      cursor="pointer"
      data-testid={`vote-app-card-${app.name}`}>
      <HStack w="full" gap={4} justify="space-between">
        <HStack gap={4}>
          <Skeleton loading={isLogoLoading}>
            <Image src={logo?.image ?? notFoundImage} alt={appMetadata?.name} boxSize={"32px"} borderRadius="9px" />
          </Skeleton>
          <Text textStyle="lg" fontWeight="semibold">
            {app.name}
          </Text>
        </HStack>
        <Checkbox.Root
          pointerEvents={"none"}
          checked={isSelected}
          onCheckedChange={onSelect}
          colorPalette="primary"
          data-testid={`select-app-checkbox-${app.name}`}>
          <Checkbox.Control />
        </Checkbox.Root>
      </HStack>
    </Box>
  )
}
