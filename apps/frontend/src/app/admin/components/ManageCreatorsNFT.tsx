import {
  VStack,
  Button,
  Field,
  InputGroup,
  Input,
  Heading,
  Card,
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

  const { data: hasNFT } = useHasCreatorNFT(lookupAddress ?? "")
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
      colorPalette={colorScheme}
      display="flex"
      alignItems="center"
      borderRadius="12px"
      p={2}>
      <HStack align="start" gap={2}>
        <Icon as={icon} color={colorScheme === "green" ? "green.500" : "red.500"} />
        <Text as="span" wordBreak="break-word" whiteSpace="normal">
          {text}
        </Text>
      </HStack>
    </Badge>
  )

  return (
    <Card.Root w="full">
      <Card.Header>
        <Heading size="lg">{t("Manage Creator NFT")}</Heading>
      </Card.Header>

      <Card.Body>
        <VStack gap={8} align="start" w="full">
          <RadioGroup.Root
            defaultValue="mint"
            onValueChange={details => {
              if (details.value) setValue("actionType", details.value)
            }}>
            <VStack align="start">
              <RadioGroup.Item {...register("actionType", { required: true })} value="mint">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{t("Mint NFT")}</RadioGroup.ItemText>
              </RadioGroup.Item>
              <RadioGroup.Item {...register("actionType", { required: true })} value="burn">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{t("Burn NFT")}</RadioGroup.ItemText>
              </RadioGroup.Item>
              <RadioGroup.Item {...register("actionType", { required: true })} value="check-ownership">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{t("Check Ownership")}</RadioGroup.ItemText>
              </RadioGroup.Item>
              <RadioGroup.Item {...register("actionType", { required: true })} value="check-submitted-apps">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{t("Check submitted apps")}</RadioGroup.ItemText>
              </RadioGroup.Item>
            </VStack>
          </RadioGroup.Root>

          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <VStack gap={4} align="start">
              {actionType === "mint" && (
                <Field.Root>
                  <Field.Label>
                    <strong>{t("Wallet Address")}</strong>
                  </Field.Label>
                  <InputGroup>
                    <WalletAddressInput
                      onAddressResolved={address => setValue("creatorWalletAddress", address ?? "")}
                    />
                  </InputGroup>
                </Field.Root>
              )}
              {actionType === "burn" && (
                <Field.Root required invalid={Boolean(errors.tokenId)}>
                  <Field.Label>
                    <strong>{t("Token ID")}</strong>
                  </Field.Label>
                  <InputGroup>
                    <Input
                      placeholder={t("Enter the token ID")}
                      {...register("tokenId", {
                        required: actionType === "burn",
                      })}
                    />
                  </InputGroup>
                  {errors.tokenId && <Field.ErrorText>{errors.tokenId.message}</Field.ErrorText>}
                </Field.Root>
              )}
              {actionType === "check-ownership" && (
                <Field.Root>
                  <Field.Label>
                    <strong>{t("Lookup Wallet Address")}</strong>
                  </Field.Label>
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
                </Field.Root>
              )}
              {actionType === "check-submitted-apps" && (
                <Field.Root>
                  <Field.Label>
                    <strong>{t("Lookup Wallet Address")}</strong>
                  </Field.Label>
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
                </Field.Root>
              )}

              {!check.includes(actionType) && (
                <Button
                  colorPalette="blue"
                  type="submit"
                  disabled={actionType === "mint" ? !creatorWalletAddress : !tokenId}>
                  {t(actionType === "mint" ? "Mint" : "Burn")}
                </Button>
              )}
            </VStack>
          </form>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
