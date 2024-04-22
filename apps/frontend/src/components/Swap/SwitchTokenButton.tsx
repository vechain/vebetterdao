import { Flex, IconButton, useColorModeValue } from "@chakra-ui/react"
import { useCallback } from "react"
import { FaRepeat } from "react-icons/fa6"

type Props = {
  setIsB3trToVot3: (p: (s: boolean) => boolean) => void
}

export const SwitchTokenButton = ({ setIsB3trToVot3 }: Props) => {
  const handleSwitchTokens = useCallback(() => setIsB3trToVot3(s => !s), [setIsB3trToVot3])
  return (
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
        bgColor={`primary.${useColorModeValue("400", "300")}`}
        color="white"
        aria-label="Switch Tokens"
        w={"60px"}
        h={"60px"}
        fontSize="30px"
        boxShadow={"xl"}
        icon={<FaRepeat />}
        transform={"rotate(90deg)"}
        _hover={{ bgColor: `primary.${useColorModeValue("300", "400")}` }}
        data-testid="switch-tokens-btn"
      />
    </Flex>
  )
}
