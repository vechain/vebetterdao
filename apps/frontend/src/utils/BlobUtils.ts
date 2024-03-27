export const downloadBlob = async (url: string) => {
  const response = await fetch(url)
  return response.blob()
}

export const blobToBase64 = async (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
    reader.onerror = reject
  })

// return a promise that resolves with a File instance
export const base64UrlToFile = async (base64Url: string, filename: string, mimeType: string) => {
  if (base64Url.startsWith("data:")) {
    const arr = base64Url.split(",")
    const mime = arr[0]?.match(/:(.*?);/)[1]
    const bstr = atob(arr[arr.length - 1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    const file = new File([u8arr], filename, { type: mime || mimeType })
    return Promise.resolve(file)
  }
  return fetch(base64Url)
    .then(res => res.arrayBuffer())
    .then(buf => new File([buf], filename, { type: mimeType }))
}

export const base64ToBlob = (base64: string, mimeType: string) => {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}
