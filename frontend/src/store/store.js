import { reactive } from 'vue'
import { startOfMonth, format, sub } from 'date-fns'

const now = new Date()

const filters = reactive({
  // assignedTo: [],
  startDate: format(
    startOfMonth(
      sub(now, {
        months: 1
      })
    ),
    'yyyy/MM/dd'
  ),
  endDate: format(now, 'yyyy/MM/dd')
})

console.log('sub', sub(now, {
  month: 2
}))

export {
  filters
}
