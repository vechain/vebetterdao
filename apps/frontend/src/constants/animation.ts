export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
}
export const flipAnimation = {
  animate: {
    rotateY: [0, 360],
    scale: [1, 0.7, 1],
    borderRadius: ["20%", "50%", "20%"],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
}
export const coinFlipAnimation = {
  animate: {
    rotateY: [0, 180, 360], // Complete flip
    translateY: [0, -100, 0], // Jump up and down
    scale: [1, 1.2, 1], // Slightly grow in the middle of the jump
    transition: {
      rotateY: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 1.2,
        ease: "easeInOut",
      },
      translateY: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 1.2,
        ease: "easeInOut",
        times: [0, 0.5, 1], // Ensures the jump is in the middle of the flip
      },
      scale: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 1.2,
        ease: "easeInOut",
        times: [0, 0.5, 1], // Scale up at the peak of the jump
      },
      delay: 0.5, // Pause before repeating the animation
    },
  },
}
