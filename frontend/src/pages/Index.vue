<style>
.cut-text { 
  text-overflow: ellipsis;
  overflow: hidden; 
  width: 280px; 
  height: 1.2em; 
  white-space: nowrap;
}
</style>

<template>
  <q-page>
    <div class="fixed-top" style="top: 50px; background:rgba(255,255,255,0.75); backdrop-filter: blur(6px)">
      <q-toolbar>

        <q-toolbar-title>
          Projects
        </q-toolbar-title>

        <q-btn >
          Projects
        </q-btn>
      </q-toolbar>
    </div>
    <div v-if="!$global.user" class="row q-pa-md q-gutter-md absolute-top justify-center" :class="{ 'justify-center': $q.screen.lt.md }" style="top: 42px" >
      Please Login
    </div>
    <div v-else class="row q-pa-md q-gutter-md absolute-top justify-center" :class="{ 'justify-center': $q.screen.lt.md }" style="top: 42px" >
      <projectCard
        class="cursor-pointer"
        v-for="proj in $global.projects"
        :project="proj"
        :key="proj.id"
      />
      <q-card v-ripple class="row justify-center items-center" style="width: 320px; height: 137px;">
        <q-btn round icon="add" size="xl" flat color="grey" @click="$global.newProjectPrompt()"></q-btn>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, watch } from 'vue';
import projectCard from 'components/projectCard.vue'

export default defineComponent({
  name: 'PageIndex',
  components: {
    projectCard
  },
  mounted () {
    // watch( () => this.$global.user, async (user) => {
    //   await this.getProjects();
    // })
    // this.getProjects()
  },
  methods: {
    async getCardsCount(b) {
      const { data: count } = await this.$strapi.get('/cards/count?board=' + b.id)
      b.cardsLength = count
    },
  }
})
</script>
