import Link from "next/link"
import { usePathname } from "next/navigation"
import { VechainLogo } from "../VechainLogo"

export const NavbarLogo = () => {
  const pathname = usePathname()

  if (pathname !== "/")
    return (
      <Link href={"/"}>
        <VechainLogo />
      </Link>
    )
  return <VechainLogo />
}
