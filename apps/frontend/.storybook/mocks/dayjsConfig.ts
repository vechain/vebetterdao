import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/en"

dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.locale("en")

export default dayjs
