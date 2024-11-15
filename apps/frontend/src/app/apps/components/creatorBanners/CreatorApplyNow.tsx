import { Button, Card, CardBody, Heading, Image, Stack, useDisclosure } from "@chakra-ui/react"
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
  const { onOpen, isOpen, onClose } = useDisclosure()
  return (
    <>
      <Card
        variant={"baseWithBorder"}
        w="full"
        maxW="100%"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='20' ry='20' stroke='%239AE14DFF' stroke-width='4' stroke-dasharray='16%2c 18%2c 13%2c 24' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`,
          borderRadius: "20px",
        }}>
        <CardBody px={{ base: 5, md: 5 }} py={{ base: 5, md: 5 }}>
          <Stack direction={{ base: "column", md: "row" }} w="full" h="full">
            {/* Left Section: Image, Title, and Description */}
            <Stack direction="row" spacing={{ base: 2, md: 2, lg: 4 }} align="center">
              <Image
                src={"images/hand-plant.svg"}
                alt="logo"
                maxH="80px"
                maxW="80px"
                minW="60px"
                minH="60px"
                borderRadius="9px"
              />

              <Stack w={{ base: "full", md: "70%", lg: "80%" }} align="flex-start" justify="center">
                <Heading fontWeight={700} fontSize="17px">
                  {t("Do you have a dApp to join the VeBetter DAO ecosystem?")}
                </Heading>
              </Stack>
            </Stack>

            {/* Right Section: Score */}
            <Stack direction="row" align="center" justify="center" w={{ base: "100%", md: "35%" }} alignSelf="center">
              <Button
                alignSelf="center"
                fontSize={{ base: "14px" }}
                variant="secondary"
                borderRadius="full"
                leftIcon={<UilPlus />}
                onClick={onOpen}
                _hover={{ opacity: "0.6", transition: "all 0.3s" }}
                w={{ base: "full", md: "auto" }}>
                {t("Apply now")}
              </Button>
            </Stack>
          </Stack>
        </CardBody>
      </Card>
      <SubmitCreatorFormModal isOpen={isOpen} onClose={onClose} buttonAction={goToCreatorForm} />
    </>
  )
}
