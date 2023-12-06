import { Button, VStack } from "@chakra-ui/react";
import { VechainLogo } from "./VechainLogo";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { usePathname } from "next/navigation";

const Menu = [
  { name: "Home", href: "/" },
  { name: "Staking", href: "/staking" },
];

const MenuButtons = () => {
  const pathname = usePathname();

  return (
    <VStack spacing={1}>
      {Menu.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Button
            as="a"
            key={item.name}
            variant={isActive ? "solid" : "ghost"}
            colorScheme={isActive ? "blue" : undefined}
            w="full"
            justifyContent="center"
            href={item.href}
          >
            {item.name}
          </Button>
        );
      })}
    </VStack>
  );
};

export const SideBar = () => {
  return (
    <VStack
      px={12}
      py={6}
      as="aside"
      h="100vh"
      position={"sticky"}
      top={0}
      left={0}
      boxShadow={"md"}
      mr="8"
      justify="space-between"
    >
      <VechainLogo />
      <MenuButtons />
      <ThemeSwitcher />
    </VStack>
  );
};
