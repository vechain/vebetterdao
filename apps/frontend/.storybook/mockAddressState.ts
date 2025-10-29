let GLOBAL_MOCK_ADDRESS: string | undefined

export const setMockAddress = (address?: string) => {
  GLOBAL_MOCK_ADDRESS = address
}

export const getMockAddress = () => GLOBAL_MOCK_ADDRESS
