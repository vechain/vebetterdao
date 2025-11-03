export const getRandomValues = (arr: Uint8Array) => {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = Math.floor(Math.random() * 256)
  }
  return arr
}

export const randomBytes = (size: number) => {
  const arr = new Uint8Array(size)
  return getRandomValues(arr)
}

export default {
  getRandomValues,
  randomBytes,
}
