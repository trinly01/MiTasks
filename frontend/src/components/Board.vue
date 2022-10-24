<template>
  <div>
    <q-card
      style="width: 320px; height: auto;"
    >
      <q-toolbar @dblclick="$global.ifAct($global.isProjectOwner(proj), renameBoard)" @mouseover="hovering = true" @mouseleave="hovering = false" :class="'bg-' + $randomLastNameColor('a ' + proj.name) + '-5 text-white'">
        <q-toolbar-title >
          <span v-show="!renaming" class="text-h6 cut-text">{{ board.name }}</span>
          <q-input label-color="white" @keyup.enter="saveNewName" @keyup.esc="renaming = false" v-show="renaming" @blur="renaming = false" ref="newName" v-model="newName" label="Board name" dark filled />
        </q-toolbar-title>
        <q-btn @mouseover="hovering = true" @mouseleave="hovering = false" v-show="hovering && !renaming" class="board-handle" round flat icon="drag_indicator" />
        <q-btn v-show="renaming && !cards.length" @mousedown="deleteBoard(board, index)" size="sm" round icon="delete" color="red" />
      </q-toolbar>
      <!-- <q-card-section class="bg-primary text-white board-handle">
      <div class="text-h6 cut-text">{{ board.name }}</div>
      <div class="text-subtitle2">Edited {{ $timeAgo(proj.updated_at) }}</div>
      </q-card-section> -->
      <q-separator />
      <!-- <div>
        {{ filteredCards.length }}
      </div>
      <div>
        {{ cards.length }}
      </div> -->
      <draggable
        style="min-height: 30px;"
        :disabled="!$global.isProjectMember(proj)"
        class="q-gutter-sm q-pa-sm"
        @change="change"
        :list="filteredCards" 
        group="boards" 
        item-key="id">
        <template #item="{element, index}">
          <q-card v-ripple :class="'row shadow-1 q-pa-sm ' + ($nearDueDate(element.dueDate, element.rating) ? 'bg-red-3': '')" @click="openCardPrompt(element, index)">
            <div>
              {{ element.name }}
            </div>
            <q-space></q-space>
            <q-btn round dense size="sm" v-for="(m) in element.assignedTo" :key="m.id" :color="$randomLastNameColor(m.displayName)">
              {{ $getFirstTwoChars(m.displayName) }}
              <q-tooltip :offset="[0,-1]" >
                {{ m.displayName }}
              </q-tooltip>
            </q-btn>
          </q-card>
        </template>
      </draggable>
      <div class="col q-pb-sm q-pl-sm q-pr-sm q-gutter-sm" v-if="index === 0">
        <q-card v-ripple class="shadow-1 row justify-center">
          <q-btn v-show="!showNewCardName" icon="add" color="grey" dense flat round @click="newCard" />
          <div v-show="showNewCardName" class="col q-pa-xs q-gutter-xs">
            <q-input ref="newCardName" dense v-model="cardName" @keyup.enter="createCard" placeholder="short title" />
            <div class="row q-gutter-sm items-center">
              <q-btn size="sm" @click="createCard" :loading="creatingCard">Add</q-btn>
              <q-btn size="sm" icon="close" round flat @click="closeNewCard"/>
              <q-space />
              <!-- <q-btn size="sm">Add</q-btn> -->
            </div>
          </div>
        </q-card>
      </div>
    </q-card>
  </div>
</template>
<script>

import CardForm from 'components/CardForm.vue'
import { watch } from 'vue'
import { filters } from '../store/store.js'

