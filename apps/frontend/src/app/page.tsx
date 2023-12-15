"use client";

import { Box, Heading, Text } from "@chakra-ui/react";

export default function Home() {
  return (
    <Box>
      <Heading as="h1" size="2xl">
        Welcome to the B3TR demo
      </Heading>
      <Text>
        Use the navigation bar on the left to navigate to the different pages.
      </Text>
    </Box>
  );
}
