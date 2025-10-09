import { Card, VStack, Heading, Text, Button, useDisclosure, HStack, Stack, Icon } from "@chakra-ui/react"
import { UilArrowUpRight, UilCheck, UilCopy } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useWallet, useVechainDomain } from "@vechain/vechain-kit"
import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { AddressIcon } from "@/components/AddressIcon"

import { UserNode } from "../../../../../api/contracts/xNodes/useGetUserNodes"

import { DelegateXNodeModal } from "./DelegateXNodeModal"
import { DelegationAlert } from "./DelegationAlert"
import { RevokeXNodeDelegationModal } from "./RevokeXNodeDelegationModal"

export const DelegateXNodeCard = ({ xNode }: { xNode: UserNode }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { delegatee, xNodeOwner, isXNodeDelegated, isXNodeDelegator } = xNode
  const delegateModal = useDisclosure()
  const revokeModal = useDisclosure()
  const { data: vnsDelegateeData } = useVechainDomain(delegatee)
  const delegateeDomain = vnsDelegateeData?.domain
  const { data: vnsOwnerData } = useVechainDomain(xNodeOwner)
  const ownerDomain = vnsOwnerData?.domain
  const isOwner = compareAddresses(account?.address ?? "", xNodeOwner ?? "")
  const displayAddress = isOwner ? (delegateeDomain ?? delegatee) : (ownerDomain ?? xNodeOwner)
  const isDomain = isOwner ? !!delegateeDomain : !!ownerDomain
  return (
    <Card.Root variant="primary" w="full">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <Heading textStyle="xl">{t("Node Management")}</Heading>
            {isXNodeDelegated ? (
              <Text textStyle="sm">
                {isXNodeDelegator ? t("Node is currently managed by:") : t("Node managed for:")}
              </Text>
            ) : (
              <>
                <Text textStyle="sm">{t("Assign a manager to help operate this node.")}</Text>
                <Text textStyle="sm">
                  {t(
                    "Managers can claim rewards and access third-party apps that verify NFT ownership (like VeBetter or VeVote), but cannot transfer, unstake, or burn the NFT.",
                  )}
                </Text>
                <Text textStyle="sm">{t("You can revoke access anytime.")}</Text>
              </>
            )}
          </VStack>

          {isXNodeDelegated ? (
            <DelegatedNodeDisplay
              isXNodeDelegator={isXNodeDelegator}
              displayAddress={displayAddress ?? ""}
              isDomain={isDomain}
              onRevoke={revokeModal.onOpen}
            />
          ) : (
            <Button ml="auto" maxW="fit-content" variant="secondary" onClick={delegateModal.onOpen}>
              <Icon as={UilArrowUpRight} color="actions.secondary.text" />
              {t("Add node manager")}
            </Button>
          )}

          <DelegationAlert isXNodeDelegator={isXNodeDelegator} isXNodeDelegated={isXNodeDelegated} />
        </VStack>
      </Card.Body>

      <DelegateXNodeModal xNode={xNode} modal={delegateModal} />
      <RevokeXNodeDelegationModal xNode={xNode} modal={revokeModal} />
    </Card.Root>
  )
}

const DelegatedNodeDisplay = ({
  isXNodeDelegator,
  displayAddress,
  isDomain,
  onRevoke,
}: {
  isXNodeDelegator: boolean
  displayAddress: string
  isDomain: boolean
  onRevoke: () => void
}) => {
  const { t } = useTranslation()

  // Allow users to copy delegation addresses to clipboard
  const [showCopiedLink, setShowCopiedLink] = useState(false)
  const handleCopyAddress = useCallback(async () => {
    await navigator.clipboard.writeText(displayAddress ?? "")
    setShowCopiedLink(true)
    setTimeout(() => {
      setShowCopiedLink(false)
    }, 2000)
  }, [displayAddress])

  return (
    <VStack align="stretch" gap={4}>
      <Stack
        direction={["column", "column", "row"]}
        justify="space-between"
        alignItems={"center"}
        bg="light-contrast-on-card-bg"
        rounded="xl"
        p={3}
        w="full"
        gap={[2, 2, 6]}>
        <HStack gap={4} w="full">
          <AddressIcon address={isDomain ? "" : displayAddress} w={8} h={8} rounded="full" />
          <HStack>
            <Text>{isDomain ? humanDomain(displayAddress, 4, 26) : humanAddress(displayAddress, 8, 8)}</Text>
            {showCopiedLink ? (
              <UilCheck size={"18px"} color="#6DCB09" />
            ) : (
              <UilCopy size={"18px"} color="text.subtle" onClick={handleCopyAddress} cursor="pointer" />
            )}
          </HStack>
        </HStack>
        {isXNodeDelegator && (
          <Button
            variant="ghost"
            color="status.negative.primary"
            colorPalette="red"
            onClick={onRevoke}
            w={"fit-content"}>
            {t("Cancel delegation")}
          </Button>
        )}
      </Stack>
    </VStack>
  )
}
