<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-layout view="hHh LpR lFr" container class="bg-white" style="width: 800px; max-width: 80vw;" full-width>
      <q-header class="bg-primary" >
        <q-toolbar class="q-gutter-sm">
          <q-btn flat @click="drawer = !drawer" round dense icon="menu" />
          <q-toolbar-title>
            <q-input
              :disable="!$global.isCardOwner(card) && !$global.isProjectMember(proj)"
              ref="name" v-model="card.name" :label="card.name ? undefined : 'Title'" dark filled
            />
          </q-toolbar-title>
          <!-- <q-btn flat @click="drawerR = !drawerR" round dense icon="menu" /> -->
          <q-btn
            :disable="!$global.isCardOwner(card) && !$global.isProjectMember(proj)"
            v-if="hasChanges" icon="save" label="save" @click="save"
          />
          <q-btn flat v-close-popup round dense icon="close" />
        </q-toolbar>
      </q-header>

      <!-- <q-footer class="bg-black text-white">
        <q-toolbar inset>
          <q-toolbar-title>Footer</q-toolbar-title>
        </q-toolbar>
      </q-footer> -->

      <q-drawer bordered v-model="drawer" :width="200" :breakpoint="300" class="bg-grey-3 q-pa-sm">
        <!-- <div v-for="n in 50" :key="n">Drawer {{ n }} / 50</div> -->
      </q-drawer>

      <q-drawer side="right" bordered v-model="drawerR" :width="200" :breakpoint="300" class="bg-grey-3 q-pa-sm column">
        <div class="column col q-gutter-xs">
          <div class="row items-center">
            <div>Assigned to</div>
            <q-space />
            <q-btn v-if="$global.isProjectMember(proj) || $global.isProjectOwner(proj)" round flat icon="add" @click="openAssignmentPrompt" />
          </div>
          
          <div class="row q-gutter-xs">
            <q-chip v-for="c in card.assignedTo" :key="c.id">
              <!-- <q-avatar color="primary" text-color="white">{{ c.displayName.match(/\b(\w)/g).join('').substring(0,2) }}</q-avatar> -->
              <q-avatar :color="$randomLastNameColor(c.displayName)" text-color="white">
                {{ $getFirstTwoChars(c.displayName) }}
                <q-tooltip anchor="bottom middle" self="center left">{{ c.email }}</q-tooltip>
              </q-avatar>
              <span class="ellipsis">
                {{c.displayName}}
              </span>
            </q-chip>
          </div>
          <div class="row items-center q-pt-sm">
            <div class="">Rating</div>
            <q-space />
            <q-toggle v-if="$global.isCardMember(card)" v-model="card.forRating" />
            <q-rating
              @update:model-value="val => !val ? $setTimeout(card.rating = 1): 0"
              :min="1"
              :disable="!card.forRating || !$global.isCardOwner(card)"
              class=""
              v-model="card.rating"
              :max="5"
              size="2.5em"
              color="grey"
              :color-selected="[
                [$global.colorRate(card.rating), 'grey', 'grey', 'grey', 'grey'],
                ['grey', $global.colorRate(card.rating), 'grey', 'grey', 'grey'],
                ['grey', 'grey', $global.colorRate(card.rating), 'grey', 'grey'],
                ['grey', 'grey', 'grey', $global.colorRate(card.rating), 'grey'],
                ['grey', 'grey', 'grey', 'grey', $global.colorRate(card.rating)]
              ][card.rating ? card.rating -1 : 0]"
              :icon="[
                'sentiment_very_dissatisfied',
                'sentiment_dissatisfied',
                'sentiment_satisfied',
                'sentiment_satisfied_alt',
                'sentiment_very_satisfied'
              ]"
            >
              <template v-for="(def, i) in $global.rateDefinitions" :key="`tip-${i+1}`" v-slot:[`tip-${i+1}`]>
                <q-tooltip>{{ def }}</q-tooltip>
              </template>
            </q-rating>
          </div>
          <q-space />
          <div class="row text-blue-grey">
            <q-space />
            <span>{{ card.refNo }}</span>
          </div>
        </div>
      </q-drawer>

      <q-page-container>
        <q-page padding class="q-gutter-sm">
          <div class="q-field__label text-weight-light text-caption">Description</div>
          <q-editor :disable="!$global.isCardOwner(card) && !$global.isProjectMember(proj)" v-model="card.description" min-height="5rem" />
          
          <div class="q-field__label text-weight-light text-caption">Attachments</div>
          <div class="row q-gutter-sm">
            <input ref="uploadFiles" type='file' multiple hidden name="files" @change="uploadAttachments"/>
            <div v-for="(f, i) in card.attachments" :key="f.id">
              <q-btn @mouseover="hovering = f.id + board.name" @mouseleave="hovering = ''" @click="downloadAttachment(f)" flat dense size="sm" color="primary" class="justify-start" style="max-width: 100px;">
                <div class="ellipsis q-ml-sm q-mr-sm">
                  {{ f.name }}
                </div>                
              </q-btn>
              <q-btn @mouseover="hovering = f.id + board.name" @mouseleave="hovering = ''" v-show="hovering === f.id + board.name" @click="removeAttachment(f, i)" dense round size="8px" icon="delete" color="red" />
            </div>
            
            <q-card v-ripple class="shadow-1 row justify-center" >
              <q-btn :disable="!$global.isCardOwner(card) && !$global.isCardMember(card)" icon="add" color="grey" dense flat round @click="$refs.uploadFiles.click()"/>
            </q-card>
          </div>

          <q-select
            :disable="!$global.isProjectMember(proj)"
            use-input
            :display-value="proj.categories.filter(c => c.id === card.category).length === 1 ? proj.categories.filter(c => c.id === card.category)[0].name : ''"
            @input-value="search => {
              searchCategory = search
            }"
            :modelValue="card.category"
            @update:model-value="val => {
              
              if (val) return card.category = val.id
              card.category = null
            }"
            :options="proj.categories.map(c => {
              return {
                label: c.name,
                ...c
              }
            }).filter(c => {
              // $log(searchCategory, c.label)
              if (searchCategory === '') return true;
              return c.label.toLowerCase().includes(searchCategory.toLowerCase()) || c.description?.toLowerCase().includes(searchCategory.toLowerCase())
            })"
          label="Category" />
          <q-input
            :disable="!$global.isCardMember(card)"
            v-model="card.dueDate" label="Due Date" @click="$refs.qDateProxy.show()"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                  <q-date v-model="card.dueDate" mask="YYYY-MM-DD" :options="d => d >= $date.formatDate(Date.now(), 'YYYY/MM/DD') && d >= $date.formatDate(new Date(card.targetStart), 'YYYY/MM/DD')">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input
            :disable="!$global.isCardMember(card)"
            v-model="card.targetStart" label="Target Start" @click="$refs.qDateProxy.show()"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                  <q-date v-model="card.targetStart" mask="YYYY-MM-DD" :options="d => d >= $date.formatDate(Date.now(), 'YYYY/MM/DD')  && d <= $date.formatDate(new Date(card.dueDate), 'YYYY/MM/DD')">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input
            v-if="card.dateFinished || $global.isCardMember(card)"
            :disable="!$global.isCardMember(card)"
            v-model="card.dateFinished" label="Date Finished" @click="$refs.qDateProxy.show()"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                  <q-date v-model="card.dateFinished" mask="YYYY-MM-DD" :options="d => d >= $date.formatDate(Date.now(card.targetStart), 'YYYY/MM/DD')">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <div class="q-field__label text-weight-light text-caption">Activity</div>
          <q-list>
            <q-item>
              <q-item-section top avatar>
                <q-avatar v-ripple @click="$refs.commentInput.focus()" :color="$randomLastNameColor($global.user.user.displayName)" text-color="white">{{ $getFirstTwoChars($global.user.user.displayName) }}</q-avatar>
              </q-item-section>

              <q-item-section class="q-gutter-sm">
                <q-input
                  ref="commentInput"
                  :disable="!$global.isCardOwner(card) && !$global.isCardMember(card)"
                  placeholder="write a comment"
                  type="textarea"
                  v-model="comment"
                  input-style="max-height: 100px; overflow-y: hidden"
                  input-class="q-mb-sm"
                  filled
                  autogrow
                />
                <div class="row" v-show="comment.trim()">
                  <q-btn size="sm" @click="sendComment" :loading="sending">Send</q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
          <q-list>
            <q-item v-for="a in card.activities" :key="a.id">
              <q-item-section top avatar>
                <!-- {{ a.user.displayName }} -->
                <q-avatar v-ripple :color="$randomLastNameColor(a.user.displayName)" text-color="white">
                  {{ $getFirstTwoChars(a.user.displayName) }}
                  <q-tooltip anchor="center right" self="top left">{{ a.user.email }}</q-tooltip>
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ a.user.displayName }}
                </q-item-label>
                <q-item-label v-if="a.action === 'created'" caption>
                  added this card to
                  <span class="text-weight-medium">{{ a.to }}</span>
                </q-item-label>
                <q-item-label v-else-if="a.action === 'moved'" caption>
                  moved this card from
                  <span class="text-weight-medium">{{ a.from }}</span>
                  to
                  <span class="text-weight-medium">{{ a.to }}</span>
                </q-item-label>
                <q-item-label v-else-if="a.action === 'commented'" caption>
                  <!-- <q-badge color="blue-grey-1" rounded multi-line class="text-caption q-pa-sm" style="color: rgba(0, 0, 0, 0.54)" >
                    {{ a.info }}
                  </q-badge> -->
                  <q-chat-message
                    style="white-space: pre-line"
                    :text="a.info.split('\n').filter(t => t)"
                    :bg-color="$randomLastNameColor(a.user.displayName)+'-1'"
                    :text-color="$randomLastNameColor(a.user.displayName)+'-8'"
                  />
                </q-item-label>
                <q-item-label v-else-if="a.action === 'removedAttachment'" caption>
                  removed
                  <q-btn disable flat dense size="sm" color="primary" class="justify-start" style="max-width: 100px;">
                    <div class="ellipsis q-ml-sm q-mr-sm">
                      {{ $JSON.parse(a.info).name }}
                    </div>                
                  </q-btn>
                  attachment
                </q-item-label>
                <q-item-label v-else-if="a.action === 'attached'" caption>
                  attached
                  <div v-for="(f) in $JSON.parse(a.info)" :key="f.id + 'comments'">
                    <q-btn @mouseover="hovering = f.id + board.name" @mouseleave="hovering = ''" @click="downloadAttachment(f)" flat dense size="sm" color="primary" class="justify-start" style="max-width: 100px;">
                      <div class="ellipsis q-ml-sm q-mr-sm">
                        {{ f.name }}
                      </div>                
                    </q-btn>
                    <!-- <q-btn @mouseover="hovering = f.id + board.name" @mouseleave="hovering = ''" v-show="hovering === f.id + board.name" @click="removeAttachment(f, i)" dense round size="8px" icon="delete" color="red" /> -->
                  </div>
                </q-item-label>
                <q-item-label v-else-if="a.action === 'assignedTo'" caption>
                  assigned
                  <q-chip v-for="(m) in $JSON.parse(a.info)" :key="m.id">
                    <q-avatar :color="$randomLastNameColor(m.displayName)" text-color="white">{{ $getFirstTwoChars(m.displayName) }}</q-avatar>
                    {{ m.displayName }}
                  </q-chip>
                  to this card
                </q-item-label>
                <q-item-label v-else-if="a.action === 'removedAssignment'" caption>
                  removed
                  <q-chip v-for="(m) in $JSON.parse(a.info)" :key="m.id">
                    <q-avatar :color="$randomLastNameColor(m.displayName)" text-color="white">{{ $getFirstTwoChars(m.displayName) }}</q-avatar>
                    {{ m.displayName }}
                  </q-chip>
                  from this card
                </q-item-label>
                <q-item-label v-else-if="a.action === 'editedCardName'" caption>
                  renamed the card
                  <span class="text-weight-medium" v-html="a.info"></span>
                </q-item-label>
                <q-item-label v-else-if="a.action === 'editedCardDescription'" caption>
                  updated description
                  <span class="text-weight-mediumwrap" style="word-wrap: break-word;" v-html="a.info"></span>
                </q-item-label>
                <q-item-label v-else-if="a.action === 'updatedCardCategory'" caption>
                  set the category to
                  <span class="text-weight-medium">{{ a.info }}</span>
                </q-item-label>
                <q-item-label v-else-if="a.action === 'editedCardCategory'" caption>
                  changed the category from
                  <span class="text-weight-medium">{{ a.info }}</span>
                </q-item-label>
                <q-item-label v-else-if="a.action === 'editedCardTargetStart'" caption>
                  changed target start from
                  <span class="text-weight-medium">{{ a.info }}</span>
                </q-item-label>
                <q-item-label v-else-if="a.action === 'editedCardDateFinished'" caption>
                  finished this card dated
                  <!-- <span class="text-weight-bold">{{ a.info.split(' -> ')[1] }}</span> -->
                  <q-chip>
                    <q-avatar icon="check_circle" color="orange" text-color="white" />
                    {{ a.info.split(' -> ')[1] }}
                  </q-chip>
                </q-item-label>
                <q-item-label v-else-if="a.action === 'editedCardDueDate'" caption>
                  changed the due date from
                  <span class="text-weight-medium">{{ a.info }}</span>
                </q-item-label>
                <q-item-label v-else-if="a.action === 'cardRateRequest'" caption>
                  requested to rate their quality of work
                  <span class="text-weight-medium">{{ a.info }}</span>
                </q-item-label>
                <q-item-label v-else-if="a.action === 'cardRating'" caption>
                  rated this work 
                  <q-chip>
                    <q-avatar :color="this.$global.colorRate(a.info)" text-color="white">{{ a.info }}</q-avatar>
                    <span>{{ this.$global.rateDefinition(a.info) }}</span>
                  </q-chip>
                </q-item-label>
              </q-item-section>

              <q-item-section side top>
                <q-item-label caption>{{ $timeAgo(a.created_at) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>
</template>

<script>
import Assignment from 'components/Assignment.vue'

export default {
  props: ['modelValue', 'proj', 'board'],

  data () {
    // const card = JSON.parse(JSON.stringify({...this.modelValue}))
    console.log(this.modelValue)

    const card = {...this.modelValue}
    if (card.category) {
      card.category = card.category.id
    }

    // card.attachments = []

    return {
      sending: false,
      $fetchTimer: null,
      comment: '',
      hovering: '',
      origCard: {...card},
      $log: console.log,
      searchCategory: '',
      card,
      drawer: false,
      drawerR: true,
      b: {
        name: '',
        description: ''
      }
    }
  },
  async unmounted () {
    console.log('unmounted')
    this.$global.updateURL(`/project/${this.proj.id}`)
    clearInterval(this.$fetchTimer)
  },
  async mounted () {
    this.$global.updateURL(`/project/${this.proj.id}/${this.card.id}`)
    await this.getAttachments()
    await this.getActivities()
    await this.getAssignees()

    this.$fetchTimer = setInterval(() => {
      this.getActivities()
    }, 1000 * 5);
  },

  emits: [
    // REQUIRED
    'ok', 'hide'
  ],

  computed: {
    hasChanges () {
      const orig = JSON.parse(JSON.stringify(this.origCard))
      const newCard = JSON.parse(JSON.stringify(this.card))
      delete orig.activities
      delete newCard.activities
      return JSON.stringify(orig) !== JSON.stringify(newCard)
    }
  },

  methods: {
    async getAssignees () {
      
      this.card.assignedTo = (await this.$strapi.get('/cards/'+this.card.id)).data.assignedTo
      console.log('getting Assignees', this.card.assignedTo)
    },
    async getActivities() {
      const query = this.$qs.stringify({
        _where: {
          // project: this.proj.id,
          card: this.card.id
        },
        _sort: 'created_at:DESC'
      })
      const { data } = await this.$strapi.get('/activities/?'+query)

      console.log(query, data)

      return this.card.activities = data
    },
    async sendComment () {
      this.sending = true
      try {
        const dd = await this.$strapi.post('/activities', {
          action: 'commented',
          from: this.board.name,
          to: this.board.name,
          user: this.$global.user.user.id,
          info: this.comment + '',
          project: this.proj.id,
          card: this.card.id
        })
        // this.card.activities.unshift(activity)
        this.comment = ''

        await this.$strapi.post('/projects/sendMail', {
          subject: `${this.card.name} - ${this.proj.name}`,
          from: this.$global.user.user.email,
          to: this.$global.user.user.email === this.card.owner.email ? '' : this.card.owner.email,
          cc: this.card.assignedTo.filter(m => m.email !== this.$global.user.user.email).map(m => m.email).join(', '),
          system: this.proj.name,
          html: {
            firstName: this.$global.user.user.email === this.card.owner.email ? '' : this.card.owner.displayName,
            message: `${dd.data.info}`,
            url: {
              text: `Login to reply`,
              link: `${this.$global.mailURL}/#/project/${this.proj.id}/${this.card.id}`
            }
          }
        })

        this.getActivities()
      } catch (error) {}
      this.sending = false
    },
    openAssignmentPrompt () {
      this.$q.dialog({
        component: Assignment,
        componentProps: {
          'modelValue': this.proj,
          proj: this.proj,
          board: this.board,
          card: this.card
        }
      }).onOk(async assignedTo => {
        this.card.assignedTo = assignedTo
        this.getActivities()
      })
    },
    async removeAttachment(f, i) {
      const { data } = await this.$strapi.delete('/upload/files/'+f.id)

      console.log('f', JSON.stringify(f))

      const activity = await this.$strapi.post('/activities', {
        action: 'removedAttachment',
        user: this.$global.user.user.id,
        from: this.board.name,
        to: this.board.name,
        info: JSON.stringify(f),
        project: this.proj.id,
        card: this.card.id
      })

      this.card.attachments.splice(i, 1)
      this.origCard.attachments.splice(i, 1)

      this.getActivities()
    },
    async getAttachments() {
      const { data } = await this.$strapi.get('/cards/'+this.card.id)

      return this.card.attachments = data.attachments
    },
    async downloadAttachment (f) {
      // console.log(f)
      const { data } = await this.$strapi.get(f.url, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', f.name) //or any other extension
      link.click()
      // this.$fileDownload(data, f.name)
    },
    async uploadAttachments (e) {
      console.log(e.target.files)
      if (e.target.files.length) {
        const formData = new FormData()
        e.target.files.forEach(file => {
          formData.append('files', file)
        })

        for (const i in e.target.files) {
          formData.append(`files[${i}]`, e.target.files[i])
        }

        formData.append('ref', 'card')
        formData.append('refId', this.card.id)
        formData.append('field', 'attachments')

        console.log(formData.getAll('files'))

        const uploadResult = await this.$strapi.post('/upload', formData)
        console.log('uploaded', uploadResult)

        await this.$strapi.post('/activities', {
          action: 'attached',
          user: this.$global.user.user.id,
          from: this.board.name,
          to: this.board.name,
          info: JSON.stringify(uploadResult.data),
          project: this.proj.id,
          card: this.card.id
        })
        this.getActivities()
        this.getAttachments()
      }
    },
    show () {
      this.$refs.dialog.show()
    },

    // following method is REQUIRED
    // (don't change its name --> "hide")
    hide () {
      this.$refs.dialog.hide()
    },

    onDialogHide () {
      // required to be emitted
      // when QDialog emits "hide" event
      this.$emit('hide')
    },

    async save () {
      // on OK, it is REQUIRED to
      // emit "ok" event (with optional payload)
      // before hiding the QDialog

      const { data: cardFromDB } = await this.$strapi.put('/cards/'+ this.card.id, this.card)

      if (this.origCard.name !== this.card.name) {
        console.log(this.$diff(this.origCard.name, this.card.name))
        
        const dd = await this.$strapi.post('/activities', {
          action: 'editedCardName',
          user: this.$global.user.user.id,
          from: this.board.name,
          to: this.board.name,
          info: this.$diff(this.origCard.name, this.card.name),
          project: this.proj.id,
          card: this.card.id
        })
      }

      if (this.origCard.description !== this.card.description) {
        const dd = await this.$strapi.post('/activities', {
          action: 'editedCardDescription',
          user: this.$global.user.user.id,
          from: this.board.name,
          to: this.board.name,
          info: this.$diff(this.origCard.description, this.card.description),
          project: this.proj.id,
          card: this.card.id
        })
      }

      if (this.origCard.category && this.origCard.category !== this.card.category) {
        console.log('saving', this.origCard, this.card, this.proj.categories.filter(c => c.id === this.origCard.category))
        // console.log( this.proj.categories.filter(c => c.id === this.origCard.category)[0].name + '->' + this.proj.categories.filter(c => c.id === this.card.category)[0].name)
        const dd = await this.$strapi.post('/activities', {
          action: 'editedCardCategory',
          user: this.$global.user.user.id,
          from: this.board.name,
          to: this.board.name,
          info: this.proj.categories.filter(c => c.id === this.origCard.category)[0].name + ' -> ' + this.proj.categories.filter(c => c.id === this.card.category)[0].name,
          project: this.proj.id,
          card: this.card.id
        })
      }

      if (!this.origCard.category && this.card.category) {
        console.log('saving', this.origCard, this.card, this.proj.categories.filter(c => c.id === this.origCard.category))
        // console.log( this.proj.categories.filter(c => c.id === this.origCard.category)[0].name + '->' + this.proj.categories.filter(c => c.id === this.card.category)[0].name)
        const dd = await this.$strapi.post('/activities', {
          action: 'updatedCardCategory',
          user: this.$global.user.user.id,
          from: this.board.name,
          to: this.board.name,
          info: this.proj.categories.filter(c => c.id === this.card.category)[0].name,
          project: this.proj.id,
          card: this.card.id
        })
      }

      if (this.origCard.targetStart !== this.card.targetStart) {
        // console.log('saving', this.origCard, this.card)
        // console.log( this.proj.categories.filter(c => c.id === this.origCard.category)[0].name + '->' + this.proj.categories.filter(c => c.id === this.card.category)[0].name)
        const dd = await this.$strapi.post('/activities', {
          action: 'editedCardTargetStart',
          user: this.$global.user.user.id,
          from: this.board.name,
          to: this.board.name,
          info: this.origCard.targetStart + ' -> ' + this.card.targetStart,
          project: this.proj.id,
          card: this.card.id
        })
      }

      if (this.origCard.dateFinished !== this.card.dateFinished) {
        // console.log('saving', this.origCard, this.card)
        // console.log( this.proj.categories.filter(c => c.id === this.origCard.category)[0].name + '->' + this.proj.categories.filter(c => c.id === this.card.category)[0].name)
        const dd = await this.$strapi.post('/activities', {
          action: 'editedCardDateFinished',
          user: this.$global.user.user.id,
          from: this.board.name,
          to: this.board.name,
          info: this.origCard.dateFinished + ' -> ' + this.card.dateFinished,
          project: this.proj.id,
          card: this.card.id
        })
      }

      if (this.origCard.dueDate !== this.card.dueDate) {
        console.log('saving', this.origCard, this.card)
        // console.log( this.proj.categories.filter(c => c.id === this.origCard.category)[0].name + '->' + this.proj.categories.filter(c => c.id === this.card.category)[0].name)
        const dd = await this.$strapi.post('/activities', {
          action: 'editedCardDueDate',
          user: this.$global.user.user.id,
          from: this.board.name,
          to: this.board.name,
          info: this.origCard.dueDate + ' -> ' + this.card.dueDate,
          project: this.proj.id,
          card: this.card.id
        })
      }

      if (this.origCard.forRating !== this.card.forRating && this.card.forRating) {
          const dd = await this.$strapi.post('/activities', {
          action: 'cardRateRequest',
          user: this.$global.user.user.id,
          from: this.board.name,
          to: this.board.name,
          project: this.proj.id,
          card: this.card.id
        })

        await this.$strapi.post('/projects/sendMail', {
          subject: `${this.card.name} - ${this.proj.name}`,
          from: this.$global.user.user.email,
          to: this.card.owner.email,
          cc: this.card.assignedTo.filter(m => m.email !== this.$global.user.user.email).map(m => m.email).join(', '),
          system: this.proj.name,
          html: {
            firstName: '',
            message: `${this.$global.user.user.displayName} requested to rate their quality of work`,
            url: {
              text: `★ ★ ★ ☆ ☆`,
              link: `${this.$global.mailURL}/#/project/${this.proj.id}/${this.card.id}`
            }
          }
        })
      }

      if (this.card.rating > 0 && this.origCard.rating !== this.card.rating) {
        const dd = await this.$strapi.post('/activities', {
          action: 'cardRating',
          user: this.$global.user.user.id,
          from: this.board.name,
          to: this.board.name,
          info: this.card.rating.toString(),
          project: this.proj.id,
          card: this.card.id
        })

        console.log('HHOOY mag RATE NA!')

        const score = {
          1: `★ ☆ ☆ ☆ ☆`,
          2: `★ ★ ☆ ☆ ☆`,
          3: `★ ★ ★ ☆ ☆`,
          4: `★ ★ ★ ★ ☆`,
          5: `★ ★ ★ ★ ★`,
        }

        await this.$strapi.post('/projects/sendMail', {
          subject: `${this.card.name} - ${this.proj.name}`,
          from: this.$global.user.user.email,
          // to: this.card.owner.email,
          cc: this.card.assignedTo.filter(m => m.email !== this.$global.user.user.email).map(m => m.email).join(', '),
          system: this.proj.name,
          html: {
            firstName: '',
            message: `${this.$global.user.user.displayName} rated this work ${this.$global.rateDefinition(dd.data.info)} (${dd.data.info})`,
            url: {
              text: score[dd.data.info],
              link: `${this.$global.mailURL}/#/project/${this.proj.id}/${this.card.id}`
            }
          }
        })
      }

      await this.getActivities()

      // console.log('timi timi', this.card, this.origCard)

      this.$emit('ok', cardFromDB)
      // or with payload: this.$emit('ok', { ... })
    
      

      // then hiding dialog
      this.hide()
    },

    onCancelClick () {
      // we just need to hide the dialog
      this.hide()
    }
  }
}
</script>

<style>
  del {
    background:#ffe6e6;
  }

  ins {
    background:#e6ffe6;
  }
</style>