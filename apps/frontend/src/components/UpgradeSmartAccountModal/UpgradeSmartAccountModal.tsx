import { Box, Button, Heading, HStack, VStack } from "@chakra-ui/react"
import { GenericAlert } from "@/app/components/Alert"
import { useSmartAccountVersion, useUpgradeSmartAccount, useWallet } from "@vechain/vechain-kit"
import { AddressIcon } from "../AddressIcon"
import { ArrowRightIcon } from "../Icons/ArrowRightIcon"
import { useTranslation } from "react-i18next"
import { BaseModal } from "../BaseModal"
import { useState, useCallback } from "react"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const UpgradeSmartAccountModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()

  const { account, smartAccount } = useWallet()
  const { data: currentVersion } = useSmartAccountVersion(smartAccount?.address ?? "")
  const [txError, setTxError] = useState<string | null>(null)
  const upgradeVersion = 3 //Hardcoding the upgrade version for now, in the future if this is required vechain kit exposes the latest version on the useCurrentAccountImplementationVersion hook

  const {
    sendTransaction: sendUpgradeSmartAccountTransaction,
    isWaitingForWalletConfirmation: isUpgradeWaitinSign,
    isTransactionPending: isUpgradeTransactionPending,
  } = useUpgradeSmartAccount({
    smartAccountAddress: smartAccount?.address ?? "",
    targetVersion: upgradeVersion,
    onSuccess: () => {
      setTxError(null)
      onClose()
    },
    onError: () => {
      setTxError("Error when upgrading your smart account. Please try again.")
    },
  })
  const handleSendTransaction = useCallback(() => {
    setTxError(null)
    sendUpgradeSmartAccountTransaction()
  }, [sendUpgradeSmartAccountTransaction])

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <VStack spacing={3} align="stretch" w="full">
        <Heading fontSize="24px" textAlign="center">
          {t("Upgrade Your Account")}
        </Heading>
        <GenericAlert
          type="warning"
          isLoading={false}
          title={t("Upgrade Your Account")}
          message={t(
            "To proceed, you must upgrade your smart account. This upgrade unlocks enhanced security, enables multi-clause support, and provides additional features essential for transactions on VeChain. It's a quick and seamless process—just one click away!",
          )}
        />

        {txError && <GenericAlert type="error" isLoading={false} message={txError} />}

        <HStack align="center" w="full" justifyContent="space-evenly" rounded="md">
          <Box position="relative" display="inline-block">
            <AddressIcon address={account?.address ?? ""} alt={t("Profile Picture")} h="60px" w="60px" rounded="full" />
            {currentVersion ? (
              <Heading position="absolute" top="-5" right="-5" color="#D23F63" fontSize="28px">
                {`v${currentVersion}`}
              </Heading>
            ) : null}
          </Box>

          <ArrowRightIcon color="#3DBA67" />

          <Box position="relative" display="inline-block">
            <AddressIcon address={account?.address ?? ""} alt={t("Profile Picture")} h="60px" w="60px" rounded="full" />
            <Heading position="absolute" top="-5" right="-5" color="#3DBA67" fontSize="28px">
              {`v${upgradeVersion}`}
            </Heading>
          </Box>
        </HStack>

        <Button
          variant="primaryAction"
          w="full"
          fontSize="16px"
          isDisabled={isUpgradeTransactionPending || isUpgradeWaitinSign}
          onClick={handleSendTransaction}
          isLoading={isUpgradeWaitinSign || isUpgradeTransactionPending}>
          {t("Upgrade Now")}
        </Button>

        <Button variant="link" colorScheme="primary" w="full" onClick={onClose}>
          {t("Cancel")}
        </Button>
      </VStack>
    </BaseModal>
  )
}
