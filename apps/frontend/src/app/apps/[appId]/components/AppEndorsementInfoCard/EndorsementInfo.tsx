import { useRouter } from "next/navigation"
import { useEndorsementInfos } from "@/hooks/useEndorsementData"
import { Text, HStack, VStack, Box, Popover, PopoverContent, PopoverTrigger, PopoverBody } from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"
import { AddressIcon } from "@/components/AddressIcon"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/dapp-kit-react"
import { HiDotsVertical } from "react-icons/hi"
import { UilTrash, UilCheck } from "@iconscout/react-unicons"
import { useIsAppAdmin } from "@/api"

type EndorsementInfoProps = {
  appId: string
  endorserAddress: string
  setIsConfirmOpen: (value: boolean) => void
}

export const EndorsementInfo = ({ appId, endorserAddress, setIsConfirmOpen }: EndorsementInfoProps) => {
  const { t } = useTranslation()
  const router = useRouter()

  const { account } = useWallet()
  const { data: isAppAdmin } = useIsAppAdmin(appId, account ?? "")

  const endorsementInfos = useEndorsementInfos(appId, endorserAddress)

  const handleRemoveClick = () => {
    setIsConfirmOpen(true)
  }

  const goToEndorserUserProfilePage = () => {
    router.push("/profile/" + endorserAddress)
  }

  return (
    <HStack
      bg="white"
      p={"12px"}
      borderRadius={"16px"}
      boxShadow="sm"
      w={"full"}
      alignItems={"center"}
      justify={"space-between"}>
      <HStack alignItems={"center"} gap={4}>
        <AddressIcon address={endorserAddress} rounded="full" h="28px" w="28px" />
        <VStack align="start" justify={"center"} spacing={0}>
          <Text>{humanAddress(endorsementInfos.endorserAddress, 6, 3)}</Text>
          <Text fontSize="12" fontWeight={400} color="#6A6A6A">
            {t("Endorsing since {{date}}", { date: endorsementInfos.dateOfFirstEndorsement })}
          </Text>
        </VStack>
      </HStack>
      <HStack alignItems={"center"} gap={4}>
        <Text fontSize={"16px"} fontWeight={600}>
          <Trans
            i18nKey="{{value}} pts."
            values={{ value: endorsementInfos.endorserTotalPoint || 0 }}
            components={{
              Text: <Text as="span" />,
            }}
          />
        </Text>

        <Popover placement="bottom-end" isLazy>
          <PopoverTrigger>
            <Box as="button">
              <HiDotsVertical />
            </Box>
          </PopoverTrigger>
          <PopoverContent width="auto" boxShadow="md" border="1px solid #EFEFEF">
            <PopoverBody p={2}>
              <VStack alignItems="stretch" spacing={3}>
                {isAppAdmin && (
                  <HStack color="#C84968" onClick={handleRemoveClick} cursor="pointer">
                    <UilTrash />
                    <Text whiteSpace="nowrap" fontSize={["sm", "md"]}>
                      {t("Remove this endorsement")}
                    </Text>
                  </HStack>
                )}
                <HStack onClick={goToEndorserUserProfilePage} cursor="pointer">
                  <UilCheck color={"#004CFC"} />
                  <Text fontSize={["sm", "md"]}>{t("See endorser info")}</Text>
                </HStack>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>
    </HStack>
  )
}
