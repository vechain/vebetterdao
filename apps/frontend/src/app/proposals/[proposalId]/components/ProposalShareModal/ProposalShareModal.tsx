import { CustomModalContent } from "@/components"
import { ShareButtonsBlue } from "@/components/ShareButtonsBlue"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"
import { ProposalType } from "@/hooks/proposals/grants/types"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { Box, CloseButton, Dialog, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { UilCheckCircle, UilLink } from "@iconscout/react-unicons"
import { motion } from "framer-motion"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import Lottie from "react-lottie"

import shareIconAnimation from "./shareIconAnimation.json"

const containerVariants = {
  initial: {
    x: 30,
  },
  animate: {
    x: 0,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
}

export const ProposalShareModal = ({
  proposalId,
  proposalType,
  isOpen,
  onClose,
}: {
  proposalId: string
  proposalType: ProposalType
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
}) => {
  const { t } = useTranslation()
  const [showCopiedLink, setShowCopiedLink] = useState(false)
  const { transactionModalState } = useTransactionModal()
  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(location.href)
    setShowCopiedLink(true)
    setTimeout(() => {
      setShowCopiedLink(false)
    }, 2000)
  }, [])

  const proposalTypeText = useMemo(() => {
    return proposalType === ProposalType.Standard ? t("proposal") : t("grant")
  }, [proposalType, t])

  return (
    <>
      <Dialog.Root
        open={isOpen}
        onOpenChange={details => !details.open && onClose()}
        closeOnInteractOutside={
          transactionModalState?.status !== "waitingConfirmation" && transactionModalState?.status !== "pending"
        }
        placement="center"
        size={"xl"}>
        <CustomModalContent>
          <ModalAnimation>
            <Dialog.CloseTrigger asChild top={4} right={4}>
              <CloseButton />
            </Dialog.CloseTrigger>
            <motion.div initial="initial" animate="animate" variants={containerVariants}>
              <VStack align={"center"} p={8} gap={8}>
                <Box my="10px">
                  {/* @ts-ignore eslint-disable-line */}
                  <Lottie
                    style={{
                      pointerEvents: "none",
                    }}
                    options={{
                      loop: false,
                      autoplay: true,
                      animationData: shareIconAnimation,
                    }}
                    height={200}
                    width={200}
                    speed={0.5}
                  />
                </Box>
                <VStack>
                  <Heading fontSize="28px" fontWeight={700}>
                    {t("Share this {{proposalType}}", { proposalType: proposalTypeText })}
                  </Heading>
                  <Text fontSize="16px" fontWeight={400} color={"text.subtle"} textAlign={"center"}>
                    {t("Share the {{proposalType}} on social media and invite people to vote", {
                      proposalType: proposalTypeText,
                    })}
                  </Text>
                </VStack>
                <ShareButtonsBlue
                  descriptionEncoded={encodeURIComponent(
                    `📢 ${proposalTypeText.toUpperCase()} alert! Check it out on #VeBetterDao and join me in building a sustainable future 🌱🔗\n\nVote now: https://governance.vebetterdao.org/${proposalTypeText}s/${proposalId}\n\n💫 #VeBetterDAO #Vechain`,
                  )}
                />
                {showCopiedLink ? (
                  <HStack color="#6DCB09">
                    <UilCheckCircle size="20px" />
                    <Text fontSize="18px" fontWeight={500}>
                      {t("Copied!")}
                    </Text>
                  </HStack>
                ) : (
                  <HStack
                    _hover={{ textDecoration: "underline", cursor: "pointer" }}
                    color="#004CFC"
                    onClick={handleCopyLink}>
                    <UilLink size="18px" />
                    <Text fontSize="18px" fontWeight={500}>
                      {t("Copy link to proposal")}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </motion.div>
          </ModalAnimation>
        </CustomModalContent>
      </Dialog.Root>
    </>
  )
}
