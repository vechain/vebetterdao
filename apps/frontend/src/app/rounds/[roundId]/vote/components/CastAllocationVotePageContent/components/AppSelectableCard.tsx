import { XApp, useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { HStack, Text, Skeleton, Image, CheckboxCard } from "@chakra-ui/react"

type Props = {
  app: XApp
  isSelected: boolean
  onSelect: () => void
}

export const AppSelectableCard = ({ app, isSelected, onSelect }: Props) => {
  const { data: appMetadata } = useXAppMetadata(app.id)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  return (
    <CheckboxCard.Root
      w="full"
      colorPalette="blue"
      borderColor="border.primary"
      checked={isSelected}
      onCheckedChange={() => onSelect()}
      cursor="pointer">
      <CheckboxCard.HiddenInput />
      <CheckboxCard.Control alignItems="center">
        <CheckboxCard.Label>
          <HStack gap={4}>
            <Skeleton loading={isLogoLoading}>
              <Image src={logo?.image ?? notFoundImage} alt={appMetadata?.name} boxSize={"32px"} borderRadius="9px" />
            </Skeleton>
            <Text textStyle="lg" fontWeight="semibold">
              {app.name}
            </Text>
          </HStack>
        </CheckboxCard.Label>
        <CheckboxCard.Indicator />
      </CheckboxCard.Control>
    </CheckboxCard.Root>
  )
}
