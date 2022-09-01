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
    <div class="" style="background:rgba(255,255,255,0.75); backdrop-filter: blur(6px)">
      <q-toolbar>
        <q-toolbar-title class="col-auto">
          <!-- {{ proj.name }} -->
          <span @dblclick="$global.ifAct($global.isProjectOwner(proj), renameProj)" v-show="!renaming" class="text-h6 cut-text">{{ proj.name }}&nbsp;</span>
          <q-input @keyup.enter="saveNewName" @keyup.esc="renaming = false" v-show="renaming" @blur="renaming = false" ref="newName" v-model="newName" label="Project Name" />
          <!-- <q-input label-color="white" @keyup.enter="saveNewName" @keyup.esc="renaming = false" v-show="renaming" @blur="renaming = false" ref="newName" v-model="newName" label="Board name" dark filled /> -->
        </q-toolbar-title>
        <div @dblclick="$global.ifAct($global.isProjectOwner(proj), changeDesc)" v-show="!descOnFocus" class="col-auto">{{ proj.description }}</div>
        <q-input class="col" @keyup.enter="saveNewDesc" @focus="descOnFocus = true" @keyup.esc="descOnFocus = false" v-show="(descOnFocus || !proj.description) && $global.isProjectOwner(proj)" @blur="descOnFocus = false" ref="newDesc" v-model="newDesc" label="Short Description" />
        <q-space></q-space>
        <div class="q-gutter-xs">
          <q-btn round size="sm" v-for="(m) in proj.members" :key="m.id" :color="$randomLastNameColor(m.displayName)">
            {{ $getFirstTwoChars(m.displayName) }}
            <q-tooltip :offset="[0,-1]" >
              {{ m.displayName }}
            </q-tooltip>
          </q-btn>
          <q-btn v-if="$global.isProjectMember(proj) || $global.isProjectOwner(proj)" flat round icon="settings" color="blue-grey" >
            <q-menu>
              <q-list style="min-width: 180px">
                <q-item tag="label" v-ripple class="bg-grey-3">
                  <q-item-section>
                    <q-item-label>Privacy</q-item-label>
                  </q-item-section>
                  <q-item-section side >
                    <q-btn-toggle
                      @update:model-value="updatePrivacy"
                      size="sm"
                      v-model="proj.privacy"
                      no-caps
                      rounded
                      unelevated
                      toggle-color="primary"
                      color="white"
                      text-color="primary"
                      :options="[
                        {label: 'Private', value: 'private'},
                        {label: 'Public', value: 'public'}
                      ]"
                    />
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="openMembersPrompt">
                  <q-item-section>Members</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="openCategoriesPrompt">
                  <q-item-section>Categories</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup>
                  <q-item-section>Help &amp; Feedback</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </div>
    <div v-if="!$global.user" class="row no-wrap justify-center" style="top: 42px; width: auto; overflow-x: auto;" >
      Please Login
    </div>
    <div v-else class="row no-wrap" style="top: 42px; width: auto; overflow-x: auto;" >
      <draggable
        :disabled="!$global.isProjectOwner(proj)"
        @change="updateBoardIndex"
        class="row no-wrap q-pa-md q-gutter-md"
        style="height: calc(100vh - 101px);"
        v-model="proj.boards"
        item-key="id"
        handle=".board-handle">
        <template #item="{element, index}">
          <board :proj="proj" :board="element" :index="index" @updateBoard="b => proj.boards[index] = b" @delete="i => proj.boards.splice(i, 1)" />
        </template>
      </draggable>
      <q-card
        v-if="$global.isProjectOwner(proj)"
        v-ripple style="width: 320px; height: 100px;"
        class="q-mt-md"
      >
        <q-card-section class="row justify-center items-center" style="width: 320px; height: 100px;">
          <q-btn round icon="add" size="xl" flat color="grey" @click="newBoardPrompt"></q-btn>
        </q-card-section>
      </q-card>
      <div class="q-pa-sm"></div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, watch } from 'vue';
