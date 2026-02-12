import { Box, Button, Card, Heading, Image, Stack, useDisclosure } from "@chakra-ui/react"
import { UilPlus } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { useSelfMintEnabled } from "@/api/contracts/x2EarnCreator/useSelfMintEnabled"

import { SubmitCreatorFormModal } from "../SubmitCreatorFormModal"

export const CreatorApplyNow = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: isSelfMintEnabled } = useSelfMintEnabled()
  const goToCreatorForm = () => {
    router.push("/apps/creator/new")
  }
  const { onOpen, open: isOpen, onClose } = useDisclosure()
  return (
    <>
      <Card.Root
        variant="primary"
        w="full"
        rounded="20px"
        p={0}
        borderColor="rgba(154, 225, 77, 0.1)"
        backgroundImage={`url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='20' ry='20' stroke='%239AE14DFF' stroke-width='4' stroke-dasharray='16%2c 18%2c 13%2c 24' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`}>
        <Card.Body position="relative">
          <Stack direction={{ base: "row", lg: "row" }} align="stretch" gap={0}>
            {/* Left Section: Image taking full height */}
            <Box h="100%" alignSelf="end">
              <Image
                src="/assets/mascot/mascot-welcoming@2x.webp"
                alt="mascot-welcoming"
                w={{ base: "full", md: "300px", lg: "200px" }}
                objectFit="cover"
                borderRadius="9px"
              />
            </Box>
            {/* Right Section: Content */}
            <Stack
              px={4}
              py={4}
              direction={{ base: "column", lg: "row" }}
              w="full"
              justify={{ base: "center", md: "space-between" }}
              align="center"
              gap={4}>
              <Heading fontWeight="bold" size="md">
                {t("Do you have an app to join the VeBetter DAO ecosystem?")}
              </Heading>

              <Button
                variant="secondary"
                textStyle="md"
                fontWeight="semibold"
                borderRadius="full"
                onClick={isSelfMintEnabled ? () => router.push("/apps/new") : onOpen}
                flexShrink={0}
                w={{ base: "full", lg: "auto" }}>
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
