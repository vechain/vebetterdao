import { useEffect, useMemo } from "react"
import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, ModalHeader, VStack } from "@chakra-ui/react"
import { TransactionStatus } from "@/hooks"

type Props = {
  description: string
  status: TransactionStatus
  error?: string
  onTryAgain?: () => void
  onSuccess?: () => void
}

export const ConfirmTransactionModalContent: React.FC<Props> = ({
  description,
  status,
  error,
  onTryAgain,
  onSuccess,
}) => {
  const statusComponent = useMemo(() => {
    switch (status) {
      case "pending":
        return (
          <Alert
            borderRadius={"xl"}
            status="loading"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="150px">
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Waiting for confirmation
            </AlertTitle>
            <AlertDescription maxWidth="sm">Please confirm the transaction in your wallet.</AlertDescription>
          </Alert>
        )
      case "waitingConfirmation":
        return (
          <Alert
            borderRadius={"xl"}
            status="loading"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="150px">
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Waiting for confirmation
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              We are waiting for your transaction to be confirmed. This may take a few seconds.
            </AlertDescription>
          </Alert>
        )
      case "success":
        return (
          <Alert
            borderRadius={"xl"}
            status="success"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="150px">
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Transaction successful!
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              The transaction has been confirmed. This window will close in a few seconds.
            </AlertDescription>
          </Alert>
        )
      case "error":
        return (
          <>
            <Alert
              borderRadius={"xl"}
              status="error"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="150px">
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Something went wrong!
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                {error ?? "There was an error with your transaction. Please try again."}
              </AlertDescription>
            </Alert>
            {onTryAgain && (
              <Button onClick={onTryAgain} variant="link">
                Try again
              </Button>
            )}
          </>
        )
    }
  }, [status, error])

  //close modal after 3 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (status === "success") {
      timeout = setTimeout(() => {
        onSuccess?.()
      }, 3000)
    }
    return () => {
      clearTimeout(timeout)
    }
  }, [status, onSuccess])

  return (
    <>
      <ModalHeader>{description}</ModalHeader>
      <VStack alignSelf={"center"} h="full" justify={"center"} spacing={4}>
        {statusComponent}
      </VStack>
    </>
  )
}
