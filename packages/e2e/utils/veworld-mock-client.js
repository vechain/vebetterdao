import { readFileSync } from 'fs'

/**
 * Installs the mock onto the page
 */
const install = async (page) => {
    await page.evaluate(() => { 
        window['veworld-mock-config']['controller']().installMock()
      })
}

/**
 * Loads the mock js file into the page
 */
const load = async (page) => {
  await page.addInitScript({
      content: readFileSync('dist/veworld-mock.js', 'utf-8')
    })
}

/**
 * Get the address of the account in the mock
 */
const getMockAddress = async (page) => {
    return await page.evaluate(() => { 
        return window['veworld-mock-config']['controller']().getAccAddress()
      })
}

/**
 * Set the account index to use in the mock
 */
const setAccIndex = async (page, index) => {
    await page.evaluate((index) => { 
        window['veworld-mock-config']['controller']().setAccIndex(index - 1)
      }, index)
}

/**
 * Sets the thor url in the mock
 */
const setThorUrl = async (page, url) => {
    await page.evaluate((url) => { 
        window['veworld-mock-config']['controller']().setThorUrl(url)
      }, url)
}

/**
 * Get the tx id of the last signed tx
 */
const getTxId = async (page) => {
    return await page.evaluate(() => { 
        return window['veworld-mock-config']['controller']().getTxId()
      })
}

const veworldMockClient = {
    install: install,
    load: load,
    getMockAddress: getMockAddress,
    setSignerAccIndex: setAccIndex,
    setThorUrl: setThorUrl,
    getTxId: getTxId
}
export default veworldMockClient