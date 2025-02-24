import { HStack, useMediaQuery, Box } from "@chakra-ui/react"
import { NavbarLogo } from "./NavbarLogo"
import { NavbarMenu } from "./NavbarMenu"
import dynamic from "next/dynamic"
import { Route } from "./Routes"
import { NavbarBalance } from "./NavbarBalance"
import { SocialLoginTooltip } from "../SocialLoginTooltip"
import { FeatureFlag } from "@/constants"
import { useFeatureFlag } from "@/hooks"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"

const ConnectWalletButton = dynamic(
  () => import("@/components/ConnectWalletButton").then(mod => mod.ConnectWalletButton),
  { ssr: false },
)

type Props = {
  routesToRender: Route[]
}
export const DesktopNavBar: React.FC<Props> = ({ routesToRender }) => {
  const [isLargerThan1800] = useMediaQuery("(min-width: 1800px)")

  //VechainKit feature flag
  const { isEnabled: isVechainKitFlagOn } = useFeatureFlag(FeatureFlag.VECHAIN_KIT)

  const { account } = useWallet()
  const { isOpen: isWalletModalOpen } = useWalletModal()

  // Show the VeChainKit tooltip if :
  // - the feature flag is enabled
  // - the user is not connected
  // - the wallet modal is not open
  const shouldRenderVeChainKitTooltip = isVechainKitFlagOn && !account && !isWalletModalOpen

  return (
    <>
      <HStack flex={1} justifyContent={"start"}>
        <NavbarLogo />
      </HStack>

      {/* {TODO: dark mode support} */}
      {!!routesToRender.length && (
        <HStack
          spacing={4}
          justifyContent={"center"}
          borderRadius={"full"}
          borderWidth={1}
          borderColor={"rgba(0,0,0, 0.06)"}
          bg={"rgba(255, 255, 255, 0.50)"}
          py={2}
          px={4}>
          <NavbarMenu routesToRender={routesToRender} />
        </HStack>
      )}
      <HStack flex={1} spacing={4} justifyContent={"end"}>
        {/* <ThemeSwitcher /> */}
        {isLargerThan1800 && <NavbarBalance />}
        <SocialLoginTooltip isOpen={shouldRenderVeChainKitTooltip}>
          <Box as="span">
            <ConnectWalletButton />
          </Box>
        </SocialLoginTooltip>
      </HStack>
    </>
  )
}
