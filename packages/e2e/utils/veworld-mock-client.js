import { readFileSync } from 'fs'


// Installs the mock onto the page
const install = async (page) => {
    await page.evaluate(() => { 
        window['veworld-mock-config']['controller']().installMock()
      })
}

// Loads the js file into the page
const load = async (page) => {
  await page.addInitScript({
      content: readFileSync('dist/veworld-mock.js', 'utf-8')
    })
}

// Sets the thor url in the mock
const setThorUrl = async (page, url) => {
  await page.evaluate((url) => { 
      window['veworld-mock-config']['controller']().setThorUrl(url)
    }, url)
}

// Sets the chain tag in the mock
const setChainTag = async(page, chainTag) => {
  await page.evaluate((chainTag) => { 
    window['veworld-mock-config']['controller']().setChainTag(chainTag)
  }, chainTag)
}

// Sets the mnemonic in the mock
const setMnemonic = async(page, words) => {
  await page.evaluate((words) => { 
    window['veworld-mock-config']['controller']().setMnemonic(words)
  }, words)
}

// Set the account index to use in the mock
const setAccIndex = async (page, index) => {
    await page.evaluate((index) => { 
        window['veworld-mock-config']['controller']().setAccIndex(index - 1)
      }, index)
}


// Get the tx id of the last signed tx
const getTxId = async (page) => {
    return await page.evaluate(() => { 
        return window['veworld-mock-config']['controller']().getTxId()
      })
}

// Get the address of the account in the mock
const getMockAddress = async (page) => {
  return await page.evaluate(() => { 
      return window['veworld-mock-config']['controller']().getAccAddress()
    })
}

// Set if cert signing should fail
const setCertError = async (page, errorFlag) => {
  await page.evaluate((errorFlag) => { 
    window['veworld-mock-config']['controller']().setCertError(errorFlag)
  }, errorFlag)
}

// Set if Tx should fail
const setTxError = async (page, errorFlag) => {
  await page.evaluate((errorFlag) => { 
    window['veworld-mock-config']['controller']().setTxError(errorFlag)
  }, errorFlag)
}


// Loads mock for solo
const installForSolo = async (page, homepage) => {
    await load(page)
    await page.goto(homepage)
    await install(page)
    await setThorUrl(page, 'http://localhost:8669')
    await setChainTag(page, 0xf6)
    await setMnemonic(page, 'denial kitchen pet squirrel other broom bar gas better priority spoil cross'.split(' '))
    await setAccIndex(page, 0)
}


const veworldMockClient = {
    install: install,
    load: load,
    getMockAddress: getMockAddress,
    setSignerAccIndex: setAccIndex,
    setThorUrl: setThorUrl,
    getTxId: getTxId,
    setChainTag: setChainTag,
    setMnemonic: setMnemonic,
    installForSolo: installForSolo,
    setCertError: setCertError,
    setTxError: setTxError
}
export default veworldMockClient