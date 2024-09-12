import {
  Button,
  Fade,
  IconButton,
  Modal,
  ModalBody,
  Skeleton,
  Text,
  useDisclosure,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { FaWallet } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import { AddressIcon } from "../AddressIcon"
import dynamic from "next/dynamic"
import { useMemo } from "react"
import { CustomModalContent } from "../CustomModalContent"

const DesktopConnectedUserButton = dynamic(
  () => import("./components/DesktopConnectedUserButton").then(mod => mod.DesktopConnectedUserButton),
  {
    ssr: false,
    loading: () => (
      <Skeleton rounded="full">
        <Button size="md">{"Connect wallet"}</Button>
      </Skeleton>
    ),
  },
)

type Props = {
  responsiveVariant?: "desktop" | "mobile"
}

const VEWORLD_WEBSITE = "https://www.veworld.com/discover/browser/ul/"

export const ConnectWalletButton = ({ responsiveVariant }: Props) => {
  const { account, connect, setSource } = useWallet()
  const { isOpen, onClose, onOpen } = useDisclosure()

  const open = () => {
    onOpen()
  }
  const connectWithVeworld = () => {
    if (!window.vechain) {
      window.open(`${VEWORLD_WEBSITE}${encodeURIComponent(location.href)}`, "_self")
      return
    }
    setSource("veworld")
    connect()
    onClose()
  }
  const connectWithSync2 = () => {
    setSource("sync2")
    connect()
    onClose()
  }
  const connectWithWalletConnect = () => {
    setSource("wallet-connect")
    connect()
    onClose()
  }
  const [isDesktop] = useMediaQuery("(min-width: 1060px)")
  const { t } = useTranslation()

  const shouldRenderDesktop = responsiveVariant === "desktop" || (!responsiveVariant && isDesktop)

  const button = useMemo(() => {
    if (!account)
      if (shouldRenderDesktop)
        return (
          <Fade in={true}>
            <Button
              onClick={open}
              variant={"primaryAction"}
              size="md"
              leftIcon={<FaWallet />}
              data-testid="connect-wallet">
              {t("Connect Wallet")}
            </Button>
          </Fade>
        )
      else
        return (
          <Fade in={true}>
            <IconButton
              onClick={open}
              icon={<FaWallet />}
              aria-label="Connect wallet"
              variant={"primaryAction"}
              borderRadius={"md"}
            />
          </Fade>
        )

    if (shouldRenderDesktop) return <DesktopConnectedUserButton account={account} />

    return (
      <Fade in={true}>
        <IconButton
          onClick={open}
          rounded={"md"}
          border={"1px solid #EEEEEE"}
          bg={"rgba(255, 255, 255, 0.50)"}
          icon={<AddressIcon address={account} boxSize={6} rounded={"full"} />}
          aria-label="Connect wallet"
        />
      </Fade>
    )
  }, [account, open, shouldRenderDesktop, t])

  return (
    <>
      {button}
      <Modal isOpen={isOpen} onClose={onClose}>
        <CustomModalContent>
          <ModalBody p="8">
            <VStack>
              <Button onClick={connectWithVeworld}>{"Connect With VeWorld"}</Button>
              <Button onClick={connectWithSync2}>{"Connect With Sync2"}</Button>
              <Button onClick={connectWithWalletConnect}>{"Connect With Wallet Connect"}</Button>
              <Text color="#6A6A6A">{"or"}</Text>
              <Text color="#6A6A6A">{"you don't have a wallet?"}</Text>
              <Button onClick={connectWithVeworld}>{"Create Wallet with veworld"}</Button>
            </VStack>
          </ModalBody>
        </CustomModalContent>
      </Modal>
    </>
  )
}
