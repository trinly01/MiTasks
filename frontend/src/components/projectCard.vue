<template>
  <q-card
    v-ripple style="width: 320px;"
    @click="$global.openProject(proj.id)"
  >
    <q-toolbar :class="'bg-' + $randomLastNameColor('a ' + proj.name) + '-5 text-white'">
      <q-toolbar-title>
        {{ proj.name }}
      </q-toolbar-title>
    </q-toolbar>
    <div class="q-pt-md q-pl-sm">
      <!-- <div class="text-h6 cut-text">{{ proj.name }}</div> -->
      <div class="text-caption">&nbsp;{{ proj.description }}</div>
      <!-- <div class="text-subtitle2">Edited {{ $timeAgo(proj.updated_at) }}</div> -->
    </div>
    <!-- <q-separator /> -->
    <q-card-actions class="row justify-between">
      <div class="q-gutter-xs">
        <!-- <q-badge rounded color="orange" v-for="b in proj.boards"
          :key="'b' + b.id"
          :jokeHaha="getCardsCount(b)"
          :label="b.cardsLength"
        /> -->
        <q-chip dense v-for="(board, i) in proj.boards.sort((a, b) => a.index - b.index)" v-show="i < 4 && board.cardsLength" :key="'board' + board.id" :jokeHaha="getCardsCount(board)">
          <q-avatar :color="['red', 'deep-orange', 'orange'][i]" text-color="white">{{ board.cardsLength }}</q-avatar>
          {{$getFirstTwoChars(board.name)}}
          <q-tooltip>{{ board.name }}</q-tooltip>
        </q-chip>
      </div>
      <!-- <q-btn color="red" round flat icon="delete" /> -->
    </q-card-actions>
  </q-card>
</template>

<script>

import { defineComponent, watch } from 'vue';


export default defineComponent({
  props: ['project'],
  data () {
    return {
      proj: this.project
    }
  },
  methods: {
    async getCardsCount(b) {
      const { data: count } = await this.$strapi.get('/cards/count?board=' + b.id)
      b.cardsLength = count
    },
  }
})
</script>