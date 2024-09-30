import { useCallback, useRef, useState } from "react"
import { DoActionBanner } from "./components/DoActionBanner"
import { motion, AnimatePresence } from "framer-motion"
import { Text, HStack, Flex, Icon, IconButton, Show, Box } from "@chakra-ui/react"
import { FaChevronDown, FaChevronUp } from "react-icons/fa6"
import { ClaimB3trBanner } from "./components/ClaimB3trBanner"
import { useCanUserVote, useCurrentRoundReward } from "@/api"
import { CastVoteBanner } from "./components/CastVoteBanner"
import { UilArrowLeft, UilArrowRight } from "@iconscout/react-unicons"
import { useIsPerson } from "@/api/contracts/vePassport/hooks/useIsPerson"

export const ActionBanner = () => {
  const [isVisible, setIsVisible] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { rewards, isLoading: isRoundRewardLoading } = useCurrentRoundReward()
  const { data: isPerson, isLoading: isPersonLoading } = useIsPerson()
  const { data: canUserVote, isLoading: canUserVoteLoading } = useCanUserVote()

  const showDoActionBanner = !isPersonLoading && !isPerson
  const showClaimB3trBanner = !isRoundRewardLoading && rewards > 0
  const showCastVoteBanner = !canUserVoteLoading && !canUserVote

  const scroll = useCallback((direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth + 16
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }, [])

  if (!showClaimB3trBanner && !showDoActionBanner && !showCastVoteBanner) return null

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <Box position="relative" minW="full">
            <Show above="md">
              <IconButton
                variant="primaryIconButton"
                zIndex={2}
                position="absolute"
                left={-50}
                top={"calc(50% - 20px)"}
                aria-label="Scroll left"
                icon={<UilArrowLeft />}
                onClick={() => scroll("left")}
              />
            </Show>
            <motion.div
              style={{
                overflow: "hidden",
                minWidth: "100%",
              }}
              initial={{ height: 0, opacity: 0 }}
              exit={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}>
              <Flex
                gap={4}
                pb={2}
                overflowX="auto"
                minW="full"
                ref={scrollContainerRef}
                sx={{
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                }}>
                {showDoActionBanner && (
                  <Flex minW="full">
                    <DoActionBanner />
                  </Flex>
                )}
                {showClaimB3trBanner && (
                  <Flex minW="full">
                    <ClaimB3trBanner />
                  </Flex>
                )}
                {showCastVoteBanner && (
                  <Flex minW="full">
                    <CastVoteBanner />
                  </Flex>
                )}
              </Flex>
            </motion.div>
            <Show above="md">
              <IconButton
                variant="primaryIconButton"
                zIndex={2}
                position="absolute"
                right={-50}
                top={"calc(50% - 20px)"}
                aria-label="Scroll right"
                icon={<UilArrowRight />}
                onClick={() => scroll("right")}
              />
            </Show>
          </Box>
        )}
      </AnimatePresence>
      <HStack
        justifyContent="center"
        gap={2}
        mt={2}
        onClick={() => setIsVisible(!isVisible)}
        cursor="pointer"
        _hover={{ textDecoration: "underline" }}>
        <Flex flex={1} border="1px solid" borderColor="#D6D6D6" />
        <Flex as="button">
          <HStack>
            <Icon as={isVisible ? FaChevronUp : FaChevronDown} color={"#D6D6D6"} />
            <Text color="#6A6A6A" fontSize={"sm"}>
              {isVisible ? "HIDE ALERT" : "SHOW ALERT"}
            </Text>
            <Icon as={isVisible ? FaChevronUp : FaChevronDown} color={"#D6D6D6"} />
          </HStack>
        </Flex>
        <Flex flex={1} border="1px solid" borderColor="#D6D6D6" />
      </HStack>
    </>
  )
}