import Board from 'components/Board.vue'
import Members from 'components/Members.vue'
import Categories from 'components/Categories.vue'
import MembersVue from '../components/Members.vue';



export default defineComponent({
  components: {
    Board
  },
  name: 'PageIndex',
  data () {
    return {
      $fetchTimer: null,
      proj: {},
      renaming: false,
      newName: '',
      descOnFocus: false,
      newDesc: ''
    }
  },
  created () {
    watch(
      () => this.$route.params.id,
      async newId => {
        this.getProject(newId)
      }
    )
    watch(
      () => this.$global.user,
      async user => {
        if (user) await this.getProject(this.$route.params.id)
        else this.proj = {}
      }
    )
  },
  async mounted () {
    await this.getProject()
    // this.$fetchTimer = setInterval(() => {
    //   this.getProject()
    // }, 1000 * 1);
  },
  unmounted () {
    // clearInterval(this.$fetchTimer)
  },
  methods: {
    async saveNewName () {
      if (!this.newName) return
      const { data: proj } = await this.$strapi.put('/projects/'+this.proj.id, {
        name: this.newName
      })
      this.renaming = false

      this.proj.name = this.newName

      // this.$emit('update', proj)
    },
    async saveNewDesc () {
      if (!this.newDesc) return
      const { data: proj } = await this.$strapi.put('/projects/'+this.proj.id, {
        description: this.newDesc
      })
      this.descOnFocus = false

      this.proj.description = this.newDesc

      // this.$emit('update', proj)
    },
    changeDesc () {
      this.descOnFocus = true
      this.newDesc = this.proj.description
      setTimeout(() => {
        // console.log(this.$refs)
        this.$refs.newDesc.focus()
        this.$refs.newDesc.select()
      }, 300)
    },
    renameProj () {
      this.renaming = true
      this.newName = this.proj.name
      setTimeout(() => {
        // console.log(this.$refs)
        this.$refs.newName.focus()
        this.$refs.newName.select()
      }, 300)
    },
    async updatePrivacy (privacy) {
      console.log('privacy')
      await this.$strapi.put('/projects/' + this.proj.id, {
        privacy
      })
    },
    openMembersPrompt () {
      this.$q.dialog({
        component: Members,
        componentProps: {
          'modelValue': this.proj,
          proj: this.proj,
          board: this.board
        }
      }).onOk(async members => {
        this.proj.members = members
      })
    },
    openCategoriesPrompt () {
      this.$q.dialog({
        component: Categories,
        componentProps: {
          'modelValue': this.proj,
          proj: this.proj
        }
      }).onOk(async updatedCard => {
        // asd
      })
    },
    async getProject () {
      const { data: proj } = await this.$strapi.get('/projects/' + this.$route.params.id)
      proj.boards = await this.getBoards(proj)
      this.proj = proj
      this.$global.leftDrawerOpen = false
      console.log(proj)
    },
    async getBoards (proj) {
      const query = this.$qs.stringify({
        _where: {
          project: proj.id
        },
        _sort: 'index:ASC'
      })
      const { data: boards } = await this.$strapi.get('/boards/?' + query)
      return boards
    },
    async updateBoardIndex ({ moved: { newIndex, oldIndex } }) {
      const board1 = this.proj.boards[newIndex]
      const board2 = this.proj.boards[oldIndex]
      await this.$strapi.put('/boards/' + board1.id, {
        index: newIndex
      })
      await this.$strapi.put('/boards/' + board2.id, {
        index: oldIndex
      })
      // console.log(movement)
    },
    newBoardPrompt () {
      this.$q.dialog({
        title: 'Board Name',
        prompt: {
          model: '',
          isValid: val => val.length > 2, // << here is the magic
          type: 'text' // optional
        },
        ok: { 
          label: 'create'
        }
      }).onOk(async name => {
        const { data: newBoard } = await this.$strapi.post('/boards', {
          name,
          index: this.proj.boards.length,
          project: this.proj.id
        })
        this.proj = await this.$global.updateProjectAt(this.proj)
        console.log(newBoard)
        // this.proj.boards.push(newBoard)
      })
    }
  }
})
</script>
