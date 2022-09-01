<template>
  <q-dialog ref="dialog" @hide="onDialogHide" persistent>
    <div class="bg-white q-pa-md q-gutter-sm" style="min-width: 300px;">
      <div class="q-field__label text-weight-light text-caption">Members</div>
      <div class="row">
        <q-chip v-for="(m, i) in members" :key="m.id" @mouseleave="hovering = null" @mouseover="hovering = m.id">
          <q-avatar :color="$randomLastNameColor(m.displayName)" text-color="white">{{ $getFirstTwoChars(m.displayName) }}</q-avatar>
          {{ m.displayName }}
          <q-btn
            @click="() => {
              members.splice(i, 1)
            }"
            v-show="hovering === m.id" color="grey" style="left: 8px;" round dense icon="close"
          size="xs"/>
        </q-chip>
      </div>
      <q-select
        ref="membersSelect"
        @input-value="searchUsers"
        use-input
        filled
        v-model="membersToAdd"
        multiple
        :options="options.map(u => {
            return {
              label: u.displayName,
              value: u.id,
              ...u
            }
          })"
        use-chips
        stack-label
        label="New members"
        />
      <div class="row q-gutter-sm">
        <q-space></q-space>
        <q-btn flat label="cancel" v-close-popup />
        <q-btn color="primary" icon="save" label="Save" @click="save" />
      </div>
    </div>
  </q-dialog>
</template>

<script>
export default {
  props: ['modelValue', 'proj', 'board'],

  data () {
    return {
      hovering: null,
      options: [],
      members: [],
      membersToAdd: [],
    }
  },

  async mounted () {
    await this.getMembers()
  },

  emits: [
    // REQUIRED
    'ok', 'hide'
  ],

  computed: {
  },

  methods: {
    async searchUsers (name) {
      const query = this.$qs.stringify({
        _q: name
      })
      const { data } = await this.$strapi.get('/users/?'+query)
      console.log(this.options)
      this.$refs.membersSelect.showPopup()
      return this.options = data
    },
    async getMembers () {
      const query = this.$qs.stringify({
        project_membership: this.proj.id
      })
      const { data } = await this.$strapi.get('/users/?'+query)
      this.members = data.map(u => ({...u, label: u.displayName}))
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

      const { data: { members } } = await this.$strapi.put('/projects/'+this.proj.id, {
        members: [
          ...this.members.map(u => u.id),
          ...this.membersToAdd.map(u => u.id)
        ]
      })

      this.$emit('ok', members)
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