<template>
  <div class="row q-gutter-sm">
    <div>
      <!-- {{ filters.view }} -->
      <q-btn v-if="filters.view === 'kanban'" round icon="view_timeline" @click="filters.view = 'gantt'" title="swith to gantt view" />
      <q-btn v-else icon="view_kanban" round @click="filters.view = 'kanban'" title="swith to kanban view"  />
    </div>
    <q-input label="Start" filled v-model="filters.startDate" mask="date" :rules="['date']" dense>
      <template v-slot:append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date v-model="filters.startDate">
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Close" color="primary" flat />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
    <q-input label="End" filled v-model="filters.endDate" mask="date" :rules="['date']" dense>
      <template v-slot:append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date v-model="filters.endDate">
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Close" color="primary" flat />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
    <div>
      <q-btn icon="query_stats" round @click="getCategories">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            
            <div class="q-pa-md" style="min-width: 300px; min-height: 255px;">
              <div v-show="state.categories.length" class="text-subtitle2">
                {{ state.closedTickets }} Closed and {{ state.openTickets }} Open Tickets
              </div>
              <!-- {{ state.categories.map(cat => cat.count) }} -->
              <q-spinner-pie class="absolute-center" v-show="!state.categories.length" color="orange" />
              <column-chart v-show="state.categories.length" width="300px" height="200px" :data="[...state.categories.map(cat => [cat.name, cat.count]), ['Others', state.closedTickets + state.openTickets - categorized]]" />
            </div>
          </q-popup-proxy>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
import { filters } from '../store/store.js'
import { computed, inject, reactive } from 'vue';

const { $strapi, $qs } = inject('globalProperties')

const props = defineProps(['proj'])

const state = reactive({
  categories: [],
  closedTickets: 0,
  openTickets: 0
})

const categorized = computed(() => {
  return state.categories.reduce((a, b) => a + b['count'], 0)
})

const getClosedTickets = async (category) => {
  const endDate = new Date(filters.endDate)
  endDate.setHours(23, 59, 59, 999)
  const qo = {
    _where: {
      'board.project.id': props.proj.id,
      'board.name': 'Closed',
      created_at_gte: new Date(filters.startDate),
      created_at_lte: endDate
    }
  }
  const query = $qs.stringify(qo)
  const result = await $strapi.get('/cards/count?' + query)
  state.closedTickets = result.data
  return result.data
}

const getOpenTickets = async (category) => {
  const endDate = new Date(filters.endDate)
  endDate.setHours(23, 59, 59, 999)
  const qo = {
    _where: [
      {
        'board.project.id': props.proj.id,
        created_at_gte: new Date(filters.startDate),
        created_at_lte: endDate,
        'board.name_ne': 'Closed',
      },
      {'board.name_ne': 'Cancelled'}
    ]
  }
  const query = $qs.stringify(qo)
  const result = await $strapi.get('/cards/count?' + query)
  state.openTickets = result.data
  return result.data
}

const getCategories = async () => {
  state.categories = []
  await getClosedTickets()
  await getOpenTickets()
  
  const query = $qs.stringify({
    project: props.proj.id
  })
  const { data } = await $strapi.get('/categories/?'+query)

  for (const cat of data) {
    cat.count = await getCount(cat)
  }

  state.categories = data
  console.log('categories uy', data)
  return state.categories
}

const getCount = async (category) => {
  // https://it-helpdesk-mirdc.ap.ngrok.io/cards/count?&_where[0][assignedTo.username]=3427&_where[1][board.name]=Closed

  const endDate = new Date(filters.endDate)
  endDate.setHours(23, 59, 59, 999)
  const qo = {
    _where: {
      'board.project.id': props.proj.id,
      'board.name_ne': 'Cancelled',
      'category.id': category.id,
      created_at_gte: new Date(filters.startDate),
      created_at_lte: endDate
    }
  }
  const query = $qs.stringify(qo)
  const result = await $strapi.get('/cards/count?' + query)
  return result.data
}
</script>