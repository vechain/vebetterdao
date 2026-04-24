import { Button, Field, Heading, HStack, Input, Switch, Text, Textarea, VStack } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { getGetMetadataURIQueryKey } from "@/api/contracts/navigatorRegistry/hooks/useGetMetadataURI"
import { NavigatorMetadata } from "@/api/indexer/navigators/useNavigatorMetadata"
import { BaseModal } from "@/components/BaseModal"
import { useUpdateNavigatorMetadata } from "@/hooks/navigator/useUpdateNavigatorMetadata"
import { uploadBlobToIPFS } from "@/utils/ipfs"

type FormData = {
  motivation: string
  qualifications: string
  votingStrategy: string
  isAppAffiliated: boolean
  affiliatedAppNames: string
  isFoundationMember: boolean
  foundationRole: string
  hasConflictsOfInterest: boolean
  conflictsDescription: string
  twitter: string
  discord: string
  website: string
}

const fromMetadata = (m: NavigatorMetadata): FormData => ({
  motivation: m.motivation ?? "",
  qualifications: m.qualifications ?? "",
  votingStrategy: m.votingStrategy ?? "",
  isAppAffiliated: m.disclosures?.isAppAffiliated ?? false,
  affiliatedAppNames: m.disclosures?.affiliatedAppNames ?? "",
  isFoundationMember: m.disclosures?.isFoundationMember ?? false,
  foundationRole: m.disclosures?.foundationRole ?? "",
  hasConflictsOfInterest: m.disclosures?.hasConflictsOfInterest ?? false,
  conflictsDescription: m.disclosures?.conflictsDescription ?? "",
  twitter: m.socials?.twitter ?? "",
  discord: m.socials?.discord ?? "",
  website: m.socials?.website ?? "",
})

const toMetadata = (form: FormData, original: NavigatorMetadata): NavigatorMetadata => ({
  ...original,
  motivation: form.motivation,
  qualifications: form.qualifications,
  votingStrategy: form.votingStrategy,
  disclosures: {
    isAppAffiliated: form.isAppAffiliated,
    affiliatedAppNames: form.affiliatedAppNames,
    isFoundationMember: form.isFoundationMember,
    foundationRole: form.foundationRole,
    hasConflictsOfInterest: form.hasConflictsOfInterest,
    conflictsDescription: form.conflictsDescription,
  },
  socials: {
    twitter: form.twitter,
    discord: form.discord,
    website: form.website,
    other: original.socials?.other ?? "",
  },
})

