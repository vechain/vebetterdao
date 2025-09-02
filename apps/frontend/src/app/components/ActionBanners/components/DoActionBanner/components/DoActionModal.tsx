import { useUserScore } from "@/api"
import { BaseModal } from "@/components/BaseModal"
import { useMissingActionsLabel } from "@/hooks"
import { UseDisclosureProps, Card, VStack, Flex, Text, Heading, Button, Image } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { IoGridOutline } from "react-icons/io5"

const VEPASSPORT_DOCS_URL = "https://docs.vebetterdao.org/vepassport/vepassport"

type Props = {
  doActionModal: UseDisclosureProps
}

export const DoActionModal = ({ doActionModal }: Props) => {
  const { t } = useTranslation()

  const router = useRouter()
  const goToApps = useCallback(() => {
    router.push("/apps")
  }, [router])

  const { scorePercentage, missingActions, isUserDelegatee, isLoading } = useUserScore()

  const missingActionsLabel = useMissingActionsLabel({ missingActions, isUserDelegatee })

  if (isLoading) return null

  return (
    <BaseModal isOpen={doActionModal.open || false} onClose={doActionModal.onClose || (() => {})}>
      <VStack align="stretch" gap={4}>
        <Card.Root bg="#FFD979" borderRadius="xl">
          <Card.Body pb={2} position="relative" overflow="hidden" borderRadius="xl">
            <Image
              src="/assets/backgrounds/cloud-background-orange.webp"
              alt="cloud-background-orange"
              position="absolute"
              right={"-50%"}
              top={"-50%"}
            />
            <VStack align="stretch" zIndex={1} position="relative">
              <Flex
                bg="white"
                justify="center"
                align="center"
                p={2}
                borderRadius="base"
                position="relative"
                overflow={"hidden"}>
                <Flex position="absolute" top={0} left={0} bottom={0} w={`${scorePercentage}%`} bg="#F29B32"></Flex>
                <Text textStyle={"xs"} zIndex={1}>
                  {t("YOU CANNOT VOTE YET")}
                </Text>
              </Flex>
              <Flex justify="flex-end">
                <Text color="text.subtle" textStyle="xs">
                  {missingActionsLabel.short}
                </Text>
              </Flex>
            </VStack>
          </Card.Body>
        </Card.Root>
        <Heading size="2xl">{missingActionsLabel.long}</Heading>
        <Text color="text.subtle">
          {t(
            "To be able to vote on the next round’s allocations and proposals, you have to do Better actions in the applications. Be more sustainable and earn tokens!",
          )}
        </Text>
        <Button variant="primaryAction" onClick={goToApps}>
          <IoGridOutline />
          {t("Explore apps")}
        </Button>
        <Button
          variant="primarySubtle"
          _hover={{ textDecoration: "none" }}
          onClick={() => {
            window.open(VEPASSPORT_DOCS_URL, "_blank")
          }}>
          <UilInfoCircle />
          {t("Know more")}
        </Button>
      </VStack>
    </BaseModal>
  )
}
