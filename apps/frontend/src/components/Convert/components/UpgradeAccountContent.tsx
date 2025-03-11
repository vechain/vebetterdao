import { VStack, ModalCloseButton, Heading, Button, HStack, Box } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon"
import { AddressIcon } from "@/components/AddressIcon"
import { useSmartAccountVersion, useUpgradeSmartAccount, useWallet } from "@vechain/vechain-kit"
import { GenericAlert } from "@/app/components/Alert"

type Props = {
  onClose: () => void
}

export const UpgradeAccountContent = ({ onClose }: Props) => {
  const { t } = useTranslation()

  const { account, smartAccount } = useWallet()
  const { data: currentVersion } = useSmartAccountVersion(smartAccount?.address ?? "")
  const upgradeVersion = 3 //TODO: Fetch the latest version from vechain Kit

  const {
    sendTransaction: sendUpgradeSmartAccountTransaction,
    isWaitingForWalletConfirmation: isUpgradeWaitinSign,
    isTransactionPending: isUpgradeTransactionPending,
  } = useUpgradeSmartAccount({
    smartAccountAddress: smartAccount?.address ?? "",
    targetVersion: upgradeVersion,
  })

  return (
    <VStack spacing={3} align="center" w="full" maxW="400px" mx="auto">
      <ModalCloseButton top={{ base: 5, md: 6 }} right={4} />
      <Heading fontSize="24px" textAlign="center">
        {t("Upgrade Your Account")}
      </Heading>
      <GenericAlert
        type="success"
        isLoading={false}
        message={t(
          "We recommend upgrading your account before swapping. Upgrading enhances security, enables multi-clause support, and unlocks additional smart account features. It's quick and easy—just one click away!",
        )}
      />

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
        onClick={sendUpgradeSmartAccountTransaction}
        isLoading={isUpgradeWaitinSign || isUpgradeTransactionPending}>
        {t("Upgrade Now")}
      </Button>

      <Button variant="link" colorScheme="primary" w="full" onClick={onClose}>
        {t("Cancel")}
      </Button>
    </VStack>
  )
}
