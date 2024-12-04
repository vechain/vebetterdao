import React, { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  Box,
  CardBody,
  Input,
  Image,
  Text,
  Card,
  HStack,
  Spinner,
  Heading,
  Stack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
} from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/dapp-kit-react"
import { usePotentialRewards } from "@/api"

import { GalaxyCarrousel } from "./GalaxyCarrousel"

export const GalaxyRewardsCalculator = () => {
  const { t } = useTranslation()

  // Todo: test the page without the wallet connected
  const { account } = useWallet()
  if (!account) throw new Error("Account is required")

  const [selectedGMLevel, setSelectedGMLevel] = useState<string | undefined>(undefined)
  const [estimateRewards, setEstimateRewards] = useState<number | undefined>(undefined)
  const [isLoading, setLoading] = useState<boolean>(false)

  const handleNftSelect = (GMLevel: string | undefined) => {
    setSelectedGMLevel(GMLevel)
  }

  const estimatedRewards = usePotentialRewards(account, selectedGMLevel)
  console.log({ estimatedRewards })

  useMemo(() => {
    if (!selectedGMLevel) {
      setEstimateRewards(0)
      return
    }
    setLoading(true)
    // Example calculation (TODO: replace with the usePotentialRewards once finished hook)
    const _estimateRewards = (1 * parseFloat(selectedGMLevel)).toFixed(2)

    setEstimateRewards(parseFloat(_estimateRewards))
    setLoading(false)
  }, [selectedGMLevel])

  console.log("selectedGMLevel", selectedGMLevel)
  return (
    <Card
      variant="baseWithBorder"
      overflow={"hidden"}
      alignItems="center"
      w={"full"}
      style={{
        backgroundImage: `url('/images/stardust.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}>
      <CardBody>
        <Heading color={"white"}>{t("Rewards calculator")}</Heading>
        <Stack direction={["column", "row", "row"]} gap={4} h={"full"} justifyContent={"space-between"}>
          <GalaxyCarrousel setSelectedGMLevel={handleNftSelect} />

          {/* TODO: SIZE of the 2 BOX SMALLER FOR SMALLER SCREENS  */}
          <Stack spacing={4} alignItems="center" justifyContent="flex-end" border={"1px solid yello"}>
            {/* Estimated Rewards Output Card */}
            <Box
              py={4}
              px={4}
              bg="gray.900"
              shadow="lg"
              rounded="lg"
              h="32"
              w="full"
              style={{ backgroundImage: "linear-gradient(90deg, rgb(236, 255, 176), rgb(247, 255, 215))" }}>
              <Box
                borderLeft="4px"
                borderColor="lime.300"
                pl={4}
                h="full"
                display="flex"
                flexDirection="column"
                justifyContent="space-between">
                <HStack position="relative">
                  <Heading fontSize="x-large">{t("Estimated Rewards")}</Heading>
                  <Popover>
                    <PopoverTrigger>
                      <UilInfoCircle style={{ marginRight: "8px", cursor: "pointer" }} />
                    </PopoverTrigger>
                    {/* TODO: polish for mobile and bg={"lime.300"} */}
                    <PopoverContent position="absolute" p={2}>
                      <PopoverArrow />
                      <PopoverBody>
                        <Text textAlign="justify">
                          {t(
                            "The rewards are estimated based on the previous week's voting participation. The exact rewards are only known when a round ends and all participants have cast their votes.",
                          )}
                        </Text>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                </HStack>

                <HStack display="flex" alignItems="center">
                  <Image boxSize="7" rounded="full" bg="gray.800" src="/images/logo/b3tr_logo.svg/" alt="" />
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <Input
                      type="text"
                      bg="transparent"
                      color="gray.900"
                      fontWeight="semibold"
                      px={2}
                      w="full"
                      fontSize="4xl"
                      focusBorderColor="none"
                      placeholder="0"
                      readOnly
                      value={estimateRewards}
                    />
                  )}
                </HStack>
              </Box>
            </Box>

            {/* Actual rewards Card */}
            <Text color={"white"}>{t(`While, your actual reward was {actual rewards}`)}</Text>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  )
}
