import React from "react"
import { Breadcrumb, Text } from "@chakra-ui/react"
import { BsChevronRight } from "react-icons/bs"

type PageBreadcrumbProps = {
  items: {
    label: string
    href: string
  }[]
}

export const PageBreadcrumb = ({ items }: PageBreadcrumbProps) => {
  return (
    <Breadcrumb.Root fontSize="lg">
      <Breadcrumb.List gap={2}>
        {items.map((item, index) => {
          const isCurrentPage = window.location.pathname === item.href
          const isLast = index === items.length - 1

          return (
            <React.Fragment key={item.label}>
              <Breadcrumb.Item>
                {isCurrentPage || isLast ? (
                  <Breadcrumb.CurrentLink>
                    <Text fontWeight="bold" color={index === 0 ? "#747C89" : "auto"}>
                      {item.label}
                    </Text>
                  </Breadcrumb.CurrentLink>
                ) : (
                  <Breadcrumb.Link href={item.href}>
                    <Text fontWeight="bold" color={index === 0 ? "#747C89" : "auto"}>
                      {item.label}
                    </Text>
                  </Breadcrumb.Link>
                )}
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
