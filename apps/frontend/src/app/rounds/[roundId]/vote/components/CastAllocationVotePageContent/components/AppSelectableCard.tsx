import { HStack, Text, Skeleton, Image, CheckboxCard } from "@chakra-ui/react"

import { XApp } from "../../../../../../../api/contracts/xApps/getXApps"
import { useXAppMetadata } from "../../../../../../../api/contracts/xApps/hooks/useXAppMetadata"
import { useIpfsImage } from "../../../../../../../api/ipfs/hooks/useIpfsImage"

const notFoundImage = "/assets/images/image-not-found.webp"

type Props = {
  app: XApp
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
}

export const AppSelectableCard = ({ app, isSelected, onSelect, disabled }: Props) => {
  const { data: appMetadata } = useXAppMetadata(app.id)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  return (
    <CheckboxCard.Root
      w="full"
      colorPalette="blue"
      borderColor="border.primary"
      checked={isSelected}
      onCheckedChange={() => onSelect()}
      cursor={disabled ? "not-allowed" : "pointer"}
      disabled={disabled}
      opacity={disabled ? 0.5 : 1}>
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
