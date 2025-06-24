import { useBreakpoints } from "@/hooks"
import { Stack, HStack, Button } from "@chakra-ui/react"
import { UilArrowLeft, UilArrowRight } from "@iconscout/react-unicons"
import { t } from "i18next"
import { useRouter } from "next/navigation"

type Props = {
  onContinue: () => void
  helperText?: React.ReactNode
}
export const CastAllocationControlsBottomBar = ({ onContinue, helperText }: Props) => {
  const router = useRouter()
  const { isMobile } = useBreakpoints()

  if (isMobile)
    return (
      <Stack
        direction={["column", "column", "row"]}
        w="full"
        spacing={4}
        justify={"space-between"}
        align={"center"}
        pos="fixed"
        bottom={0}
        left={0}
        py={"16px"}
        px={"20px"}
        bg="profile-bg"
        zIndex={2}
        boxShadow={"0px -8px 16px 0px #00000014"}>
        {helperText}
        <HStack
          alignSelf={"flex-end"}
          justify={["space-between", "space-between", "flex-end"]}
          spacing={4}
          w={["full", "full", "auto"]}>
          <Button
            borderRadius={"16px"}
            flex={1}
            size="lg"
            leftIcon={<UilArrowLeft />}
            data-testid="go-back"
            variant="primarySubtle"
            onClick={router.back}>
            {t("Go back")}
          </Button>
          <Button
            flex={1}
            borderRadius={"16px"}
            size="lg"
            rightIcon={<UilArrowRight />}
            fontSize="18px"
            data-testid="continue"
            variant="primaryAction"
            onClick={onContinue}>
            {t("Continue")}
          </Button>
        </HStack>
      </Stack>
    )

  return (
    <Stack direction={["column", "column", "row"]} w="full" spacing={4} justify={"space-between"} align={"center"}>
      {helperText}
      <HStack
        alignSelf={"flex-end"}
        justify={["space-between", "space-between", "flex-end"]}
        spacing={4}
        w={["full", "full", "auto"]}>
        <Button
          //   borderRadius={"16px"}
          flex={1}
          size="lg"
          leftIcon={<UilArrowLeft />}
          data-testid="go-back"
          variant="primarySubtle"
          onClick={router.back}>
          {t("Go back")}
        </Button>
        <Button
          flex={1}
          //   borderRadius={"16px"}
          size="lg"
          rightIcon={<UilArrowRight />}
          fontSize="18px"
          data-testid="continue"
          variant="primaryAction"
          onClick={onContinue}>
          {t("Continue")}
        </Button>
      </HStack>
    </Stack>
  )
}
