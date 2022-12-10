<template>
  <div ref="canvasRoot"></div>
</template>

<script setup>

import { onMounted, ref, watch } from 'vue';

import { SVGGantt } from 'gantt';

let gantt = null

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

// const data = [{
//   id: 1,
//   type: 'group',
//   text: '1 Waterfall model',
//   start: new Date('2018-10-10T09:24:24.319Z'),
//   end: new Date('2018-12-12T09:32:51.245Z'),
//   percent: 0.71,
//   links: []
// }]

const canvasRoot = ref(null)

let canChange = true

watch(() => props.data, (newData, oldData) => {
  if (JSON.stringify(newData) !== JSON.stringify(oldData) && canChange) {
    canvasRoot.value.innerHTML = ''
    canChange = false
    console.log('changing', gantt, newData)
    // gantt.setData(newData)
    // gantt.render(newData)
    render()
    canChange = true
  }
})

onMounted(() => {
  console.log(canvasRoot)
  
  render()
})


function render () {
  gantt = new SVGGantt(canvasRoot.value, props.data, {
    viewMode: 'day',
    onClick: (item) => {
      console.log('gantt click', item)
      item.openCardPrompt()
    },
    offsetY: 20
  })
}

</script>
