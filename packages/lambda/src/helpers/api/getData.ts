/**
 * Fetches data from the given URL and returns the parsed JSON response.
 *
 * @param url - The URL to fetch data from.
 * @returns A promise that resolves to the parsed JSON response.
 * @throws An error if the fetch response is not ok.
 */
export const getData = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Fetch response status ${response.status}`)
  }

  return await response.json()
}
