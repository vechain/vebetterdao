import { Breadcrumb } from "@chakra-ui/react"
import NextLink from "next/link"
import React from "react"

type PageBreadcrumbProps = {
  items: {
    label: string
    href: string
  }[]
}

export const PageBreadcrumb = ({ items }: PageBreadcrumbProps) => {
  return (
    <Breadcrumb.Root>
      <Breadcrumb.List>
        {items.map((item, index) => (
          <>
            <Breadcrumb.Item>
              <Breadcrumb.Link asChild>
                <NextLink href={item.href}>{item.label}</NextLink>
              </Breadcrumb.Link>
            </Breadcrumb.Item>

            {items.length - 1 !== index && <Breadcrumb.Separator />}
          </>
        ))}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  )
}
