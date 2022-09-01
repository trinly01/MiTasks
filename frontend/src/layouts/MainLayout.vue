<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <span @click="$router.push('/')" class="cursor-pointer" >Mi Tasks</span>
        </q-toolbar-title>

        <q-btn v-show="!$global.user">
          Login
          <q-popup-proxy ref="popupLogin" @show="$refs.usernameInput.select()">
            <div class="bg-white column q-pa-md" style="width: 320px;">
              <q-input v-model="username" label="Employee ID" ref="usernameInput" @keyup.enter="login" :disable="loggingIn" :error="invalidCredentials" />
              <q-input v-model="password" label="Password" type="password" @keyup.enter="login" :disable="loggingIn" :error="invalidCredentials" error-message="Invalid Credentials" />
              <div class="row q-pt-md">
                <q-btn flat @click="$popupCenter({url: 'http://10.10.120.32:3536/', title: 'Manage Account', w: 900, h: 600})">Manage Account</q-btn>
                <q-space />
                <q-btn :loading="loggingIn" @click="login">Login</q-btn>
              </div>
            </div>
          </q-popup-proxy>
        </q-btn>
        <q-btn flat :class="'bg-'+$randomLastNameColor($global.user.user.displayName)" v-if="$global.user" round>
          <q-avatar text-color="white">{{ $getFirstTwoChars($global.user.user.displayName) }}</q-avatar>
          <q-tooltip>Account</q-tooltip>
          <q-popup-proxy>
            <q-img src="https://cdn.quasar.dev/img/material.png" style="height: 150px">
              <div class="bg-transparent">
                <q-avatar :color="$randomLastNameColor($global.user.user.displayName)" text-color="white">{{ $getFirstTwoChars($global.user.user.displayName) }}</q-avatar>
                <!-- <q-avatar size="56px">
                  <q-img v-show="!$global.user.imgError"
                    :src="`http://10.10.120.3/images/employeeImages/${$global.user.username}.jpg`"
                    @error="() => {
                      $global.user.imgError = true
                    }"
                  />
                  <img
                    v-show="$global.user.imgError"
                    src="https://cdn.quasar.dev/img/boy-avatar.png">
                </q-avatar> -->
                <div class="text-weight-bold">{{ $global.user.user.displayName }}</div>
                <div>{{ $global.user.user.email }}</div>
              </div>
            </q-img>
            <div class="column q-pb-md q-pr-md q-pl-md" style="width: 320px;">
              <div class="row q-pt-md">
                <q-btn flat @click="$popupCenter({url: 'http://10.10.120.32:3536/', title: 'Manage Account', w: 900, h: 600})">Manage Account</q-btn>
                <q-space />
                <q-btn :loading="loggingIn" @click="$global.logout()">Logout</q-btn>
              </div>
            </div>
          </q-popup-proxy>
        </q-btn>
        <!-- {{ $route.path }} -->
      </q-toolbar>
    </q-header>
    <q-drawer
      v-if="$route.path !== '/'"
      v-model="$global.leftDrawerOpen"
      show-if-above
      bordered
    >

      <q-list class="q-pa-sm q-gutter-sm" style="overflow-x: hidden;">
        <q-card v-ripple class="row justify-center items-center">
          <q-btn round icon="add" size="xl" label="" flat color="grey"></q-btn>
        </q-card>
        <q-item-label
          header
          class="text-grey-8"
        >
          Projects
        </q-item-label>
        <projectCard
          style="max-width: 280px;"
          v-for="proj in $global.projects"
          :project="proj"
          :key="proj.id"
        />
        <!-- <q-card
          v-for="proj in $global.projects"
          :key="proj.id"
          v-ripple
          @click="$global.openProject(proj.id)"
        >
          <q-card-section :class="'bg-' + $randomLastNameColor('a ' + proj.name) + '-5 text-white'">
            <div class="text-h6 cut-text">{{ proj.name }}</div>
            <div class="text-subtitle2">{{ proj.shortDesc }}</div>
          </q-card-section>
          <q-separator />
          <q-card-actions class="row justify-between">
            <div class="q-gutter-xs">
              <q-badge rounded color="orange" label="12" />
              <q-badge rounded color="green" label="0" />
              <q-badge rounded color="red" label="23" />
            </div>
            <q-btn color="red" round flat icon="delete" />
          </q-card-actions>
        </q-card> -->
      </q-list>
      <!-- <q-list>
        <q-item-label
          header
          class="text-grey-8"
        >
          Projects
        </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list> -->
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
// import EssentialLink from 'components/EssentialLink.vue'

import { defineComponent, ref, watch } from 'vue'
import projectCard from 'components/projectCard.vue'

export default defineComponent({
  name: 'MainLayout',

  components: {
    projectCard
  },

  created () {
    watch(
      () => this.$global.user,
      async user => {
        if (!user) this.$refs.popupLogin.show()
      }
    )
  },
  data () {
    return {
      username: '',
      password: '',
      invalidCredentials: false,
      loggingIn: false,
      // essentialLinks: linksList,
      // leftDrawerOpen: ref(false),
      timer: null,
    }
  },
  // setup () {
    
  //   return {
  //     username: ref(''),
  //     password: ref(''),
  //     invalidCredentials: ref(false),
  //     loggingIn: ref(false),
  //     // essentialLinks: linksList,
  //     // leftDrawerOpen: ref(false),
  //     timer: null,
  //   }
  // },
  methods: {
    toggleLeftDrawer () {
      console.log('hey', this.$global.leftDrawerOpen)
      this.$global.leftDrawerOpen = !this.$global.leftDrawerOpen
    },
    async login () {
      this.loggingIn = true
      console.log('loggingIn')

      clearTimeout(this.timer)
      try {
        await this.$global.login(this.username, this.password)
        this.username = ''
        this.password = ''
        this.$refs.popupLogin.hide()
      } catch (error) {
        this.invalidCredentials = true
      }
      this.loggingIn = false
      
      this.timer = setTimeout(() => {
        this.invalidCredentials = false
      }, 5000)
    }
  }
})
</script>
