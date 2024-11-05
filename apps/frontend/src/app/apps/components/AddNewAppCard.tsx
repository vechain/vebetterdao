import { Card, CardBody, Image, Heading, Button, useDisclosure, Stack } from "@chakra-ui/react"
import { FaPlus } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { SubmitCreatorFormModal } from "./SubmitCreatorFormModal"

export const AddNewAppCard = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const navigateToCreatorForm = () => {
    return router.push("/apps/creator/new")
  }
  const {
    isOpen: isSubmitCreatorFormModalOpen,
    onOpen: onOpenSubmitCreatorFormModal,
    onClose: onCloseSubmitCreatorFormModal,
  } = useDisclosure()

  return (
    <>
      <Card
        variant={"baseWithBorder"}
        w="full"
        h={"full"}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='20' ry='20' stroke='%239AE14DFF' stroke-width='4' stroke-dasharray='16%2c 18%2c 13%2c 24' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`,
          borderRadius: "20px",
        }}>
        <CardBody>
          <Stack direction={["row", "column", "column"]} h="full" align="center" justify="center" textAlign="left">
            <Image src="/images/hand-plant.svg" boxSize={32} alt="Add new App image" />
            <Stack direction={["column"]} spacing={4} align="center" textAlign="center" justify="center">
              <Heading size="md">{t("Do you have an dApp to join the VeBetter DAO ecosystem?")}</Heading>
              <Button variant="primaryGhost" onClick={onOpenSubmitCreatorFormModal} leftIcon={<FaPlus />}>
                {t("Apply now")}
              </Button>
            </Stack>
          </Stack>
        </CardBody>
      </Card>
      <SubmitCreatorFormModal
        isOpen={isSubmitCreatorFormModalOpen}
        onClose={onCloseSubmitCreatorFormModal}
        buttonAction={navigateToCreatorForm}
      />
    </>
  )
}
