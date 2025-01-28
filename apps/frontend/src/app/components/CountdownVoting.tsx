import { useCurrentAllocationsRoundId, useAllocationsRound } from "@/api"
import React, { useEffect, useState } from "react"
import {
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Image,
  Box,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  ModalCloseButton,
} from "@chakra-ui/react"
import { FiPlusCircle } from "react-icons/fi"
import { Trans } from "react-i18next"
import { t } from "i18next"

export const CountdownVoting = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: allocationRound } = useAllocationsRound(currentRoundId)

  const estimatedEndTimestamp = allocationRound?.voteEndTimestamp?.valueOf()
  const [timeLeft, setTimeLeft] = useState<number>(estimatedEndTimestamp ? estimatedEndTimestamp - Date.now() : 0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!timeLeft) return

      const newTimeLeft = timeLeft - 1000

      if (newTimeLeft <= 0) {
        setTimeLeft(0)
        clearInterval(interval)
      } else {
        setTimeLeft(newTimeLeft)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft])
  const getFormattedTime = (milliseconds: number | undefined) => {
    if (!milliseconds) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

    let total_seconds = Math.floor(milliseconds / 1000)
    let total_minutes = Math.floor(total_seconds / 60)
    let total_hours = Math.floor(total_minutes / 60)
    let days = Math.floor(total_hours / 24)

    let seconds = total_seconds % 60
    let minutes = total_minutes % 60
    let hours = total_hours % 24

    return { days, hours, minutes, seconds }
  }
  const { days, hours, minutes, seconds } = getFormattedTime(timeLeft)

  const isNearEnd = timeLeft <= 3600000
  const isNearEndColor = isNearEnd ? "#D23F63" : "#373edf"
  const { isOpen, onOpen, onClose } = useDisclosure()

  const LINKTODOCS = () => {
    window.open("https://docs.vebetterdao.org/vebetterdao/b3tr-and-vot3-tokens", "_blank")
  }

  return (
    <Card w={"full"} variant={"baseWithBorder"}>
      <CardBody>
        <HStack w="full" justify={"space-between"} mb={4}>
          <Heading size="md">{t("Remaining Time")}</Heading>
          <Icon as={FiPlusCircle} color="rgba(0, 76, 252, 1)" position={"relative"} onClick={onOpen} />
          {isOpen && (
            <Modal isOpen={isOpen} onClose={onClose} isCentered size={"xl"}>
              <ModalOverlay />
              <ModalContent rounded={"20px"}>
                <ModalHeader>{t("How to VOT3 ⚖️?")}</ModalHeader>
                <ModalCloseButton />
                <ModalBody alignItems={"center"}>
                  <VStack alignItems={"center"}>
                    <HStack
                      w={"full"}
                      h={"full"}
                      justifyContent={"space-between"}
                      alignItems={"flex-start"}
                      gap={[2, 2, 4]}>
                      <VStack
                        w="full"
                        h="full"
                        alignItems={"center"}
                        justifyContent="space-between"
                        p={2}
                        _hover={{
                          border: "1px solid #004cfc",
                          transform: "scale(1.02)",
                          transition: "all 0.2s ease-in-out",
                        }}
                        bg={"#f7f7f7"}
                        borderRadius={"9px"}>
                        <Box boxSize={"150px"} p={2}>
                          <Image src="/images/b3tr-to-vot3.svg" alt="B3TR to VOT3" />
                        </Box>
                        <Box w="full" h="full" p={2}>
                          <Trans
                            textAlign={"center"}
                            i18nKey="<bold>Convert</bold> your B3TR to VOT3"
                            components={{
                              bold: <Text as="span" fontWeight={"800"} />,
                            }}
                            t={t}
                          />
                        </Box>
                      </VStack>

                      <VStack
                        w="full"
                        h="full"
                        alignItems={"center"}
                        justifyContent="space-between"
                        p={2}
                        _hover={{
                          border: "1px solid #004cfc",
                          transform: "scale(1.02)",
                          transition: "all 0.2s ease-in-out",
                        }}
                        bg={"#f7f7f7"}
                        borderRadius={"9px"}>
                        <Box boxSize={"150px"} p={2}>
                          <Image boxSize={"100px"} src="/images/vote-icon.png" alt="Cast your vote" />
                        </Box>

                        <Box justifyContent={"center"} w="full" h="full" p={2}>
                          <Trans
                            textAlign={"center"}
                            i18nKey="<bold>Cast</bold> your vote to your favorite app"
                            components={{
                              bold: <Text as="span" fontWeight={"800"} />,
                            }}
                            t={t}
                          />
                        </Box>
                      </VStack>

                      <VStack
                        w="full"
                        h="full"
                        alignItems={"center"}
                        justifyContent="space-between"
                        p={2}
                        _hover={{
                          border: "1px solid #004cfc",
                          transform: "scale(1.02)",
                          transition: "all 0.2s ease-in-out",
                        }}
                        bg={"#f7f7f7"}
                        borderRadius={"9px"}>
                        <Box boxSize={"150px"} p={2}>
                          <Image src="/images/claim-b3tr-icon.png" alt="Receive your rewards" />
                        </Box>
                        <Box justifyContent={"center"} p={2}>
                          <Trans
                            textAlign={"center"}
                            i18nKey="<bold>Claim</bold> your rewards"
                            components={{
                              bold: <Text as="span" fontWeight={"800"} />,
                            }}
                            t={t}
                          />
                        </Box>
                      </VStack>
                    </HStack>

                    <Link as="span" fontWeight="bold" cursor={"pointer"} onClick={LINKTODOCS}>
                      {t("Learn more")}
                    </Link>
                  </VStack>
                </ModalBody>
                <ModalFooter></ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </HStack>
        <HStack spacing={4} justify={"space-between"} p={4} borderRadius={"10px"} borderColor={"#F2F2F2"}>
          <VStack textAlign={"center"} fontSize={"2rem"} color={"#333"}>
            <Heading color={isNearEndColor}>{days}</Heading>
            <Text fontSize={"1rem"} color={isNearEnd ? "linear-gradient(to right, blue, red)" : "#6A6A6A"}>
              {t("Days")}
            </Text>
          </VStack>

          <VStack textAlign={"center"} fontSize={"2rem"} color={"#333"}>
            <Heading color={isNearEndColor}>{hours}</Heading>
            <Text fontSize={"1rem"} color={"#6A6A6A"}>
              {t("Hours")}
            </Text>
          </VStack>

          <VStack textAlign={"center"} fontSize={"2rem"} color={"#333"}>
            <Heading color={isNearEndColor}>{minutes}</Heading>
            <Text fontSize={"1rem"} color={"#6A6A6A"}>
              {t("Minutes")}
            </Text>
          </VStack>

          <VStack textAlign={"center"} fontSize={"2rem"} color={"#333"}>
            <Heading color={isNearEndColor}>{seconds}</Heading>
            <Text fontSize={"1rem"} color={"#6A6A6A"}>
              {t("Seconds")}
            </Text>
          </VStack>
        </HStack>

        <Text textAlign={"center"} color={"#6A6A6A"}>
          {t("Vote your favorite app before the round ends!")}
        </Text>
      </CardBody>
    </Card>
  )
}
