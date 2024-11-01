import { useAppEndorsers, useIsAppAdmin, useIsAppModerator } from "@/api"
import { AddressIcon } from "@/components/AddressIcon"
import { Skeleton, HStack, VStack, useDisclosure, Text, Link, Flex } from "@chakra-ui/react"
import { t } from "i18next"

import { AppEndorsementInfoCardModal } from "./AppEndorsementInfoCardModal"
import { useWallet } from "@vechain/dapp-kit-react"

type Props = {
  appId: string
  userScore: number | null
}
export const AppEndorsersSection = ({ appId, userScore }: Props) => {
  const { account } = useWallet()
  const { data: appEndorsers, isLoading: isAppEndorsersLoading } = useAppEndorsers(appId)

  // User roles data
  const { data: isAppModerator, isLoading: isAppModeratorLoading } = useIsAppModerator(appId, account ?? "")
  const { data: isAppAdmin, isLoading: isAppAdminLoading } = useIsAppAdmin(appId, account ?? "")

  const isUserRolesDataLoading = isAppModeratorLoading || isAppAdminLoading

  const {
    isOpen: isEndorsementInfoOpen,
    onOpen: onOpenEndorsementInfoModal,
    onClose: onCloseEndorsementInfoModal,
  } = useDisclosure()

  return (
    <>
      <AppEndorsementInfoCardModal
        isOpen={isEndorsementInfoOpen}
        onClose={onCloseEndorsementInfoModal}
        appId={appId}
        userScore={userScore}
      />

      <Skeleton isLoaded={!isAppEndorsersLoading && !isUserRolesDataLoading}>
        {appEndorsers && appEndorsers.length ? (
          <HStack justify={"space-between"} w="full">
            <HStack>
              <AppEndorsersIcon endorsers={appEndorsers} />
              <Text as="span" fontSize="14px" fontWeight="bold">
                {appEndorsers.length > 1
                  ? t("{{value}} Node holders", { value: appEndorsers.length })
                  : t("{{value}} Node holder", { value: appEndorsers.length })}
              </Text>
            </HStack>
            <Link fontSize="14px" color="#004CFC" onClick={onOpenEndorsementInfoModal}>
              {t("See all")}
            </Link>
          </HStack>
        ) : (
          <VStack>
            <Text fontSize="14px" fontWeight="bold">
              {isAppModerator || isAppAdmin ? t("Nobody is endorsing your app") : t("Not endorsed by anyone")}
              <br />
              <Link fontSize="14px" color="#004CFC" onClick={onOpenEndorsementInfoModal}>
                {t("See endorsement history")}
              </Link>
            </Text>
          </VStack>
        )}
      </Skeleton>
    </>
  )
}

export const AppEndorsersIcon = ({ endorsers, maxToRender = 3 }: { endorsers: string[]; maxToRender?: number }) => {
  const boxSize = 20
  const marginleft = boxSize / 2

  const endorsersToRender = endorsers.slice(0, maxToRender)
  const remainingEndorsers = endorsers.length - maxToRender

  const otherAppsBoxColor = "#C9EAA3"
  const otherAppsTextColor = "#5C6C4A"
  return (
    <HStack spacing={0}>
      {endorsersToRender.map((endorser: string, index: number) => {
        const ml = index > 0 ? `-${marginleft}px` : "0"
        return <AddressIcon key={index} address={endorser} rounded="full" boxSize={`${boxSize}px`} ml={ml} />
      })}
      {endorsers.length > maxToRender && (
        <Flex
          zIndex={1}
          boxSize={`${boxSize}px`}
          borderRadius={`full`}
          ml={`-${marginleft}px`}
          bg={otherAppsBoxColor}
          justify={"center"}
          align={"center"}>
          <Text
            fontSize={`${(boxSize ?? 0) / 2}px`}
            fontWeight={600}
            data-testid="participating-add-more-apps"
            color={otherAppsTextColor}>
            {t("+{{value}}", { value: remainingEndorsers })}
          </Text>
        </Flex>
      )}
    </HStack>
  )
}
