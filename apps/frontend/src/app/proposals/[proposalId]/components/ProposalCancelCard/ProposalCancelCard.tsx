import { Button, Card, Heading, Text, VStack } from "@chakra-ui/react"
import { UilBan } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const ProposalCancelCard = ({ onOpen }: { onOpen: () => void }) => {
  const { t } = useTranslation()
  return (
    <Card.Root variant="baseWithBorder">
      <Card.Body>
        <VStack alignItems="stretch" gap={6}>
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("Cancel proposal")}
          </Heading>
          <Text fontSize={"14px"}>
            {t(
              "If you cancel the proposal it will not be voted on in the next round. After the round starts, you will no longer be able to cancel it.",
            )}
          </Text>
          <Button variant={"dangerFilledTonal"} onClick={onOpen}>
            <UilBan size="18px" />
            {t("Cancel this proposal")}
          </Button>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
