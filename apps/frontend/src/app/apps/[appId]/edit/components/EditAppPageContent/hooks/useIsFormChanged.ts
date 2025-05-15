import { UseFormReturn } from "react-hook-form"
import { EditAppForm } from "../EditAppPageContent"
import { useCurrentAppBanner, useCurrentAppLogo, useCurrentAppMetadata } from "@/app/apps/[appId]/hooks"
import { useSocialUrls } from "./useSocialUrls"
import { useCurrentAppScreenshots } from "@/app/apps/[appId]/hooks/useCurrentAppScreenshots"

export const useIsFormChanged = (form: UseFormReturn<EditAppForm, any, undefined>) => {
  const { logo } = useCurrentAppLogo()
  const { banner } = useCurrentAppBanner()
  const { appMetadata } = useCurrentAppMetadata()
  const { screenshots } = useCurrentAppScreenshots()

  const socialUrls = useSocialUrls(form)
  const isLogoChanged = form.watch("logoImage") !== logo
  const isBannerChanged = form.watch("bannerImage") !== banner
  const isNameChanged = form.watch("name") !== appMetadata?.name
  const isAppUrlChanged = form.watch("external_url") !== appMetadata?.external_url
  const isDescriptionChanged = form.watch("description") !== appMetadata?.description
  const isScreenshotsChanged =
    screenshots.length !== form.watch("screenshots").length ||
    screenshots.some((screenshot, index) => screenshot !== form.watch("screenshots")[index])

  const isSocialUrlsChanged =
    socialUrls.some(
      socialUrl => !appMetadata?.social_urls?.find(url => url.name === socialUrl.name && url.url === socialUrl.url),
    ) || socialUrls.length !== appMetadata?.social_urls?.length

  const isVeWorldBannerChanged = form.watch("ve_world_bannerImage") !== appMetadata?.ve_world?.banner
  const isDistributionStrategyChanged =
    form.watch("distribution_strategy") !== appMetadata?.distribution_strategy && !!form.watch("distribution_strategy")
  const isCategoriesChanged = form.watch("categories") !== appMetadata?.categories && !!form.watch("categories")

  return (
    isNameChanged ||
    isDescriptionChanged ||
    isAppUrlChanged ||
    isLogoChanged ||
    isBannerChanged ||
    isScreenshotsChanged ||
    isSocialUrlsChanged ||
    isVeWorldBannerChanged ||
    isDistributionStrategyChanged ||
    isCategoriesChanged
  )
}