export default {
  props: ['proj', 'board', 'index'],
  data () {
    return {
      filters,
      renaming: false,
      hovering: false,
      cards: [],
      showNewCardName: false,
      cardName: '',
      newName: '',
      $fetchTimer: null,
      creatingCard: false,
      gettingCards: false
    }
  },
  computed: {
    filteredCards () {
      if (this.proj.members.filter(m => !m.removedFromFilter).length === this.proj.members.length) {
        return this.cards
      }
      return this.cards.filter(c => {
        return this.proj.members.find(member => {
          if (member.removedFromFilter) return false
          return c.assignedTo.find(assignee => member.id ===  assignee.id)
        })
      })
    }
  },
  watch: {
    cards: {
      handler (newVal, oldVal) {
        // [...newVal].sort((a, b) => a.index - b.index).map((c, index) => {
        //   if (c.index !== index) {
        //     this.$strapi.put('/cards/'+c.id, {
        //       index,
        //     })
        //   }
        // })
        // console.log('moved to other board')
      },
      deep: true
    }
    
  },
  created () {
    watch(
      () => [filters.startDate, filters.endDate],
      async () => {
        this.getCards()
      }
    )
  },
  async mounted () {
    this.cards = await this.getCards()

    this.$fetchTimer = setInterval(async () => {
      if (!this.gettingCards) {
        this.gettingCards = true
        try {
          this.cards = await this.getCards()
          this.gettingCards = false
        } catch (error) {
          this.gettingCards = false
        }
      }
      
    }, 1000 * 10);

    console.log(this.cards.map(c => c.id))
    console.log('this.$route.params', this.$route.params)
    if (this.$route.params.cardID) {
      const i = this.cards.findIndex(ca => ca.id === +this.$route.params.cardID)
      if (i > -1) this.openCardPrompt(this.cards[i], i)
    }
  },
  unmounted () {
    clearInterval(this.$fetchTimer)
  },
  methods: {
    
    async deleteBoard (board, i) {
      console.log('hi')
      this.$q.dialog({
        title: 'Confirm',
        message: `Would you like to delete <span class="text-weight-medium">${this.$sanitizeHtml(board.name)}</span> board?`,
        html: true,
        focus: 'none',
        ok: {
          color: 'negative',
          label: 'delete'
        },
        cancel: {
          flat: true
        },
        persistent: false
      }).onOk(async () => {
        // console.log('>>>> OK')

        await this.$strapi.delete('/boards/'+this.board.id)

        this.$emit('delete', i)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
      this.renaming = true
    },
    async saveNewName () {
      const { data: board } = await this.$strapi.put('/boards/'+this.board.id, {
        name: this.newName
      })
      this.renaming = false

      this.$emit('updateBoard', board)
    },
    renameBoard () {
      this.renaming = true
      this.newName = this.board.name
      setTimeout(() => {
        // console.log(this.$refs)
        this.$refs.newName.focus()
        this.$refs.newName.select()
      }, 300)
    },
    async updateIndexes () {
      const sorted = [...this.cards].sort((a, b) => a.index - b.index)
      return Promise.all(sorted.map(async (c, index) => {
        if (c.index !== index) {
          this.$strapi.put('/cards/'+c.id, {
            index,
          })
          c.index = index
        }
      }))
    },
    async change (change) {
      try {
        if (change.added) {
          await this.$strapi.put('/cards/'+change.added.element.id, {
            index: change.added.newIndex,
            board: this.board.id
          })
          this.cards.find(c => c.id === change.added.element.id).index = change.added.newIndex

          console.log('added', change.added.element, this.board)

          const query = this.$qs.stringify({
            _where: {
              card: change.added.element.id
            },
            _sort: 'created_at:DESC',
            _limit: 1
          })

          let { data: [ lastActivity ] } = await this.$strapi.get('/activities/?'+query)
          
          if (lastActivity?.action === 'moved') {
            console.log('removed last Activity', lastActivity)
            const { data } = await this.$strapi.delete('/activities/'+lastActivity.id)
          }
          // { data: [ lastActivity ] } = await this.$strapi.get('/activities/?'+query)
          lastActivity = (await this.$strapi.get('/activities/?'+query)).data[0]

          if (lastActivity.to !== this.board.name) {
            console.log('last Activity', lastActivity)
            console.log('from', change.added.element.board.name, 'to', this.board.name)
            await this.$strapi.post('/activities', {
              action: 'moved',
              user: this.$global.user.user.id,
              from: change.added.element.board.name,
              to: this.board.name,
              card: change.added.element.id,
              project: this.proj.id
            })
          }
          // if (change.added.element.board.name !== this.board.name)
          // await this.$strapi.post('/activities', {
          //   action: 'moved',
          //   user: this.$global.user.user.id,
          //   from: change.added.element.board.name,
          //   to: this.board.name,
          //   card: change.added.element.id,
          //   project: this.proj.id
          // })

          // console.log('index', change.added)
          // await this.$strapi.put('/cards/'+change.added.element.id, {
          //   index: change.added.newIndex
          // })

          this.updateIndexes()

          // this.cards = await this.getCards()
        } else if (change.moved) {
          await this.$strapi.put('/cards/'+this.cards[change.moved.newIndex].id, {
            index: change.moved.newIndex
          })
          this.cards[change.moved.newIndex].index = change.moved.newIndex

          await this.$strapi.put('/cards/'+this.cards[change.moved.oldIndex].id, {
            index: change.moved.oldIndex
          })
          this.cards[change.moved.oldIndex].index = change.moved.oldIndex
          console.log('moved', change)
        }
      } catch (error) {
        console.log('error ui')
      }
      
      // console.log('changes', change)
      await this.updateIndexes()
    },
    async getCards () {

      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)
      console.log('endDate',endDate)
      const qo = {
        _where: {
          // project: this.proj.id,
          board: this.board.id,
          _or: [
            {
              owner: this.$global.user.user.id
            }
          ],
          created_at_gte: new Date(filters.startDate),
          created_at_lte: endDate
        },
        _sort: 'index:ASC',
        _limit: 500
      }
      if (this.$global.isProjectMember(this.proj)) {
        qo._where._or.push({
          // project: this.proj.id,
          board: this.board.id,
        })
      }
      const query = this.$qs.stringify(qo)
      const { data: cards } = await this.$strapi.get('/cards/?' + query)
      console.log('CARDS', cards)
      return cards
    },
    newCard () {
      this.showNewCardName = true
      // console.log('how', this.newCardName)
      setTimeout(() => {
        this.$refs.newCardName.focus()
      }, 300)
      // this.$refs.showNewCardName.focus()
    },
    closeNewCard () {
      this.showNewCardName = false
      this.cardName = ''
    },
    async createCard () {
      // console.log('creating Card')
      this.creatingCard = true
      try {
        const { data: newCard } = await this.$strapi.post('/cards', {
          name: this.cardName,
          index: this.cards.length,
          board: this.board.id,
          project: this.proj.id,
          owner: this.$global.user.user.id
        })

        await this.$strapi.post('/activities', {
          action: 'created',
          user: this.$global.user.user.id,
          to: this.board.name,
          card: newCard.id,
          project: this.proj.id
        })

        await this.$global.updateProjectAt(this.proj)
        console.log(newCard)
        this.cards.push(newCard)

        // to project members
        await this.$strapi.post('/projects/sendMail', {
          subject: `${this.cardName} - ${this.proj.name}`,
          from: this.$global.user.user.email,
          to: this.proj.owner.email,
          cc: this.proj.members.map(m => m.email).join(', '),
          system: this.proj.name,
          html: {
            firstName: '',
            message: `${this.$global.user.user.displayName} added "${this.cardName}" card to ${this.board.name}`,
            url: {
              text: `Login to ${this.proj.name}`,
              link: `${this.$global.mailURL}/#/project/${this.proj.id}/${newCard.id}`
            }
          }
        })

        // to end user

        console.log('newCard owner', newCard.owner)
        await this.$strapi.post('/projects/sendMail', {
          subject: `${this.cardName} - ${this.proj.name}`,
          // from: this.$global.user.user.email,
          to: newCard.owner.email,
          // cc: this.proj.members.map(m => m.email).join(', '),
          system: this.proj.name,
          html: {
            firstName: this.$global.user.user.displayName,
            message: `Thank you for getting in touch. Your ticket No. is "${newCard.refNo}". One of our personnel will reach out to you within the next two (2) hours.`,
            url: {
              text: `Login to ${this.proj.name}`,
              link: `${this.$global.mailURL}/#/project/${this.proj.id}/${newCard.id}`
            },
            message2: 'For emergency or immediate assistance, you may call the office of MIS at local 466.'
          }
        })

        this.closeNewCard()

        this.openCardPrompt(newCard, this.cards.length - 1)
      } catch (error) {
      }

      this.creatingCard = false
    },
    openCardPrompt (card, i) {
      // const { board, cards } = this
      console.log('cardi', card, i)
      // console.log('openCard', JSON.parse(JSON.stringify(card)))
      this.$q.dialog({
        component: CardForm,
        componentProps: {
          'modelValue': card,
          proj: this.proj,
          board: this.board
        }
      }).onOk(async updatedCard => {
        // console.log('updatedCard', i, this.cards[i], this.board.id)
        // console.log('updatedCard2', this.cards[i].board, this.board.id)
        if (this.cards[i].board.id !== this.board.id) {
          this.cards.splice(i, splice)
          return
        }
        // const { data: cardFromDB } = await this.$strapi.put('/cards/'+ card.id, updatedCard)

        this.cards[i] = updatedCard
      })
    }
  }
}
</script>