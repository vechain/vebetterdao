/**
 * Map strength level coming from contract to hq image
 */
export const NodeStrengthLevelToImage: { [key: string]: string } = {
  "0": "/assets/images/nodes/00-noNode.webp",
  "1": "/assets/images/nodes/01-strength.webp",
  "2": "/assets/images/nodes/02-thunder.webp",
  "3": "/assets/images/nodes/03-mjolnir.webp",
  "4": "/assets/images/nodes/04-vethorX.webp",
  "5": "/assets/images/nodes/05-strengthX.webp",
  "6": "/assets/images/nodes/06-thunderX.webp",
  "7": "/assets/images/nodes/07-mjolnirX.webp",
}
//after this level the nfts are considered node
export const MinXNodeLevel = 4
export const EconomicNodeStrengthLevelToName: { [key: string]: string } = {
  "1": "Strength",
  "2": "Thunder",
  "3": "Mjolnir",
}
export const XNodeStrengthLevelToName: { [key: string]: string } = {
  "4": "VeThorX",
  "5": "StrengthX",
  "6": "ThunderX",
  "7": "MjolnirX",
}
export const allNodeStrengthLevelToName: { [key: string]: string } = {
  ...EconomicNodeStrengthLevelToName,
  ...XNodeStrengthLevelToName,
}
