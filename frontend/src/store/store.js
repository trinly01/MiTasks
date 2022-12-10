import { reactive } from 'vue'
import { startOfMonth, format, sub } from 'date-fns'

const now = new Date()

const filters = reactive({
  // assignedTo: [],
  view: 'kanban',
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

const ticketsByColumn = reactive({
  columns: {}
})

export {
  filters,
  ticketsByColumn
}
