import { UseFormReturn } from "react-hook-form"
import { EditAppForm } from "../EditAppPageContent"
import { useCurrentAppBanner, useCurrentAppLogo, useCurrentAppMetadata } from "@/app/apps/[appId]/hooks"
import { useSocialUrls } from "./useSocialUrls"
import { useCurrentAppScreenshots } from "@/app/apps/[appId]/hooks/useCurrentAppScreenshots"

export const useIsFormChanged = (form: UseFormReturn<EditAppForm, any, EditAppForm>) => {
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
    screenshots.some(screenshot => !form.watch("screenshots").includes(screenshot)) ||
    screenshots.length !== form.watch("screenshots").length
  const isSocialUrlsChanged =
    socialUrls.some(
      socialUrl => !appMetadata?.social_urls?.find(url => url.name === socialUrl.name && url.url === socialUrl.url),
    ) || socialUrls.length !== appMetadata?.social_urls?.length

  const isVeWorldBannerChanged = form.watch("ve_world_banner") !== appMetadata?.ve_world?.banner

  return (
    isNameChanged ||
    isDescriptionChanged ||
    isAppUrlChanged ||
    isLogoChanged ||
    isBannerChanged ||
    isScreenshotsChanged ||
    isSocialUrlsChanged ||
    isVeWorldBannerChanged
  )
}
