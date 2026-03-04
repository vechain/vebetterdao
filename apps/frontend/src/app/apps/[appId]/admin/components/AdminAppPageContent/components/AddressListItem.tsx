import { Button, HStack, IconButton, Text, VStack } from "@chakra-ui/react"
import { UilTrash } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { AddressIcon } from "@/components/AddressIcon"

type Props = {
  address: string
  onRemove: () => void
  isRemoving?: boolean
}

export const AddressListItem = ({ address, onRemove, isRemoving }: Props) => {
  const { t } = useTranslation()
  const { data: vnsData } = useVechainDomain(address)
  const domain = vnsData?.domain

  return (
    <>
      <HStack gap={6} justify="space-between" hideBelow="md">
        <HStack>
          <AddressIcon address={address} h="48px" w="48px" rounded="full" />
          <VStack align="stretch" gap={0}>
            {domain && (
              <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                {domain}
              </Text>
            )}
            <Text textStyle="sm" color="text.subtle">
              {address}
            </Text>
          </VStack>
        </HStack>
        <Button
          variant="ghost"
          color="status.negative.primary"
          onClick={onRemove}
          disabled={isRemoving}
          loading={isRemoving}>
          <UilTrash size="14px" color="#D23F63" />
          {t("Remove")}
        </Button>
      </HStack>

      <HStack gap={4} justify="space-between" hideFrom="md">
        <HStack>
          <AddressIcon address={address} h="36px" w="36px" rounded="full" />
          <VStack align="stretch" gap={0}>
            {domain && (
              <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                {domain}
              </Text>
            )}
            <Text textStyle="sm" color="text.subtle">
              {humanAddress(address, 8, 6)}
            </Text>
          </VStack>
        </HStack>
        <IconButton
          variant="ghost"
          color="status.negative.primary"
          aria-label="Remove"
          onClick={onRemove}
          disabled={isRemoving}
          loading={isRemoving}>
          <UilTrash size="14px" color="#D23F63" />
        </IconButton>
      </HStack>
    </>
  )
}
