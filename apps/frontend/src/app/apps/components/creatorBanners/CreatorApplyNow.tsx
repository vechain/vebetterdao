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
        variant={"baseWithBorder"}
        w="full"
        maxW="100%"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='20' ry='20' stroke='%239AE14DFF' stroke-width='4' stroke-dasharray='16%2c 18%2c 13%2c 24' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`,
          borderRadius: "20px",
          borderColor: "white",
        }}>
        <Card.Body p={0}>
          <HStack w="full" h="full">
            {/* Left Section: Image full height when mobile */}
            {isMobile && (
              <Box w={"120px"} h={"full"} overflow="hidden" position="relative" borderRadius="9px">
                <Image
                  src="/assets/mascot/mascot-welcoming.webp"
                  alt="mascot-welcoming"
                  position="absolute"
                  transform={"translate(-15%, 70%) rotate(30deg) scale(2.5)"}
                  objectFit="contain"
                  borderRadius="9px"
                />
              </Box>
            )}

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
                  <Heading fontWeight={700} fontSize={"17px"}>
                    {t("Do you have a dApp to join the VeBetter DAO ecosystem?")}
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
                  alignSelf="center"
                  fontSize={{ base: "14px" }}
                  variant="secondary"
                  borderRadius="full"
                  onClick={onOpen}
                  _hover={{ opacity: "0.6", transition: "all 0.3s" }}
                  w={{ base: "80%", md: "auto" }}>
                  <UilPlus />
                  {t("Apply now")}
                </Button>
              </Stack>
            </Stack>
          </HStack>
        </Card.Body>
      </Card.Root>
      <SubmitCreatorFormModal isOpen={isOpen} onClose={onClose} buttonAction={goToCreatorForm} />
    </>
  )
}
