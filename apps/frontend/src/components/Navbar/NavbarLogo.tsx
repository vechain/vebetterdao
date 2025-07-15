import Link from "next/link"
import { usePathname } from "next/navigation"
import { VeBetterDaoLogo } from "../VeBetterDaoLogo"

export const NavbarLogo = () => {
  const pathname = usePathname()
  const isHome = pathname === "/"
  return (
    <Link href={isHome ? "" : "/"}>
      <VeBetterDaoLogo />
    </Link>
  )
}
