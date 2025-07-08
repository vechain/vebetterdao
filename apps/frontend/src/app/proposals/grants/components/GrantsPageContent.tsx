/* eslint-disable react/no-array-index-key */
import { useTranslation } from "react-i18next"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { VStack, HStack, Heading, UnorderedList, ListItem, Link, Icon } from "@chakra-ui/react"
import { useMemo } from "react"
import { GrantsStepsCard } from "./GrantsStepCard"

enum GrantsStep {
  SUBMIT_APPLICATION = "SUBMIT_APPLICATION",
  GET_SUPPORT = "GET_SUPPORT",
  COMMUNITY_VOTE = "COMMUNITY_VOTE",
  RECEIVE_FUNDS = "RECEIVE_FUNDS",
}

export const GrantsPageContent = () => {
  const { t } = useTranslation()
  const stepsArray = useMemo(
    () => [
      {
        key: GrantsStep.SUBMIT_APPLICATION,
        content: (
          <VStack alignItems="flex-start" w="full">
            <Heading size="md" textStyle="heading">
              {t("1. Submit Grant application")}
            </Heading>
            <UnorderedList pl={2} fontSize="sm">
              <ListItem>
                {t(
                  "Fill out the form with: project description, funding amount, milestones describing what you'll deliver and when.",
                )}
              </ListItem>
              <ListItem>{t("Once submitted, your Grant proposal becomes visible to the community.")}</ListItem>
            </UnorderedList>
          </VStack>
        ),
        title: t("How to apply for Grant?"),
        image: "/assets/images/grants/step-1.png",
      },
      {
        key: GrantsStep.GET_SUPPORT,
        content: (
          <VStack alignItems="flex-start" w="full">
            <Heading size="md" textStyle="heading">
              {t("2. Get support from the community")}
            </Heading>
            <UnorderedList pl={2} fontSize="sm">
              <ListItem>{t("Your Grant needs 3.5M VOT3 deposited within 1 week to move forward.")}</ListItem>
              <ListItem>{t("If it doesn't reach that , it's cancelled automatically.")}</ListItem>
            </UnorderedList>
          </VStack>
        ),
        title: t("How to apply for Grant?"),
        image: "/assets/images/grants/step-2.png",
      },
      {
        key: GrantsStep.COMMUNITY_VOTE,
        content: (
          <VStack alignItems="flex-start" w="full">
            <Heading size="md" textStyle="heading">
              {t("3. Get final review from the community")}
            </Heading>
            <UnorderedList pl={2} fontSize="sm">
              <ListItem>{t("The community express support as Likes, Dislikes and Abstains")}</ListItem>
              <ListItem>{t("If the Grant is approved, you will receive funds")}</ListItem>
            </UnorderedList>
          </VStack>
        ),
        title: t("How to apply for Grant?"),
        image: "/assets/images/grants/step-3.png",
      },
      {
        key: GrantsStep.RECEIVE_FUNDS,
        content: (
          <VStack alignItems="flex-start" w="full">
            <Heading size="md" textStyle="heading">
              {t("4. Receive funds and start developing")}
            </Heading>
            <UnorderedList pl={2} fontSize="sm">
              <ListItem>{t("Funds are released milestone by milestone")}</ListItem>
              <ListItem>
                {t("Deliver, get reviewed, unlock the next payment — until you complete the project")}
              </ListItem>
            </UnorderedList>
          </VStack>
        ),
        title: t("How to apply for Grant?"),
        image: "/assets/images/grants/step-4.png",
      },
    ],
    [t],
  )
  return (
    <VStack w={"full"} spacing={4}>
      <HStack alignItems={"center"} textAlign={"center"} w="full">
        <Heading as="h1" size="xl">
          {t("Grants")}
        </Heading>
        <Link display="inline-flex" alignItems="center" fontWeight={500} gap={1} color="primary.500" fontSize="md">
          <Icon as={UilInfoCircle} boxSize={4} />
          {t("More info")}
        </Link>
      </HStack>
      <GrantsStepsCard steps={stepsArray} />
    </VStack>
  )
}
