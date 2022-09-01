<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <div class="bg-white q-pa-md" style="min-width: 300px;">
      <div class="q-field__label text-weight-light text-caption">Categories</div>
      <draggable
        style="min-height: 30px;"
        :disabled="false"
        class="q-gutter-sm q-pa-sm"
        @change="change"
        :list="categories" 
        group="boards" 
        item-key="name">
        <template #item="{element, index}">
          <q-card @mouseover="hovering = element.name + index" @mouseleave="hovering = ''" v-ripple class="row shadow-1 q-pa-sm">
            <div>
              {{ element.name }}
            </div>
            <q-space></q-space>
            <q-btn @mouseover="hovering = element.name + index" @mouseleave="hovering = ''" v-show="hovering === element.name + index" flat round dense size="sm" icon="delete" color="red" class="bg-red-1" @click="removeCategory(element, index)" />
          </q-card>
        </template>
      </draggable>
      <div class="q-pa-sm">
        <q-card v-ripple class="shadow-1 row justify-center">
          <q-btn v-show="!showNewCategoryName" icon="add" color="grey" dense flat round @click="newCategory" />
          <div v-show="showNewCategoryName" class="col q-pa-xs q-gutter-xs">
            <q-input ref="newCategoryName" dense v-model="categoryName" @keyup.enter="createCategory" />
            <div class="row q-gutter-sm items-center">
              <q-btn size="sm" @click="createCategory">Add</q-btn>
              <q-btn size="sm" icon="close" round flat @click="closeNewCategory"/>
              <q-space />
              <!-- <q-btn size="sm">Add</q-btn> -->
            </div>
          </div>
        </q-card>
      </div>
      
      <!-- <div class="row q-gutter-sm">
        <q-space></q-space>
        <q-btn flat label="cancel" v-close-popup />
        <q-btn color="primary" icon="save" label="Save" @click="save" />
      </div> -->
    </div>
  </q-dialog>
</template>

<script>
export default {
  props: ['modelValue', 'proj', 'board'],

  data () {
    return {
      categories: [],
      hovering: '',
      showNewCategoryName: false,
      categoryName: ''
    }
  },

  async mounted () {
    await this.getCategories()
  },

  emits: [
    // REQUIRED
    'ok', 'hide'
  ],

  computed: {
  },

  methods: {
    async removeCategory (cat, i) {
      const { data } = await this.$strapi.delete('/categories/'+cat.id)
      this.categories.splice(i, 1)
    },
    newCategory () {
      this.showNewCategoryName = true
      setTimeout(() => {
        this.$refs.newCategoryName.focus()
      }, 300)
    },
    async createCategory () {
      const { data: newCategory } = await this.$strapi.post('/categories', {
        name: this.categoryName,
        index: this.categories.length,
        project: this.proj.id
      })
      this.categories.push(newCategory)
    },
    closeNewCategory () {
      this.showNewCategoryName = false
    },
    async getCategories () {
      const query = this.$qs.stringify({
        project: this.proj.id
      })
      const { data } = await this.$strapi.get('/categories/?'+query)
      this.categories = data.map(u => ({...u, label: u.name}))
    },
    async change (change) {
      console.log(change, this.categories[change.moved.newIndex], this.categories[change.moved.oldIndex])
      if (change.moved) {
        await this.$strapi.put('/categories/'+this.categories[change.moved.newIndex].id, {
          index: change.moved.newIndex
        })
        await this.$strapi.put('/categories/'+this.categories[change.moved.oldIndex].id, {
          index: change.moved.oldIndex
        })
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

      // await this.$strapi.put('/projects/'+this.proj.id, {
      //   members: [
      //     ...this.members.map(u => u.id),
      //     ...this.membersToAdd.map(u => u.id)
      //   ]
      // })

      this.$emit('ok', this.categories)
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