"use client"

import { useTranslation } from "react-i18next"

import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"

export const HistoryPageBreadcrumb = ({ roundId }: { roundId: number }) => {
  const { t } = useTranslation()
  return (
    <PageBreadcrumb
      items={[
        { label: t("Allocations"), href: "/allocations" },
        { label: t("Rounds history"), href: "/allocations/history" },
        { label: t("Round details"), href: `/allocations/history/${roundId}` },
      ]}
    />
  )
}
