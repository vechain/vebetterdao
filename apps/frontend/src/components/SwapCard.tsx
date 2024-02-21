import {
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  HStack,
  Heading,
  IconButton,
  Input,
  Stack,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react"
import { B3TRIcon, VOT3Icon } from "./Icons"
import { useB3trBalance, useVot3Balance } from "@/api"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useStakeB3tr, useTokenColors, useUnstakeB3tr } from "@/hooks"
import { FaRepeat } from "react-icons/fa6"
import { Controller, useForm } from "react-hook-form"
import { SwapModal } from "./SwapModal"
import { backdropBlurAnimation } from "@/app/theme"

export const SwapCard = () => {
  const { account } = useWallet()
  const [isB3trToVot3, setIsB3trToVot3] = useState(true)
  const { data: b3trBalance } = useB3trBalance(account ?? undefined)
  const { data: vot3Balance } = useVot3Balance(account ?? undefined)
  const { isOpen, onClose, onOpen } = useDisclosure()
  const b3trBalanceScaled = useMemo(() => {
    return b3trBalance?.scaled ?? "0"
  }, [b3trBalance])

  const vot3BalanceScaled = useMemo(() => {
    return vot3Balance?.scaled ?? "0"
  }, [vot3Balance])

  const { b3trBgGradient, vot3BgGradient, b3trDividerColor, vot3dividerAlpha } = useTokenColors()

  const buttonPrimaryAlpha = useColorModeValue("400", "300")
  const buttonPrimaryActiveAlpha = useColorModeValue("300", "400")

  const { control, watch, setValue } = useForm<{ amount: string }>()
  const amount = String(Number(watch("amount")) || "")
  const maxBalance = useMemo(
    () => (isB3trToVot3 ? b3trBalanceScaled : vot3BalanceScaled),
    [isB3trToVot3, b3trBalanceScaled, vot3BalanceScaled],
  )
  const filterAmount = useCallback(
    (text: string) => {
      const filteredAmount = text
        .replace(",", ".") // Replace comma with dot
        .replace(/[^\d\\.]/g, "") // Filter out non-numeric characters except for decimal separator
        .replace(/\.(?=.*\.)/g, "") // Filter out duplicate decimal separators

      if (Number(filteredAmount) > Number(maxBalance)) {
        return maxBalance
      }
      return filteredAmount
    },
    [b3trBalanceScaled, isB3trToVot3, vot3BalanceScaled, maxBalance],
  )

  const handleSwitchTokens = useCallback(() => {
    setIsB3trToVot3(!isB3trToVot3)
  }, [isB3trToVot3, setIsB3trToVot3])

  const amountInput = useMemo(() => {
    return (
      <Controller
        name="amount"
        control={control}
        render={({ field: { onChange, value } }) => (
          <Input
            h="50px"
            placeholder="0"
            fontSize="40px"
            fontWeight={700}
            type="text"
            value={value}
            onChange={e => onChange(filterAmount(e.target.value))}
            variant="unstyled"
            _placeholder={{ color: "black" }}
          />
        )}
      />
    )
  }, [filterAmount, control])

  useEffect(() => {
    // I needed a useEffect here because inside the callback the isB3trToVot3 wan not updated
    if (amount === "") return
    setValue("amount", filterAmount(amount))
  }, [isB3trToVot3, amount])

  const stakeMutation = useStakeB3tr({
    amount,
  })

  const unstakeMutation = useUnstakeB3tr({
    amount,
  })

  const mutationData = useMemo(() => {
    if (isB3trToVot3) {
      return stakeMutation
    } else {
      return unstakeMutation
    }
  }, [isB3trToVot3, stakeMutation, unstakeMutation])

  const handleStake = useCallback(() => {
    mutationData.sendTransaction(undefined)
    onOpen()
  }, [mutationData.sendTransaction, onOpen])

  const onSuccess = useCallback(() => {
    mutationData.resetStatus()
    setValue("amount", "")
    setTimeout(onClose, 1500)
  }, [mutationData.resetStatus, onClose, setValue])

  return (
    <>
      <Card w="full">
        <CardBody>
          <VStack align={"flex-start"}>
            <Heading size="md" mb={4}>
              Swap
            </Heading>
            <HStack w="full" justify={"space-between"} mb={2} px={4}>
              {[0, 25, 50, 75, 100].map(percentage => (
                <Button
                  key={percentage}
                  size="sm"
                  rounded="full"
                  color="black"
                  bgGradient={isB3trToVot3 ? b3trBgGradient : vot3BgGradient}
                  onClick={() =>
                    setValue(
                      "amount",
                      !percentage ? "" : filterAmount((Number(maxBalance) * (percentage / 100)).toString()),
                    )
                  }>
                  {percentage}%
                </Button>
              ))}
            </HStack>
            <Flex color={"black"} position={"relative"}>
              <Stack direction={isB3trToVot3 ? "column" : "column-reverse"}>
                <VStack
                  bgGradient={b3trBgGradient}
                  py={6}
                  px={6}
                  h="full"
                  w="full"
                  borderRadius={"2xl"}
                  align="flex-start"
                  spacing={12}>
                  <HStack align={"stretch"} justify={"stretch"} spacing={4} w="full">
                    <Divider
                      orientation="vertical"
                      variant="thick"
                      w="4px"
                      bgColor={b3trDividerColor}
                      h="auto"
                      borderRadius="7px"
                    />
                    <VStack justify="stretch" flex={1}>
                      <HStack justify={"space-between"} w="full">
                        <Text>{isB3trToVot3 ? "You Send" : "You Get"}</Text>
                        <Text fontSize="16px" fontWeight="600">
                          B3TR
                        </Text>
                      </HStack>
                      <HStack w="full">
                        <B3TRIcon size={32} />
                        {amountInput}
                      </HStack>
                    </VStack>
                  </HStack>
                </VStack>
                <VStack
                  bgGradient={vot3BgGradient}
                  py={6}
                  px={6}
                  h="full"
                  w="full"
                  borderRadius={"2xl"}
                  align="flex-start"
                  spacing={12}>
                  <HStack align={"stretch"} justify={"stretch"} spacing={4} w="full">
                    <Divider
                      orientation="vertical"
                      variant="thick"
                      w="4px"
                      bgColor={vot3dividerAlpha}
                      h="auto"
                      borderRadius="7px"
                    />
                    <VStack justify="stretch" flex={1}>
                      <HStack justify={"space-between"} w="full">
                        <Text>{isB3trToVot3 ? "You Get" : "You Send"}</Text>
                        <Text fontSize="16px" fontWeight="600">
                          VOT3
                        </Text>
                      </HStack>
                      <HStack w="full">
                        <VOT3Icon size={32} />
                        {amountInput}
                      </HStack>
                    </VStack>
                  </HStack>
                </VStack>
              </Stack>
              <Flex
                position="absolute"
                left={0}
                right={0}
                top={0}
                bottom={0}
                justify={"center"}
                align="center"
                pointerEvents={"none"}>
                <IconButton
                  pointerEvents={"auto"}
                  onClick={handleSwitchTokens}
                  isRound={true}
                  variant="solid"
                  bgColor={`primary.${buttonPrimaryAlpha}`}
                  color="white"
                  aria-label="Switch Tokens"
                  w={"60px"}
                  h={"60px"}
                  fontSize="30px"
                  boxShadow={"xl"}
                  icon={<FaRepeat />}
                  transform={"rotate(90deg)"}
                  _hover={{ bgColor: `primary.${buttonPrimaryActiveAlpha}` }}
                />
              </Flex>
            </Flex>
            <Flex justify={"flex-end"} w="full" mt={2}>
              <Button
                color="white"
                bgColor={`primary.${buttonPrimaryAlpha}`}
                rounded="full"
                isDisabled={Number(amount) === 0}
                onClick={handleStake}>
                Swap
              </Button>
            </Flex>
          </VStack>
        </CardBody>
      </Card>
      {!account && (
        <Flex
          backdropFilter="blur(10px)"
          animation={backdropBlurAnimation("0px", "10px")}
          position={"absolute"}
          h={"100%"}
          w={"100%"}
          align="center"
          justify="center"
        />
      )}
      <SwapModal
        isOpen={isOpen}
        onClose={onClose}
        amount={amount}
        isB3trToVot3={isB3trToVot3}
        mutationData={mutationData}
        onSuccess={onSuccess}
      />
    </>
  )
}
