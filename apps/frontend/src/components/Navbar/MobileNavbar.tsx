import { HStack, useMediaQuery } from "@chakra-ui/react"
import dynamic from "next/dynamic"

import { NavbarBalance } from "./NavbarBalance"
import { NavbarLogo } from "./NavbarLogo"
import { Route } from "./Routes"

const ConnectWalletButton = dynamic(
  () => import("../../components/ConnectWalletButton/ConnectWalletButton").then(mod => mod.ConnectWalletButton),
  { ssr: false },
)

type Props = {
  routesToRender: Route[]
  isNotMobile?: boolean
}

export const MobileNavBar: React.FC<Props> = () => {
  const [isLargerThan500] = useMediaQuery(["(min-width: 500px)"])

  return (
    <>
      <NavbarLogo />
      {isLargerThan500 && (
        <HStack>
          <NavbarBalance />
        </HStack>
      )}

      <HStack gap={2}>
        <ConnectWalletButton />
      </HStack>
    </>
  )
}
