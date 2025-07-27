import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

import { cardSlotRecipe } from "./card"
import { dialogSlotRecipe } from "./dialog"
import { stepsSlotRecipe } from "./steps"

import { buttonRecipe } from "./button"
import { inputRecipe } from "./input"
import { nativeSelectRecipe } from "./native-select"
import { headingRecipe } from "./heading"

const config = defineConfig({
  preflight: true,
  globalCss: {
    body: {
      fontFamily: "var(--font-inter)",
    },
  },

  theme: {
    recipes: {
      heading: headingRecipe,
      button: buttonRecipe,
      input: inputRecipe,
      nativeSelect: nativeSelectRecipe,
    },

    slotRecipes: {
      card: cardSlotRecipe,
      dialog: dialogSlotRecipe,
      steps: stepsSlotRecipe,
    },

    // keyframes: {
    //   pulse: {
    //     "0%": { transform: "scale(1, 1)", opacity: 1 },
    //     "100%": { transform: "scale(1.5, 1.5)", opacity: 0 },
    //   },
    //   rotateBgPosition: {
    //     "0%": { backgroundPosition: "0% 50%" },
    //     "100%": { backgroundPosition: "100% 50%" },
    //   },

    //   backdropBlur: {
    //     "0%": { backdropFilter: "blur(0px)" },
    //     "100%": { backdropFilter: "blur(10px)" },
    //   },
    // },

    tokens: {
      // animations: {
      //   rotateBgPosition: { value: "rotateBgPosition 1.5s infinite alternate" },
      //   backdropBlur: { value: "backdropBlur 1s ease-in-out" },
      // },
    },
  },
})

export default createSystem(defaultConfig, config)
