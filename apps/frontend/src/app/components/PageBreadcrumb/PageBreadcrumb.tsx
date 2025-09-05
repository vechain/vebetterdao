import React from "react"
import { Breadcrumb, Text } from "@chakra-ui/react"
import Link from "next/link"
import { BsChevronRight } from "react-icons/bs"

type PageBreadcrumbProps = {
  items: {
    label: string
    href: string
  }[]
}

export const PageBreadcrumb = ({ items }: PageBreadcrumbProps) => {
  return (
    <Breadcrumb.Root>
      <Breadcrumb.List gap={2}>
        {items.map((item, index) => {
          const isCurrentPage = window.location.pathname === item.href
          const isLast = index === items.length - 1
          const highlightedText = isCurrentPage || isLast
          const fontWeight = highlightedText ? "bold" : "normal"
          const color = highlightedText ? "text.default" : "text.subtle"

          return (
            <React.Fragment key={item.label}>
              <Breadcrumb.Item fontSize="lg">
                <Breadcrumb.Link asChild aria-current={isCurrentPage ? "page" : undefined}>
                  <Link href={item.href}>
                    <Text fontWeight={fontWeight} color={color}>
                      {item.label}
                    </Text>
                  </Link>
                </Breadcrumb.Link>
              </Breadcrumb.Item>
              {!isLast && (
                <Breadcrumb.Separator>
                  <BsChevronRight size={16} />
                </Breadcrumb.Separator>
              )}
            </React.Fragment>
          )
        })}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  )
}
