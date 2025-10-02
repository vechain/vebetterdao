import { BaseModal } from "@/components/BaseModal"
import { UseDisclosureProps, VStack, Heading, Button, Flex, SimpleGrid, Text } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { IoGridOutline } from "react-icons/io5"

import { VotingRequirementsList } from "@/app/components/CantVoteCard/CantVoteCard"

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

  return (
    <BaseModal isOpen={doActionModal.open || false} onClose={doActionModal.onClose || (() => {})}>
      <VStack align="stretch" gap="2">
        <Heading size={"2xl"} fontWeight="bold">
          {t("You're not eligible to vote yet.")}
        </Heading>
        <Text textStyle="xl">{t("To be able to vote on the next round’s allocations and proposals")}</Text>
        <Flex textStyle="lg">
          <VotingRequirementsList />
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4" mt="4">
          <Button w="full" variant="primary" onClick={goToApps}>
            <IoGridOutline />
            {t("Explore apps")}
          </Button>
          <Button
            w="full"
            variant="secondary"
            onClick={() => {
              window.open(VEPASSPORT_DOCS_URL, "_blank")
            }}>
            <UilInfoCircle />
            {t("Know more")}
          </Button>
        </SimpleGrid>
      </VStack>
    </BaseModal>
  )
}
