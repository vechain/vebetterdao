export const gmNfts = [
  {
    level: "1",
    name: "Earth",
    image: "/assets/images/nft-levels/0.webp",
    multiplier: 0,
    b3trToUpgrade: 0,
  },
  {
    level: "2",
    name: "Moon",
    image: "/assets/images/nft-levels/1.webp",
    multiplier: 1.1,
    b3trToUpgrade: 5_000,
  },
  {
    level: "3",
    name: "Mercury",
    image: "/assets/images/nft-levels/2.webp",
    multiplier: 1.2,
    b3trToUpgrade: 12_500,
  },
  {
    level: "4",
    name: "Venus",
    image: "/assets/images/nft-levels/3.webp",
    multiplier: 1.5,
    b3trToUpgrade: 25_000,
  },
  {
    level: "5",
    name: "Mars",
    image: "/assets/images/nft-levels/4.webp",
    multiplier: 2,
    b3trToUpgrade: 50_000,
  },
  {
    level: "6",
    name: "Jupiter",
    image: "/assets/images/nft-levels/5.webp",
    multiplier: 2.5,
    b3trToUpgrade: 125_000,
  },
  {
    level: "7",
    name: "Saturn",
    image: "/assets/images/nft-levels/6.webp",
    multiplier: 3,
    b3trToUpgrade: 250_000,
  },
  {
    level: "8",
    name: "Uranus",
    image: "/assets/images/nft-levels/7.webp",
    multiplier: 5,
    b3trToUpgrade: 1_250_000,
  },
  {
    level: "9",
    name: "Neptune",
    image: "/assets/images/nft-levels/8.webp",
    multiplier: 10,
    b3trToUpgrade: 2_500_000,
  },
  {
    level: "10",
    name: "Galaxy",
    image: "/assets/images/nft-levels/9.webp",
    multiplier: 25,
    b3trToUpgrade: 12_500_000,
  },
]

/**
 * Maps the XNode level to the GM starting level.
 */
export const xNodeToGMstartingLevel: Record<number, number> = {
  1: 2,
  2: 4,
  3: 6,
  4: 2,
  5: 4,
  6: 6,
  7: 7,
}
