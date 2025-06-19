import {
  VStack,
  Button,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  Heading,
  FormErrorMessage,
  Card,
  CardHeader,
  CardBody,
  Radio,
  RadioGroup,
  Text,
  Badge,
  HStack,
  Icon,
} from "@chakra-ui/react"
import { Icon as IconType, UilCheckCircle, UilExclamationCircle } from "@iconscout/react-unicons"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { useAdminCreatorNFT } from "@/hooks/useAdminCreatorNFT"
import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"
import { WalletAddressInput } from "@/app/components/Input"
import { useIsCreatorOfAnyApp, useAppsCountFromCreator } from "@/api"

type NFTFormInputs = {
  creatorWalletAddress: string
  tokenId: string
  lookupAddress: string
  actionType: string
  lookupCreatorAddress: string
}

export const ManageCreatorsNFT = () => {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NFTFormInputs>({
    defaultValues: {
      creatorWalletAddress: "",
      tokenId: "",
      lookupAddress: "",
      actionType: "mint",
      lookupCreatorAddress: "",
    },
  })

  const [tokenId, actionType, lookupAddress, creatorWalletAddress, lookupCreatorAddress] = watch([
    "tokenId",
    "actionType",
    "lookupAddress",
    "creatorWalletAddress",
    "lookupCreatorAddress",
  ])
  const { mintNFT, burnNFT } = useAdminCreatorNFT({
    walletAddress: creatorWalletAddress ?? "",
    tokenId: tokenId ?? "",
    onSuccess: () => {
      resetStatus()
    },
  })

  const hasNFT = useHasCreatorNFT(lookupAddress ?? "")
  const { data: hasAlreadySubmitted } = useIsCreatorOfAnyApp(lookupCreatorAddress ?? "")
  const { data: creatorApps } = useAppsCountFromCreator(lookupCreatorAddress ?? "")

  const { sendTransaction, resetStatus } = useMemo(() => {
    return actionType === "mint" ? mintNFT : burnNFT
  }, [actionType, mintNFT, burnNFT])

  const check = useMemo(() => ["check-submitted-apps", "check-ownership"], [])
  const onSubmit = useCallback(() => {
    if (!check.includes(actionType)) {
      resetStatus()
      sendTransaction()
    }
  }, [actionType, resetStatus, sendTransaction, check])

  const renderBadge = (colorScheme: string, icon: IconType, text: string) => (
    <Badge
      textTransform="none"
      fontSize="sm"
      colorScheme={colorScheme}
      display="flex"
      alignItems="center"
      borderRadius="12px"
      p={2}>
      <HStack align="start" spacing={2}>
        <Icon as={icon} color={colorScheme === "green" ? "green.500" : "red.500"} />
        <Text as="span" wordBreak="break-word" whiteSpace="normal">
          {text}
        </Text>
      </HStack>
    </Badge>
  )

  return (
    <Card w="full">
      <CardHeader>
        <Heading size="lg">{t("Manage Creator NFT")}</Heading>
      </CardHeader>

      <CardBody>
        <VStack spacing={8} align="start" w="full">
          <RadioGroup defaultValue="mint">
            <VStack align="start">
              <Radio {...register("actionType", { required: true })} value="mint">
                {t("Mint NFT")}
              </Radio>
              <Radio {...register("actionType", { required: true })} value="burn">
                {t("Burn NFT")}
              </Radio>
              <Radio {...register("actionType", { required: true })} value="check-ownership">
                {t("Check Ownership")}
              </Radio>
              <Radio {...register("actionType", { required: true })} value="check-submitted-apps">
                {t("Check submitted apps")}
              </Radio>
            </VStack>
          </RadioGroup>

          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <VStack spacing={4} align="start">
              {actionType === "mint" && (
                <FormControl>
                  <FormLabel>
                    <strong>{t("Wallet Address")}</strong>
                  </FormLabel>
                  <InputGroup>
                    <WalletAddressInput
                      onAddressResolved={address => setValue("creatorWalletAddress", address ?? "")}
                    />
                  </InputGroup>
                </FormControl>
              )}
              {actionType === "burn" && (
                <FormControl isRequired isInvalid={Boolean(errors.tokenId)}>
                  <FormLabel>
                    <strong>{t("Token ID")}</strong>
                  </FormLabel>
                  <InputGroup>
                    <Input
                      placeholder={t("Enter the token ID")}
                      {...register("tokenId", {
                        required: actionType === "burn",
                      })}
                    />
                  </InputGroup>
                  {errors.tokenId && <FormErrorMessage>{errors.tokenId.message}</FormErrorMessage>}
                </FormControl>
              )}
              {actionType === "check-ownership" && (
                <FormControl>
                  <FormLabel>
                    <strong>{t("Lookup Wallet Address")}</strong>
                  </FormLabel>
                  <InputGroup>
                    <WalletAddressInput onAddressResolved={address => setValue("lookupAddress", address ?? "")} />
                  </InputGroup>
                  {lookupAddress && (
                    <VStack mt={2} align="start">
                      {renderBadge(
                        hasNFT ? "green" : "red",
                        hasNFT ? UilCheckCircle : UilExclamationCircle,
                        hasNFT ? t("This address holds the NFT.") : t("This address does not hold the NFT."),
                      )}
                    </VStack>
                  )}
                </FormControl>
              )}
              {actionType === "check-submitted-apps" && (
                <FormControl>
                  <FormLabel>
                    <strong>{t("Lookup Wallet Address")}</strong>
                  </FormLabel>
                  <InputGroup>
                    <WalletAddressInput
                      onAddressResolved={address => setValue("lookupCreatorAddress", address ?? "")}
                    />
                  </InputGroup>
                  {lookupCreatorAddress && (
                    <VStack mt={2} align="start">
                      {renderBadge(
                        hasAlreadySubmitted ? "green" : "red",
                        hasAlreadySubmitted ? UilCheckCircle : UilExclamationCircle,
                        hasAlreadySubmitted
                          ? t("This address have submitted {{count}} apps.", { count: creatorApps })
                          : t("This address have not submitted app."),
                      )}
                    </VStack>
                  )}
                </FormControl>
              )}

              {!check.includes(actionType) && (
                <Button
                  colorScheme="blue"
                  type="submit"
                  isDisabled={actionType === "mint" ? !creatorWalletAddress : !tokenId}>
                  {t(actionType === "mint" ? "Mint" : "Burn")}
                </Button>
              )}
            </VStack>
          </form>
        </VStack>
      </CardBody>
    </Card>
  )
}
