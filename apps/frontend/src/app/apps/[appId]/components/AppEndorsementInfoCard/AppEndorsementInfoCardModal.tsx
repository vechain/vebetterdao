import { useIsAppUnendorsed, useAppEndorsementScore, useAppEndorsers } from "@/api"
import { EndorsementInfo } from "./EndorsementInfo"
import { EndorsementHistory } from "./EndorsementHistory"
import { useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { UnendorseAppModal } from "@/app/apps/components/UnendorseAppModal"
import { AppEndorsersIcon } from "./AppEndorsersSection"

import { normalize } from "@repo/utils/HexUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"

import { UilCheckCircle, UilExclamationCircle, UilTrash } from "@iconscout/react-unicons"
import {
  VStack,
  HStack,
  Text,
  Stack,
  Image,
  Heading,
  Box,
  Center,
  Divider,
  Show,
  Button,
  useDisclosure,
} from "@chakra-ui/react"
import { useTranslation, Trans } from "react-i18next"
import { useState } from "react"

import { BaseModal } from "@/components/BaseModal"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBreakpoints } from "@/hooks"

type Props = {
  isOpen: boolean
  onClose: () => void
  appId: string
  userScore: number | null
}

export const AppEndorsementInfoCardModal = ({ isOpen, onClose, appId, userScore }: Props) => {
  const { t } = useTranslation()

  const { account } = useWallet()
  const { data: isUnendorsed } = useIsAppUnendorsed(appId)
  const { data: endorsementScore } = useAppEndorsementScore(appId)
  const { data: endorsers } = useAppEndorsers(appId)
  const { data: endorsementEvents } = useAppEndorsedEvents({ appId })

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const {
    isOpen: isUnendorsementModalOpen,
    onOpen: onOpenUnendorsementModal,
    onClose: onCloseUnendorsementModal,
  } = useDisclosure()
  const handleCancelClick = () => {
    setIsConfirmOpen(false)
  }

  const { isMobile } = useBreakpoints()

  const TagBox = () => (
    <Box>
      {isUnendorsed ? (
        <HStack bg="#FFF3E5" p={"6px 10px"} rounded="9px" justifyContent={"center"}>
          <UilExclamationCircle color="#AF5F00" size={"1rem"} />
          <Text color="#AF5F00" fontWeight={600} fontSize="sm">
            {t("Looking for endorsement")}
          </Text>
        </HStack>
      ) : (
        <HStack bg="#E9FDF1" p={"6px 10px"} rounded="9px" justifyContent={"center"}>
          <UilCheckCircle color="#3DBA67" size={"1rem"} />
          <Text color="#3DBA67" fontWeight={600} fontSize="sm">
            {t("Endorsed and active")}
          </Text>
        </HStack>
      )}
    </Box>
  )

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
                <Heading fontSize={"24px"} fontWeight="700" color="#444AD1">
                  {endorsementScore}
                </Heading>
                <Text fontWeight="400" fontSize="14px">
                  {t("Current score")}
                </Text>
              </Box>
              {userScore != null && (
                <Box>
                  <Heading fontSize={"24px"} fontWeight="700" color="#444AD1">
                    {userScore}
                  </Heading>
                  <Text fontWeight="400" fontSize="14px">
                    {t("Your score")}
                  </Text>
                </Box>
              )}

              <Box>
                <HStack>
                  <AppEndorsersIcon endorsers={endorsers ?? []} />
                  <Heading fontSize={"24px"} fontWeight="700" color="#444AD1">
                    {endorsers?.length}
                  </Heading>{" "}
                </HStack>
                <Text fontWeight="400" fontSize="14px">
                  {t("Users endorsing")}
                </Text>
              </Box>

              {!isMobile && (
                <Box>
                  <TagBox />
                </Box>
              )}
            </HStack>

            {isMobile && (
              <Box w={"full"} alignItems={"center"}>
                <TagBox />
              </Box>
            )}

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
                  {account && isConfirmOpen && endorsers.includes(normalize(account)) && (
                    <VStack
                      border={"1px solid #EC9BAF"}
                      p={4}
                      mx={2}
                      borderRadius={"16px"}
                      bg={"white"}
                      alignItems="end">
                      <Text mb={4} maxW="full">
                        <Trans
                          i18nKey="<bold>Are you sure?</bold> If you remove {{endorsedAddress}} endorsement you'll lose {{value}} pts and your app will not more active"
                          values={{ endorsedAddress: humanAddress(normalize(account), 6, 3), value: userScore }}
                          components={{ bold: <Text as="span" fontWeight={"600"} /> }}
                        />
                      </Text>
                      <HStack>
                        <Button borderRadius="16px" bg="#C84968" color={"white"} onClick={onOpenUnendorsementModal}>
                          <UilTrash />
                          {t("Remove")}
                        </Button>
                        <Button borderRadius="16px" bg="#E0E9FE" color={"#004CFC"} onClick={handleCancelClick}>
                          {t("Cancel")}
                        </Button>
                      </HStack>
                    </VStack>
                  )}

                  {endorsers
                    .slice()
                    .reverse()
                    .map((endorser, index) => (
                      <EndorsementInfo
                        key={index}
                        appId={appId}
                        endorserAddress={endorser}
                        setIsConfirmOpen={setIsConfirmOpen}
                      />
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
      {isUnendorsementModalOpen && (
        <UnendorseAppModal isOpen={isUnendorsementModalOpen} onClose={onCloseUnendorsementModal} />
      )}
    </BaseModal>
  )
}
