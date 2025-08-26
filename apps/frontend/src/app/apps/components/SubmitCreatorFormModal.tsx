import { VStack, Heading, Text, Button } from "@chakra-ui/react"
import { t } from "i18next"
import { BaseModal } from "@/components/BaseModal"

type Props = {
  isOpen: boolean
  onClose: () => void
  buttonAction: () => void
}

export const SubmitCreatorFormModal = ({ isOpen, onClose, buttonAction }: Props) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} modalProps={{ size: "md" }}>
      <VStack gap={6} align="flex-start" w="full" p={3}>
        <Heading fontSize={"24px"}>{t("Get a Creator’s NFT to submit your app to VeBetterDAO!")}</Heading>

        <Text
          as="span"
          textTransform="none"
          fontWeight="normal"
          whiteSpace="normal"
          wordBreak="break-word"
          flexWrap="wrap"
          fontSize="16px"
          color={"#6A6A6A"}>
          {t(
            "Complete our Creator form to verify your app and receive a Creator’s NFT to be able to submit your app to our ecosystem!",
          )}
        </Text>

        <Button variant="primaryAction" w={"full"} onClick={buttonAction}>
          {t("Submit Creator Form")}
        </Button>
      </VStack>
    </BaseModal>
  )
}
