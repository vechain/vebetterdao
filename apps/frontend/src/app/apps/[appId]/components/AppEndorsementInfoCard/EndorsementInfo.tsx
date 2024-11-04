import { useEndorsementInfos } from "@/hooks/useEndorsementData"
import { Text, HStack, VStack, Box } from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"
import { AddressIcon } from "@/components/AddressIcon"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useState } from "react"
import { normalize } from "@repo/utils/HexUtils"

import { useWallet } from "@vechain/dapp-kit-react"

import { HiDotsVertical } from "react-icons/hi"
import { UilTrash, UilCheck } from "@iconscout/react-unicons"

type EndorsementInfoProps = {
  appId: string
  endorserAddress: string
  isConfirmOpen: boolean
  setIsConfirmOpen: (value: boolean) => void
}

export const EndorsementInfo = ({ appId, endorserAddress, isConfirmOpen, setIsConfirmOpen }: EndorsementInfoProps) => {
  const endorsementInfos = useEndorsementInfos(appId, endorserAddress)
  const { account } = useWallet()
  const { t } = useTranslation()

  const [isAccordionOpen, setIsAccordionOpen] = useState(false)

  const endorsemenInfos = () => {
    setIsAccordionOpen(!isAccordionOpen)
  }

  const handleRemoveClick = () => {
    setIsConfirmOpen(true)
    setIsAccordionOpen(false)
    console.log("isConfirmOpen", isConfirmOpen)
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
        {account && endorserAddress === normalize(account) && (
          <Box as="button" onClick={endorsemenInfos}>
            <HiDotsVertical />
          </Box>
        )}
      </HStack>

      {isAccordionOpen && (
        <VStack
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="white"
          border={"1px solid #EFEFEF"}
          boxShadow="md"
          rounded="md"
          alignItems="stretch"
          p={3}
          spacing={3}
          justify={"space-between"}>
          {" "}
          <HStack color="#C84968" onClick={handleRemoveClick} cursor="pointer">
            <UilTrash />
            <Text>{t("Remove this endorsement")}</Text>
          </HStack>
          <HStack onClick={() => setIsAccordionOpen(false)} cursor="pointer">
            <UilCheck color={"#004CFC"} />
            <Text>{t("See endorser info")}</Text>
          </HStack>
        </VStack>
      )}
    </HStack>
  )
}
