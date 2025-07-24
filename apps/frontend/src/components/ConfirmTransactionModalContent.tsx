import { ReactNode, useEffect, useMemo } from "react"
import { Alert, Button, Dialog, VStack } from "@chakra-ui/react"
import { TransactionStatus } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

type Props = {
  description: ReactNode
  status: TransactionStatus
  error?: string
  onTryAgain?: () => void
  onSuccess?: () => void
  onSuccessTimeout?: number
}

export const ConfirmTransactionModalContent: React.FC<Props> = ({
  description,
  status,
  error,
  onTryAgain,
  onSuccess,
  onSuccessTimeout = 1500,
}) => {
  const { t } = useTranslation()
  const statusComponent = useMemo(() => {
    switch (status) {
      case "pending":
        return (
          <Alert.Root
            borderRadius={"xl"}
            status="info"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="150px">
            <Alert.Indicator boxSize="40px" mr={0} />
            <Alert.Title mt={4} mb={1} fontSize="lg">
              {t("Waiting for confirmation")}
            </Alert.Title>
            <Alert.Description maxWidth="sm">{t("Please confirm the transaction in your wallet.")}</Alert.Description>
          </Alert.Root>
        )
      case "waitingConfirmation":
        return (
          <Alert.Root
            borderRadius={"xl"}
            status="info"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="150px">
            <Alert.Indicator boxSize="40px" mr={0} />
            <Alert.Title mt={4} mb={1} fontSize="lg">
              {t("Waiting for confirmation")}
            </Alert.Title>
            <Alert.Description maxWidth="sm">
              {t("We are waiting for your transaction to be confirmed. This may take a few seconds.")}
            </Alert.Description>
          </Alert.Root>
        )
      case "success":
        return (
          <Alert.Root
            borderRadius={"xl"}
            status="success"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="150px">
            <Alert.Indicator boxSize="40px" mr={0} />
            <Alert.Title mt={4} mb={1} fontSize="lg">
              {t("Transaction successful!")}
            </Alert.Title>
            <Alert.Description maxWidth="sm">
              {t("The transaction has been confirmed. This window will close in a few seconds.")}
            </Alert.Description>
          </Alert.Root>
        )
      case "error":
        return (
          <>
            <Alert.Root
              borderRadius={"xl"}
              status="error"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="150px">
              <Alert.Indicator boxSize="40px" mr={0} />
              <Alert.Title mt={4} mb={1} fontSize="lg">
                {t("Something went wrong!")}
              </Alert.Title>
              <Alert.Description maxWidth="sm">
                {error ?? "There was an error with your transaction. Please try again."}
              </Alert.Description>
            </Alert.Root>
            {onTryAgain && (
              <Button onClick={onTryAgain} variant="link">
                {t("Try again")}
              </Button>
            )}
          </>
        )
    }
  }, [status, t, error, onTryAgain])

  //close modal after 3 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (status === "success") {
      timeout = setTimeout(() => {
        onSuccess?.()
      }, onSuccessTimeout)
    }
    return () => {
      clearTimeout(timeout)
    }
  }, [status, onSuccess, onSuccessTimeout])

  return (
    <>
      <Dialog.Header>{description}</Dialog.Header>
      <Dialog.Body>
        <VStack alignSelf={"center"} h="full" justify={"center"} gap={4}>
          {statusComponent}
        </VStack>
      </Dialog.Body>
    </>
  )
}
