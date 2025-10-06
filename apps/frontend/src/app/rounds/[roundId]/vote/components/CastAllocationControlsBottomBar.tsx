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
        gap={4}
        justify={"space-between"}
        align={"center"}
        pos="fixed"
        bottom={0}
        left={0}
        py={"16px"}
        px={"20px"}
        bg="bg.primary"
        zIndex={2}
        boxShadow={"0px -8px 16px 0px #00000014"}>
        {helperText}
        <HStack
          alignSelf={"flex-end"}
          justify={["space-between", "space-between", "flex-end"]}
          gap={4}
          w={["full", "full", "auto"]}>
          <Button flex={1} size="lg" data-testid="go-back" variant="secondary" onClick={router.back}>
            <UilArrowLeft />
            {t("Go back")}
          </Button>
          <Button flex={1} size="lg" data-testid="continue" variant="primary" onClick={onContinue}>
            {t("Continue")}
            <UilArrowRight />
          </Button>
        </HStack>
      </Stack>
    )

  return (
    <Stack direction={["column", "column", "row"]} w="full" gap={4} justify={"space-between"} align={"center"}>
      {helperText}
      <HStack
        alignSelf={"flex-end"}
        justify={["space-between", "space-between", "flex-end"]}
        gap={4}
        w={["full", "full", "auto"]}>
        <Button
          flex={1}
          size="lg"
          data-testid="go-back"
          variant="ghost"
          color="actions.tertiary.default"
          onClick={router.back}>
          <UilArrowLeft />
          {t("Go back")}
        </Button>
        <Button flex={1} size="lg" data-testid="continue" variant="primary" onClick={onContinue}>
          {t("Continue")}
          <UilArrowRight />
        </Button>
      </HStack>
    </Stack>
  )
}
