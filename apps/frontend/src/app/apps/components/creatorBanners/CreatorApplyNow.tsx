import { Box, Button, Card, Heading, HStack, Image, Stack, useDisclosure, useMediaQuery } from "@chakra-ui/react"
import { UilPlus } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { SubmitCreatorFormModal } from "../SubmitCreatorFormModal"

export const CreatorApplyNow = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const goToCreatorForm = () => {
    router.push("/apps/creator/new")
  }
  const { onOpen, open: isOpen, onClose } = useDisclosure()
  const [isMobile] = useMediaQuery(["(max-width: 767px)"])
  return (
    <>
      <Card.Root
        variant="primary"
        w="full"
        maxW="100%"
        rounded="20px"
        backgroundImage={`url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='20' ry='20' stroke='%239AE14DFF' stroke-width='4' stroke-dasharray='16%2c 18%2c 13%2c 24' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`}>
        <Card.Body px={6} py={2} position="relative">
          <Box
            w={{ base: "120px", md: "80px" }}
            h={"full"}
            overflow="hidden"
            position="absolute"
            left="0"
            top="0"
            borderRadius="9px">
            <Image
              src="/assets/mascot/mascot-welcoming.webp"
              alt="mascot-welcoming"
              position="absolute"
              transform={"translate(-15%, 70%) rotate(30deg) scale(2.5)"}
              objectFit="contain"
              borderRadius="9px"
            />
          </Box>
          <Stack direction={{ base: "column", md: "row" }} w="full" h="full" justify={"center"} align={"stretch"}>
            {/* Left Section: Image, Title, and Description */}
            <HStack>
              {!isMobile && (
                <Box w={"80px"} h={"full"} overflow="hidden" position="relative" borderRadius="9px">
                  <Image
                    src="/assets/mascot/mascot-welcoming.webp"
                    alt="mascot-welcoming"
                    position="absolute"
                    transform={"translate(-15%, 50%) rotate(30deg) scale(2.5)"}
                    objectFit="contain"
                    borderRadius="9px"
                  />
                </Box>
              )}

              <Stack
                w={{ base: "full", md: "70%", lg: "80%" }}
                align={{ base: "center", md: "end" }}
                justify={{ base: "center", md: "end" }}
                py={isMobile ? 4 : 2}>
                <Heading fontWeight="bold" size={"lg"}>
                  {t("Do you have an app to join the VeBetter DAO ecosystem?")}
                </Heading>
              </Stack>
            </HStack>

            {/* Right Section: Score */}
            <Stack
              direction={{ base: "column", md: "row" }}
              w={"full"}
              align={"end"}
              justify={"end"}
              px={2}
              py={isMobile ? 4 : 2}>
              <Button
                variant="secondary"
                alignSelf="center"
                textStyle="md"
                fontWeight="semibold"
                borderRadius="full"
                onClick={onOpen}
                w={{ base: "80%", md: "auto" }}>
                <UilPlus />
                {t("Apply now")}
              </Button>
            </Stack>
          </Stack>
        </Card.Body>
      </Card.Root>
      <SubmitCreatorFormModal isOpen={isOpen} onClose={onClose} buttonAction={goToCreatorForm} />
    </>
  )
}
