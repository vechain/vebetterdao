
import Link from "next/link"
import { usePathname } from "next/navigation"
import { VeBetterDaoLogo } from "../VeBetterDaoLogo"

export const NavbarLogo = () => {
  const pathname = usePathname()

  if (pathname !== "/")
    return (
      <Link href={"/"}>
        <VeBetterDaoLogo />
      </Link>
    )
  return <VeBetterDaoLogo />
}
