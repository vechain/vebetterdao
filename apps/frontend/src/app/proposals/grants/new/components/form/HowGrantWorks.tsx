import { Card, CardBody, CardHeader, Heading, Text, VStack, List, Image } from "@chakra-ui/react"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { Trans, useTranslation } from "react-i18next"
import { useState } from "react"

export const HowGrantWorks = () => {
  const { t } = useTranslation()
  const [show4thStep, setShow4thStep] = useState(false)

  const onLearnMoreClick = () => {
    setShow4thStep(true)
  }

  return (
    <Card.Root variant="base">
      <CardHeader pb={3}>
        <Heading size="md">{t("How grant application works?")}</Heading>
      </CardHeader>
      <CardBody>
        <VStack borderBottom="1px solid #D5D5D5" pb={8} gap={5} align="stretch">
          <Text fontWeight="bold">{t("1. Submit your application")}</Text>
          <List.Root gap={2} color="#6A6A6A" listStyle="disc">
            <List.Item>
              <Text>
                {t(
                  "Fill out the form with: project description, funding amount, milestones describing what you'll deliver and when.",
                )}
              </Text>
            </List.Item>
          </List.Root>
        </VStack>

        <VStack borderBottom="1px solid #D5D5D5" pb={8} pt={4} gap={5} align="stretch">
          <Text fontWeight="bold">{t("2. Get early support from the community")}</Text>
          <List.Root gap={2} color="#6A6A6A" listStyle="disc">
            <List.Item>
              <Text>
                {t(
                  "Your Grant needs early backing from the community and must receive a minimum deposit of over 3.5M VOT3 tokens within 1 week (1 round) of submission to proceed.",
                )}
              </Text>
            </List.Item>
            <List.Item>
              <Text>
                {t(
                  "If the minimum deposit threshold is not met within the timeframe, the proposal is automatically cancelled.",
                )}
              </Text>
            </List.Item>
            <List.Item>
              <Text>{t("Once it hits the threshold, it moves forward.")}</Text>
            </List.Item>
          </List.Root>
        </VStack>

        <VStack
          pt={4}
          gap={5}
          align="stretch"
          borderBottom={show4thStep ? "1px solid #D5D5D5" : "none"}
          pb={show4thStep ? 8 : 0}>
          <Text fontWeight="bold">{t("3. Get final approval from the community")}</Text>
          <List.Root gap={2} color="#6A6A6A" listStyle="disc">
            <List.Item>
              <Text as="span">
                <Trans
                  i18nKey="The community and VeChain Foundation express support as <thumbsUp/>, <thumbsDown/>, <abstain/>"
                  components={{
                    thumbsUp: (
                      <UilThumbsUp
                        style={{ display: "inline", verticalAlign: "middle", marginLeft: "2px", marginRight: "2px" }}
                        size={18}
                      />
                    ),
                    thumbsDown: (
                      <UilThumbsDown
                        style={{ display: "inline", verticalAlign: "middle", marginLeft: "2px", marginRight: "2px" }}
                        size={18}
                      />
                    ),
                    abstain: (
                      <Image
                        src={"/assets/icons/abstain.svg"}
                        alt="abstain"
                        boxSize="18px"
                        display="inline"
                        verticalAlign="middle"
                        mx={1}
                      />
                    ),
                  }}
                />
              </Text>
            </List.Item>
            <List.Item>
              <Text>{t("If the Grant is approved, you will receive funds.")}</Text>
            </List.Item>
          </List.Root>
        </VStack>
        {show4thStep && (
          <VStack align="stretch" pt={4} gap={5}>
            <Text fontWeight="bold">{t("4. Receive funds and start developing")}</Text>
            <List.Root gap={2} color="#6A6A6A" listStyle="disc">
              <List.Item>
                <Text>{t("Funds are released milestone by milestone")}</Text>
              </List.Item>
              <List.Item>
                <Text>{t("Deliver, get reviewed, unlock the next payment — until you complete the project")}</Text>
              </List.Item>
            </List.Root>
          </VStack>
        )}

        {!show4thStep && (
          <Text
            mt={6}
            fontWeight="medium"
            color="#004CFC"
            cursor="pointer"
            onClick={onLearnMoreClick}
            _hover={{ textDecoration: "underline" }}>
            {t("Learn more")}
          </Text>
        )}
      </CardBody>
    </Card.Root>
  )
}