const ToggleField = ({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) => (
  <HStack justify="space-between" w="full">
    <Text textStyle="sm">{label}</Text>
    <Switch.Root checked={checked} onCheckedChange={e => onCheckedChange(e.checked)} colorPalette="blue" size="sm">
      <Switch.HiddenInput />
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
    </Switch.Root>
  </HStack>
)

type Props = {
  isOpen: boolean
  onClose: () => void
  address: string
  metadata: NavigatorMetadata
}

export const EditNavigatorProfileModal = ({ isOpen, onClose, address, metadata }: Props) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormData>(() => fromMetadata(metadata))
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (isOpen) setForm(fromMetadata(metadata))
  }, [isOpen, metadata])

  const update = (partial: Partial<FormData>) => setForm(prev => ({ ...prev, ...partial }))

  const handleSuccess = useCallback(() => {
    // Refetch the on-chain metadataURI; the new URI then drives a fresh IPFS fetch.
    queryClient.invalidateQueries({ queryKey: getGetMetadataURIQueryKey(address) })
    onClose()
  }, [onClose, queryClient, address])

  const { sendTransaction, status } = useUpdateNavigatorMetadata({ onSuccess: handleSuccess })

  const canSave =
    form.motivation.trim().length > 0 &&
    form.qualifications.trim().length > 0 &&
    (!form.isAppAffiliated || form.affiliatedAppNames.trim().length > 0) &&
    (!form.isFoundationMember || form.foundationRole.trim().length > 0) &&
    (!form.hasConflictsOfInterest || form.conflictsDescription.trim().length > 0)

  const onSave = async () => {
    setIsUploading(true)
    try {
      const newMetadata = toMetadata(form, metadata)
      const blob = new Blob([JSON.stringify(newMetadata)], { type: "application/json" })
      const ipfsHash = await uploadBlobToIPFS(blob, "navigator-metadata.json")
      await sendTransaction({ metadataURI: `ipfs://${ipfsHash}` })
    } catch (error) {
      console.error("Failed to update metadata:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const isSubmitting = isUploading || status === "pending"

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaTitle={t("Edit Profile")} showCloseButton>
      <VStack gap={5} align="stretch" py={4} px={2}>
        <Heading size="lg">{t("Edit Profile")}</Heading>

        <VStack gap={4} align="stretch">
          <Field.Root>
            <Field.Label>{t("Voting Strategy")}</Field.Label>
            <Textarea
              value={form.votingStrategy}
              onChange={e => update({ votingStrategy: e.target.value })}
              rows={3}
              maxLength={1000}
              size="sm"
            />
          </Field.Root>

          <Field.Root required>
            <Field.Label>{t("Motivation")}</Field.Label>
            <Textarea
              value={form.motivation}
              onChange={e => update({ motivation: e.target.value })}
              rows={3}
              maxLength={1000}
              size="sm"
            />
          </Field.Root>

          <Field.Root required>
            <Field.Label>{t("Qualifications")}</Field.Label>
            <Textarea
              value={form.qualifications}
              onChange={e => update({ qualifications: e.target.value })}
              rows={3}
              maxLength={1000}
              size="sm"
            />
          </Field.Root>
        </VStack>

        <VStack gap={4} align="stretch">
          <Heading size="md">{t("Disclosures")}</Heading>

          <ToggleField
            label={t("Are you affiliated with any VeBetterDAO app?")}
            checked={form.isAppAffiliated}
            onCheckedChange={checked => update({ isAppAffiliated: checked })}
          />
          {form.isAppAffiliated && (
            <Field.Root required>
              <Field.Label>{t("App names")}</Field.Label>
              <Input
                placeholder={t("e.g. Mugshot, GreenCart")}
                value={form.affiliatedAppNames}
                onChange={e => update({ affiliatedAppNames: e.target.value })}
                size="sm"
              />
            </Field.Root>
          )}

          <ToggleField
            label={t("Are you a VeChain Foundation member or employee?")}
            checked={form.isFoundationMember}
            onCheckedChange={checked => update({ isFoundationMember: checked })}
          />
          {form.isFoundationMember && (
            <Field.Root required>
              <Field.Label>{t("Role")}</Field.Label>
              <Input
                placeholder={t("e.g. Developer Relations")}
                value={form.foundationRole}
                onChange={e => update({ foundationRole: e.target.value })}
                size="sm"
              />
            </Field.Root>
          )}

          <ToggleField
            label={t("Do you have any other conflicts of interest to disclose?")}
            checked={form.hasConflictsOfInterest}
            onCheckedChange={checked => update({ hasConflictsOfInterest: checked })}
          />
          {form.hasConflictsOfInterest && (
            <Field.Root required>
              <Field.Label>{t("Description")}</Field.Label>
              <Textarea
                placeholder={t("Describe any conflicts...")}
                value={form.conflictsDescription}
                onChange={e => update({ conflictsDescription: e.target.value })}
                rows={3}
                maxLength={500}
                size="sm"
              />
            </Field.Root>
          )}
        </VStack>

        <VStack gap={4} align="stretch">
          <Heading size="md">{t("Social Profiles")}</Heading>

          <Field.Root>
            <Field.Label>{t("Twitter / X")}</Field.Label>
            <Input value={form.twitter} onChange={e => update({ twitter: e.target.value })} size="sm" />
          </Field.Root>

          <Field.Root>
            <Field.Label>{t("Discord")}</Field.Label>
            <Input value={form.discord} onChange={e => update({ discord: e.target.value })} size="sm" />
          </Field.Root>

          <Field.Root>
            <Field.Label>{t("Website or Blog")}</Field.Label>
            <Input value={form.website} onChange={e => update({ website: e.target.value })} size="sm" />
          </Field.Root>
        </VStack>

        <HStack gap={3} justify="end" pt={2}>
          <Button variant="secondary" onClick={onClose} size="lg">
            {t("Cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            disabled={!canSave || isSubmitting}
            loading={isSubmitting}
            size="lg">
            {t("Save")}
          </Button>
        </HStack>
      </VStack>
    </BaseModal>
  )
}
