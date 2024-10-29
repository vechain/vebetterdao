import { useIsAppUnendorsed, useAppEndorsementScore, useAppEndorsers } from "@/api"
import { EndorsementInfo } from "./EndorsementInfo"
import { EndorsementHistory } from "./EndorsementHistory"
import { useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"

import { VStack, HStack, Text, Stack, Image, Heading, Box, Center, Divider, Show } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { BaseModal } from "@/components/BaseModal"

type Props = {
  isOpen: boolean
  onClose: () => void
  appId: string
}

export const AppEndorsementInfoCardModal = ({ isOpen, onClose, appId }: Props) => {
  const { t } = useTranslation()
  const { data: isUnendorsed } = useIsAppUnendorsed(appId)
  const { data: endorsementScore } = useAppEndorsementScore(appId)
  const { data: endorsers } = useAppEndorsers(appId)
  const { data: endorsementEvents } = useAppEndorsedEvents({ appId })

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      modalProps={{
        size: "6xl",
      }}>
      <VStack spacing={6} align="flex-start" w="full">
        <Heading fontSize={"24px"}> {t("X-Node Endorsement")}</Heading>

        <Stack direction={["column", "column", "row"]} w={"full"} alignItems={"stretch"} spacing={5}>
          <VStack flex={1.5} h="full" maxH={["auto", "auto", "50vh"]} minH={["auto", "auto", "50vh"]} spacing={4}>
            <HStack w="full" justify="space-between">
              <Box>
                <Text fontWeight="400" fontSize="14px">
                  {t("Current score")}
                </Text>
                <Heading fontSize={"24px"} fontWeight="700" color="#444AD1">
                  {endorsementScore}
                </Heading>
              </Box>

              <Box>
                <Text fontWeight="400" fontSize="14px">
                  {t("Users endorsing")}
                </Text>
                <Heading fontSize={"24px"} fontWeight="700" color="#444AD1">
                  {endorsers?.length}
                </Heading>
              </Box>

              <Box>
                <Text fontWeight="400" fontSize="14px">
                  {t("Status")}
                </Text>
                <Heading fontSize={"24px"} fontWeight="700" color={isUnendorsed ? "#C84968" : "#3DBA67"}>
                  {isUnendorsed ? t("Not endorsed") : t("Endorsed")}
                </Heading>
              </Box>
            </HStack>

            <Show below="md">
              <Divider w="full" />
            </Show>

            <VStack
              display={"flex"}
              bg="#FAFAFA"
              justify={"space-between"}
              rounded={"16px"}
              p={[0, 0, 4]}
              spacing={4}
              w={"full"}
              height={["auto", "auto", "40vh"]}
              overflowY="auto">
              <Heading fontWeight="700" fontSize="20px" alignSelf="flex-start">
                {t("Endorsers")}
              </Heading>

              {endorsers && endorsers.length > 0 ? (
                <VStack flex={1} w="full" overflowY="auto" h="full" spacing={2}>
                  {endorsers
                    .slice()
                    .reverse()
                    .map((endorser, index) => (
                      <EndorsementInfo key={index} appId={appId} endorserAddress={endorser} />
                    ))}
                </VStack>
              ) : (
                <Center w="full" h="full">
                  <Image src="/images/nothing-to-show-endorsement.svg" alt="No endorsement" />
                  <Text fontSize="14px" color="#6A6A6A">
                    {t("There is nothing to show here !")}
                  </Text>
                </Center>
              )}
            </VStack>
          </VStack>

          <Show below="md">
            <Divider w="full" />
          </Show>

          <VStack
            bg="#FAFAFA"
            flex={1}
            p={[0, 0, 4]}
            rounded={"16px"}
            justify={"space-between"}
            overflowY="auto"
            minHeight={["auto", "auto", "50vh"]}
            maxH={["auto", "auto", "50vh"]}>
            <Heading fontWeight="700" fontSize="20px" alignSelf={"flex-start"}>
              {t("Endorsement history")}
            </Heading>

            {endorsementEvents && endorsementEvents.length > 0 ? (
              <VStack flex={1} w="full" overflowY="auto" h="full">
                {endorsementEvents.map((endorsementEvent, index) => (
                  <EndorsementHistory key={index} event={endorsementEvent} />
                ))}
              </VStack>
            ) : (
              <Center w="full" h="full">
                <Image src="/images/nothing-to-show-endorsement.svg" alt="No endorsement" />
                <Text fontSize="14px" color="#6A6A6A">
                  {t("There is nothing to show here !")}
                </Text>
              </Center>
            )}
          </VStack>
        </Stack>
      </VStack>
    </BaseModal>
  )
}
