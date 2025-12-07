import { Card, Icon, Badge, Text, Button } from "@chakra-ui/react"
import type { Meta } from "@storybook/nextjs-vite"
import { Flash } from "iconoir-react"
import { useState } from "react"

import { BaseModal } from "@/components/BaseModal"
import { ErrorModalContent } from "@/components/TransactionModal/ErrorModalContent/ErrorModalContent"
import { LoadingModalContent } from "@/components/TransactionModal/LoadingModalContent/LoadingModalContent"
import { SuccessModalContent } from "@/components/TransactionModal/SuccessModalContent/SuccessModalContent"

const meta: Meta = {
  title: "design-system/components/Modal/Transaction Modal Content",
  parameters: {
    layout: "centered",
  },
}

export default meta

// Loading Modal Content
export const Loading = () => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      showCloseButton={false}
      isCloseable={false}
      modalContentProps={{ maxWidth: "400px" }}
      modalBodyProps={{ p: 6 }}>
      <LoadingModalContent
        title="Waiting for confirmation..."
        description="Confirm the operation in your wallet to complete it"
      />
    </BaseModal>
  )
}

export const LoadingWithCustomDescription = () => {
  const [isOpen, setIsOpen] = useState(true)

  const customDescription = (
    <Card.Root
      variant="subtle"
      p={4}
      bg="bg.secondary"
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      gap="2">
      <Text textStyle="sm" color="text.subtle">
        You voted with
      </Text>
      <Badge
        variant="outline"
        rounded="md"
        size="lg"
        borderWidth="2px"
        borderColor="status.positive.primary"
        color="status.positive.primary"
        px={3}
        py={1}
        textStyle="md">
        <Icon as={Flash} color="status.positive.primary" boxSize="5" />
        125,890
      </Badge>
    </Card.Root>
  )

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      showCloseButton={false}
      isCloseable={false}
      modalContentProps={{ maxWidth: "400px" }}
      modalBodyProps={{ p: 6 }}>
      <LoadingModalContent title="Enabling automation and submitting vote..." description={customDescription} />
    </BaseModal>
  )
}

// Error Modal Content
export const Error = () => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      showCloseButton
      isCloseable
      modalContentProps={{ maxWidth: "400px" }}
      modalBodyProps={{ p: 6 }}>
      <ErrorModalContent title="Error" description="Something went wrong 😕" />
    </BaseModal>
  )
}

export const ErrorWithTryAgain = () => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      showCloseButton
      isCloseable
      modalContentProps={{ maxWidth: "400px" }}
      modalBodyProps={{ p: 6 }}>
      <ErrorModalContent
        title="Transaction Failed"
        description="The transaction could not be completed. Please try again."
        showTryAgainButton
        onTryAgain={async () => {
          setIsOpen(false)
        }}
      />
    </BaseModal>
  )
}

// Success Modal Content
export const Success = () => {
  const [isOpen, setIsOpen] = useState(true)

  const customButton = (
    <Button
      variant="primary"
      alignSelf="center"
      px={8}
      py={2.5}
      textStyle="lg"
      fontWeight="semibold"
      onClick={() => setIsOpen(false)}>
      Back to Home
    </Button>
  )

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      showCloseButton
      isCloseable
      modalContentProps={{ maxWidth: "400px" }}
      modalBodyProps={{ p: 6 }}>
      <SuccessModalContent
        title="Vote successfully submitted!"
        customButton={customButton}
        txId="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        showSocialButtons={true}
        showTransactionDetailsButton={true}
        onClose={() => setIsOpen(false)}
      />
    </BaseModal>
  )
}

export const SuccessWithDescriptionComponent = () => {
  const [isOpen, setIsOpen] = useState(true)

  const votingWeightDescription = (
    <Card.Root
      variant="subtle"
      p={4}
      bg="bg.secondary"
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      gap="2">
      <Text textStyle="sm" color="text.subtle">
        You voted with
      </Text>
      <Badge
        variant="outline"
        rounded="md"
        size="lg"
        borderWidth="2px"
        borderColor="status.positive.primary"
        color="status.positive.primary"
        px={3}
        py={1}
        textStyle="md">
        <Icon as={Flash} color="status.positive.primary" boxSize="5" />
        125,890
      </Badge>
    </Card.Root>
  )

  const customButton = (
    <Button
      variant="primary"
      alignSelf="center"
      px={8}
      py={2.5}
      textStyle="lg"
      fontWeight="semibold"
      onClick={() => setIsOpen(false)}>
      Back to Home
    </Button>
  )

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      showCloseButton
      isCloseable
      modalContentProps={{ maxWidth: "400px" }}
      modalBodyProps={{ p: 6 }}>
      <SuccessModalContent
        title="Vote successfully submitted!"
        description={votingWeightDescription}
        customButton={customButton}
        txId="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        showSocialButtons={false}
        showTransactionDetailsButton={false}
        onClose={() => setIsOpen(false)}
      />
    </BaseModal>
  )
}
