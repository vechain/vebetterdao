import { Card, CardBody, CardHeader, Heading, Icon, List, Separator, Text, VStack } from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"

import AbstainIcon from "@/components/Icons/svg/abstain.svg"
import ThumbsDownIcon from "@/components/Icons/svg/thumbs-down.svg"
import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"

export const HowGrantWorks = () => {
  const { t } = useTranslation()
  const infoList = [
    {
      heading: t("Submit Grant application"),
      description: t("Describe your project, requested funds, and delivery milestones."),
    },
    {
      heading: t("Get early support"),
      description: t(
        "To move forward, reach at least 3.5M VOT3 in deposits within 1 week from the community. Otherwise, the grant will be cancelled automatically.",
      ),
    },
    {
      heading: t("Get final approval"),
      description: (
        <Trans
          i18nKey={
            "The community and VeChain Foundation review and vote to approve or reject your grant <thumbsUp/>, <thumbsDown/> and <abstain/>"
          }
          components={{
            thumbsUp: <Icon as={ThumbsUpIcon} boxSize={4} />,
            thumbsDown: <Icon as={ThumbsDownIcon} boxSize={4} />,
            abstain: <Icon as={AbstainIcon} boxSize={4} />,
          }}
        />
      ),
    },
    {
      heading: t("Receive funds"),
      description: t("If approved, your grant is funded from the DAO Treasury."),
    },
  ]
  return (
    <Card.Root variant="primary">
      <CardHeader>
        <Heading size="lg">{t("How grant application works?")}</Heading>
      </CardHeader>
      <CardBody>
        <List.Root gap={3}>
          {infoList.map((item, index) => (
            <List.Item key={item.heading} listStyle="none">
              <VStack align="stretch" gap={2} flex={1}>
                <Heading size="md" color="text.default">
                  {`${index + 1}. ${item.heading}`}
                </Heading>
                <Text color="text.subtle" textStyle="sm">
                  {item.description}
                </Text>
              </VStack>
              {index !== infoList.length - 1 && <Separator my={3} w="full" color="gray.200" />}
            </List.Item>
          ))}
        </List.Root>
      </CardBody>
    </Card.Root>
  )
}
