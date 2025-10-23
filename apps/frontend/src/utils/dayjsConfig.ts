import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import relativeTime from "dayjs/plugin/relativeTime"

import "dayjs/locale/en"
import "dayjs/locale/it"
import "dayjs/locale/fr"
import "dayjs/locale/es"
import "dayjs/locale/zh"
import "dayjs/locale/de"
import "dayjs/locale/ja"
import "dayjs/locale/vi"
import "dayjs/locale/nl"
import "dayjs/locale/ko"
import "dayjs/locale/sv"
import "dayjs/locale/zh-tw" // Link: 'tw' is 'zh-tw' in dayjs - https://github.com/iamkun/dayjs/blob/main/src/locale/zh-tw.js
import "dayjs/locale/tr"
import "dayjs/locale/hi"
dayjs.extend(relativeTime)
dayjs.extend(duration)
export default dayjs
