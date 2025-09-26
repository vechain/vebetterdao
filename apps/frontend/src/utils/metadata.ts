import { Metadata } from "next"
import { APPLICATION_NAME, IMAGE_DIMENSION, pagesMetadata } from "@/metadata/pages"
import { getConfig } from "@repo/config"

export function getPageMetadata(pageKey: string): Metadata {
  const pageData = pagesMetadata[pageKey as keyof typeof pagesMetadata]
  const basePath = getConfig().basePath
  const pathname = pageData.path ? `${basePath}${pageData.path}` : `${basePath}`

  if (!pageData) {
    return {
      applicationName: APPLICATION_NAME,
      title: "VeBetter",
      description: "VeBetter - Governance platform for sustainability and Web3 impact",
    }
  }

  return {
    applicationName: APPLICATION_NAME,
    title: pageData.title,
    description: pageData.description,
    openGraph: {
      title: pageData.title,
      siteName: APPLICATION_NAME,
      url: pathname,
      description: pageData.description,
      type: "website",
      images: [
        {
          url: `${basePath}${pageData.image}`,
          type: pageData.imageExtension,
          width: IMAGE_DIMENSION.width,
          height: IMAGE_DIMENSION.height,
          alt: pageData.title,
        },
      ],
    },
    twitter: {
      title: pageData.title,
      site: pathname,
      description: pageData.description,
      images: [`${basePath}${pageData.image}`],
      card: "summary_large_image",
    },
  }
}
