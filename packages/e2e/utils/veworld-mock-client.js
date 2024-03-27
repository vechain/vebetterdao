import { readFileSync } from 'fs'

const install = async (page) => {
    await page.evaluate(() => { 
        window['veworld-mock']['controller']().installMock()
      })
}
const load = async (page) => {
  await page.addInitScript({
      content: readFileSync('dist/veworld-mock.js', 'utf-8')
    })
}

const getMockAddress = async (page) => {
    return await page.evaluate(() => { 
        return window['veworld-mock']['address']
      })
}

const setSignerAccIndex = async (page, index) => {
    await page.evaluate((index) => { 
        window['veworld-mock']['accountIndex'] = index - 1
      }, index)
}

const setThorUrl = async (page, url) => {
    await page.evaluate((url) => { 
        window['veworld-mock']['thorUrl'] = url
      }, url)
}

const veworldMockClient = {
    install: install,
    load: load,
    getMockAddress: getMockAddress,
    setSignerAccIndex: setSignerAccIndex,
    setThorUrl: setThorUrl
}
export default veworldMockClient