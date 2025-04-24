import { Heading, VStack, Text, HStack, Image } from "@chakra-ui/react"
import LazyLottie from "@/app/components/LazyLottie"
import confirmationAnimation from "./confirmation.json"
import { ReactNode } from "react"
import { PropsEndorsement } from "@/app/apps/components/UnendorseAppModal"
import { t } from "i18next"
import { NodeStrengthLevelToImage } from "@/constants/XNode"

export type ConfirmationModalEndorsementContentProps = {
  title?: ReactNode
  description?: string
  endorsementInfo?: PropsEndorsement
}

export const ConfirmationEndorsementModalContent = ({
  title = "Waiting for confirmation",
  description = "Confirm the operation in your wallet to complete it",
  endorsementInfo,
}: ConfirmationModalEndorsementContentProps) => {
  const EndorsementDetails = () => (
    <HStack align="center">
      <Text fontSize="small">
        {t(endorsementInfo?.isEndorsing ? "You are endorsing" : "Removing your endorsement from")}{" "}
        <Text as="strong" display="inline">
          {endorsementInfo?.endorsedAppName}
        </Text>
      </Text>
    </HStack>
  )
  return (
    <VStack align={"center"} p={6} gap={6}>
      <LazyLottie
        style={{
          pointerEvents: "none",
        }}
        options={{
          loop: true,
          autoplay: true,
          animationData: confirmationAnimation,
        }}
        height={200}
        width={200}
      />
      <Heading fontSize="x-large">{title}</Heading>

      {description && (
        <Text size="sm" color="#6A6A6A">
          {description}
        </Text>
      )}

      <HStack bg="#F8F8F8" justify="space-around" p="16px" rounded="8px" height={"full"}>
        <HStack>
          <EndorsementDetails />
          <Image
            src={NodeStrengthLevelToImage[endorsementInfo?.xNodeLevel ?? 0]}
            boxSize="24px"
            alt={`Node lvl ${endorsementInfo?.xNodeLevel}`}
          />
          <Text fontSize="small" fontWeight={800}>
            {t("{{value}} points", { value: endorsementInfo?.points })}
          </Text>
        </HStack>
      </HStack>
    </VStack>
  )
}
