import { Heading, VStack, Dialog, IconButton, useDisclosure, Box, Text, HStack, CloseButton } from "@chakra-ui/react"
import loadingAnimation from "./loading.json"
import { motion } from "framer-motion"
import { CustomModalContent } from "@/components"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"
import { UilCheckCircle, UilLink, UilShareAlt } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { ShareButtonsBlue } from "@/components/ShareButtonsBlue"
import { useCallback, useState } from "react"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import Lottie from "react-lottie"

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

export const ProposalShareButton = () => {
  const { onOpen, open: isOpen, onClose } = useDisclosure()
  const { proposal } = useProposalDetail()
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

  return (
    <>
      <IconButton aria-label="share" rounded="full" bgColor="#E0E9FE" color="#004CFC" boxSize={"40px"} onClick={onOpen}>
        <UilShareAlt />
      </IconButton>
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
                      animationData: loadingAnimation,
                    }}
                    height={200}
                    width={200}
                    speed={0.5}
                  />
                </Box>
                <VStack>
                  <Heading size="3xl">{t("Share this proposal")}</Heading>
                  <Text fontSize="16px" fontWeight={400} color="#6A6A6A" textAlign={"center"}>
                    {t("Share the proposal on social media and invite people to vote")}
                  </Text>
                </VStack>
                <ShareButtonsBlue
                  descriptionEncoded={encodeURIComponent(
                    `📢 Proposal alert! Check it out on #VeBetterDao and join me in building a sustainable future 🌱🔗\n\nVote now: https://governance.vebetterdao.org/proposals/${proposal.id}\n\n💫 #VeBetterDAO #Vechain`,
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
