import { Button, Card, Heading, Image, Stack, Text, Link, useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { SubmitCreatorFormModal } from "../SubmitCreatorFormModal"
import { useRouter } from "next/navigation"

export const CreatorApplicationRejected = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const goToCreatorForm = () => {
    router.push("/apps/creator/new")
  }
  const { onOpen, isOpen, onClose } = useDisclosure()
  return (
    <>
      <Card.Root
        variant={"baseWithBorder"}
        w="full"
        maxW="100%"
        style={{
          backgroundColor: "#FFF3E5",
          borderRadius: "20px",
          border: "2px solid #F29B32",
        }}>
        <Card.Body px={{ base: 5, md: 5 }} py={{ base: 5, md: 5 }}>
          <Stack direction={{ base: "column", md: "row" }} w="full" h="full">
            {/* Left Section: Image, Title, and Description */}
            <Stack direction="row" gap={{ base: 2, md: 2, lg: 4 }} align="center">
              <Image
                src="/assets/mascot/mascot-warning-head.webp"
                alt="logo"
                maxH="100px"
                maxW="100px"
                minW="90px"
                minH="90px"
                borderRadius="9px"
              />

              <Stack w={{ base: "full", md: "90%", lg: "80%" }} align="flex-start" justify="center">
                <Heading fontWeight={700} fontSize={{ base: "15px", md: "15px" }}>
                  {t("Your Creator's NFT application was rejected")}
                </Heading>
                <Text fontSize={{ base: "14px", md: "14px" }} color="#6A6A6A" fontWeight={400}>
                  {t("You're not cleared to receive a Creator's NFT")}
                </Text>
              </Stack>
            </Stack>

            {/* Right Section: Score */}
            <Stack
              direction={{ base: "row", md: "column" }}
              align="center"
              justify="center"
              w={{ base: "100%", md: "30%" }}
              alignSelf="center">
              <Link
                isExternal
                href="https://support.vechain.org/support/home"
                fontSize="14px"
                fontWeight={600}
                color="#004CFC">
                {t("Contact support")}
              </Link>
              <Button
                alignSelf="center"
                fontSize="14px"
                variant="primaryAction"
                borderRadius="full"
                maxW="150px"
                onClick={onOpen}
                px={{ base: 2, md: 5 }}
                w={{ base: "full", md: "auto" }}>
                {t("Apply again")}
              </Button>
            </Stack>
          </Stack>
        </Card.Body>
      </Card.Root>
      <SubmitCreatorFormModal isOpen={isOpen} onClose={onClose} buttonAction={goToCreatorForm} />
    </>
  )
}
