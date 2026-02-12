import { Card, Heading, HStack, Image, Text, VStack, Button, useDisclosure } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { GoPlus } from "react-icons/go"

import { useSelfMintEnabled } from "@/api/contracts/x2EarnCreator/useSelfMintEnabled"
import { SubmitCreatorFormModal } from "@/app/apps/components/SubmitCreatorFormModal"

import { useBreakpoints } from "../../hooks/useBreakpoints"

export const JoinB3TRAppsBanner = () => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const router = useRouter()
  const { data: isSelfMintEnabled } = useSelfMintEnabled()
  const { onOpen, open: isOpen, onClose } = useDisclosure()
  const goToCreatorForm = () => {
    router.push("/apps/creator/new")
  }
  return (
    <>
      <Card.Root w={"full"} bg="banner.green" color="black" overflow={"hidden"} borderRadius={"xl"} p={6}>
        <HStack justifyContent={{ base: "center", md: "space-between" }} w="full">
          <VStack alignItems={"flex-start"} w={{ base: "full" }} gap={4}>
            {isMobile && (
              <Image
                src="/assets/mascot/mascot-welcoming-left-head.webp"
                alt="mascot-welcoming-head"
                width="100%"
                boxSize="100px"
                objectFit="cover"
                objectPosition="top"
              />
            )}
            <Heading textStyle="2xl" fontWeight="bold" lineHeight={1.2}>
              {t("Do you have an app to join the VeBetter DAO ecosystem?")}
            </Heading>
            <Text textStyle="sm">
              {t(
                "Do you have a sustainable application and want to become part of our ecosystem? Learn how to get started through our Grant Program. Join our Discord channel and introduce yourself and your app!",
              )}
            </Text>
            <Button
              variant="secondary"
              size="md"
              onClick={isSelfMintEnabled ? () => router.push("/apps/new") : onOpen}
              px={8}
              py={4}>
              <GoPlus />
              <Text textStyle="md" color="current">
                {t("Apply now")}
              </Text>
            </Button>
          </VStack>
          {!isMobile && (
            <Image
              alignSelf={"end"}
              src="/assets/mascot/mascot-welcoming@2x.webp"
              alt="mascot-welcoming"
              boxSize="200px"
              overflow={"hidden"}
              objectFit="contain"
              transform="scaleX(-1) scale(1.5)"
            />
          )}
        </HStack>
      </Card.Root>
      <SubmitCreatorFormModal isOpen={isOpen} onClose={onClose} buttonAction={goToCreatorForm} />
    </>
  )
}
