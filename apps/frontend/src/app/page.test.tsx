import { expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import Home from "./page"

test("Page", () => {
  render(<Home />)
  expect(screen.getByTestId("homepage")).toBeDefined()
})
