import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Text } from "@chakra-ui/react"
import { BsChevronRight } from "react-icons/bs"

type PageBreadcrumbProps = {
  items: {
    label: string
    href: string
  }[]
}

export const PageBreadcrumb = ({ items }: PageBreadcrumbProps) => {
  return (
    <Breadcrumb spacing={2} fontSize="lg" separator={<BsChevronRight size={16} />}>
      {items.map((item, index) => (
        <BreadcrumbItem key={item.label} isCurrentPage={window.location.pathname === item.href}>
          <BreadcrumbLink href={item.href}>
            <Text fontWeight="bold" color={index === 0 ? "#747C89" : "auto"}>
              {item.label}
            </Text>
          </BreadcrumbLink>
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  )
}
