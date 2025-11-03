// Mock for @vechain/picasso package
// Returns placeholder SVG for address-based avatar generation

const picasso = (address: string): string => {
  // Simple placeholder SVG with color based on first character of address
  const colorMap: Record<string, string> = {
    "0": "#FF6B6B",
    "1": "#4ECDC4",
    "2": "#45B7D1",
    "3": "#FFA07A",
    "4": "#98D8C8",
    "5": "#F7DC6F",
    "6": "#BB8FCE",
    "7": "#85C1E2",
    "8": "#F8B88B",
    "9": "#FAD7A0",
    a: "#AED6F1",
    b: "#A9DFBF",
    c: "#F9E79F",
    d: "#FADBD8",
    e: "#D7BDE2",
    f: "#A3E4D7",
  }

  const firstChar = address.toLowerCase().charAt(2) || "0"
  const color = colorMap[firstChar] || "#95A5A6"

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="${color}"/>
    <circle cx="50" cy="50" r="30" fill="rgba(255,255,255,0.3)"/>
  </svg>`
}

export default picasso
