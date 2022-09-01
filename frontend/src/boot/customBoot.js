import { boot } from 'quasar/wrappers'

import { reactive, watch, computed } from 'vue'

import { LocalStorage } from 'quasar'

import qs from 'qs'

import { Dialog } from 'quasar'

// import TimeAgo from 'javascript-time-ago'
import { format, formatDistance, formatRelative, subDays, subBusinessDays } from 'date-fns'

import en from 'javascript-time-ago/locale/en'

import draggable from 'vuedraggable'

import { date } from 'quasar'

// import fileDownload from 'js-file-download'

import MD5 from "crypto-js/md5"

// "async" is optional;
export default boot(async ( { app, router } ) => {
  // something to do

  app.component('draggable', draggable)

  const { globalProperties } = app.config

  globalProperties.$qs = qs
  // globalProperties.$fileDownload = fileDownload

  globalProperties.$JSON = JSON

  globalProperties.$date = date

  // TimeAgo.addLocale(en)
  // const $timeAgo = new TimeAgo('en-US')

  globalProperties.$nearDueDate = (dueDate, rating) => {
    if (!dueDate) return false
    if (rating) return false
    console.log('subBusinessDays(new Date(), 3)', subBusinessDays(new Date(), 3), new Date(dueDate), rating)
    return subBusinessDays(new Date(dueDate), 3) <= new Date()
  }

  

  globalProperties.$timeAgo = (dt) => {
    // return $timeAgo.format(new Date(dt))
    return formatDistance(new Date(dt), new Date(), { addSuffix: true })
  }

  globalProperties.$sanitizeHtml = html => html.replace(/[\u00A0-\u9999<>\&]/g, i => {
      return '&#'+i.charCodeAt(0)+';'
  })

  // globalProperties.$leftDrawerOpen = ref(true)

  globalProperties.$popupCenter = ({url, title, w, h}) => {
    // Fixes dual-screen position                             Most browsers      Firefox
    const dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
    const dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;

    const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    const systemZoom = width / window.screen.availWidth;
    const left = (width - w) / 2 / systemZoom + dualScreenLeft
    const top = (height - h) / 2 / systemZoom + dualScreenTop
    const newWindow = window.open(url, title, 
      `
      scrollbars=yes,
      width=${w / systemZoom}, 
      height=${h / systemZoom}, 
      top=${top}, 
      left=${left}
      `
    )

    if (window.focus) newWindow.focus();

    newWindow.onblur = newWindow.close
  }

  const { host, hostname, protocol } = window.location

  const $global = reactive({
    host: protocol + '//' + (hostname === 'localhost' ? '10.10.120.19:1339' : host),
    mailURL: 'https://it-helpdesk-mirdc.ap.ngrok.io',
    user: null,
    projects: [],
    leftDrawerOpen: true,
    rateDefinitions: ['Poor', 'Fair', 'Satisfactory', 'Very Satisfactory', 'Outstanding'],
    rateDefinition (rate) {
      return $global.rateDefinitions[+rate-1]
    },
    colorRate (rate) {
      return ['negative', 'deep-orange', 'positive', 'secondary', 'orange'][+rate-1]
    },
    updateURL (path) {
      const { href } = router.resolve(path)
      window.history.replaceState({}, null, href)
    },
    ifAct (con, act) {
      if (con) act()
    },
    isProjectOwner (project) {
      // console.log('project', project.owner)
      if (!project.owner) return
      return project.owner.id === $global.user.user.id
    },
    isProjectMember (project) {
      if (!project.members) return
      console.log('isProjectMember', project.members)
      return project.members.filter(m => m.id === $global.user.user.id).length
    },
    isCardOwner (card) {
      if (!card.owner) return
      console.log('isCardOwner', card)
      return card.owner.id === $global.user.user.id
    },
    isCardMember (card) {
      if (!card.assignedTo) return
      console.log('isCardMember', card.assignedTo)
      return card.assignedTo.filter(m => m.id === $global.user.user.id).length
    },
    async login (identifier, password) {
      try {
        const { data: user } = await globalProperties.$axios.post(this.host+'/auth/local', {
          identifier,
          password
        })
        console.log(user)
        $global.setAuthorization(user.jwt)
        $global.user = user
        LocalStorage.set('user', user)
      } catch (error) {
        throw error
      }
    },
    async logout () {
      $global.user = null
      LocalStorage.remove('user')
    },
    setAuthorization (jwt) {
      console.log(jwt)
      globalProperties.$strapi.defaults.headers.common['Authorization'] = 'Bearer ' + jwt
      globalProperties.$strapi.interceptors.request.use(function (config) {
        config.headers.Authorization = 'Bearer ' + jwt
        return config;
      })
    },
    async checkSession (identifier, password) {
      try {
        const user = LocalStorage.getItem('user')
        console.log(user)
        $global.setAuthorization(user.jwt)
        const { data } = await globalProperties.$strapi.get($global.host+'/restaurants/count')
        $global.user = user
      } catch (error) {
        $global.logout()
        return false
      }
      return true
    },
    openProject(id) {
      console.log(id)
      setTimeout(() => {
        router.push('/project/'+id)
      }, 500) 
    },
    async updateProjectAt (proj) {
      const { data } = await globalProperties.$strapi.put('/projects/'+proj.id, {
        revs: +proj.revs + 1
      })
      return data
    },
    async getProjects () {
      if ($global.user) {
        const { user, jwt } = $global.user
        const query = qs.stringify({
          _where: {
            _or: [
              {'owner': user.id},
              {'members': user.id},
              {'privacy': 'public'}
            ]
          },
          _sort: 'created_at:DESC'
        })

        console.log('query', query, user.id)

        const { data } = await globalProperties.$strapi.get('/projects?'+query, {
          headers: {
            Authorization: 'Bearer ' + jwt
          }
        })
        $global.projects = data
      } else {
        $global.projects = []
      }

      return $global.projects
    },
    newProjectPrompt () {
      Dialog.create({
        title: 'Project Name',
        prompt: {
          model: '',
          isValid: val => val.length > 2, // << here is the magic
          type: 'text' // optional
        },
        ok: {
          label: 'create'
        }
      }).onOk(async name => {
        const { data: newProject } = await globalProperties.$strapi.post('/projects', {
          name,
          owner: $global.user.user.id
        })
        console.log(newProject)
        $global.projects.unshift(newProject)
      })
    }
  })
  console.log(await $global.checkSession())
  watch( () => $global.user, async (user) => {
    if (user) {
      await $global.getProjects();
    } else {
      $global.projects = []
    }
    
  })
  $global.getProjects()

  globalProperties.$console = console
  globalProperties.$setTimeout = setTimeout
  globalProperties.$global = $global

  globalProperties.$colors = ['pink', 'deep-purple', 'indigo', 'light-blue', 'cyan', 'teal', 'brown', 'orange', 'blue-grey', 'red']

  globalProperties.$getFirstTwoChars = name => {
    if (name === undefined) return 'AB'
    return name.match(/\b(\w)/g).join('').substring(0,2)
  }

  globalProperties.$md5 = MD5

  globalProperties.$randomLastNameColor = name => globalProperties.$colors[MD5(name).toString().substr(19,1).charCodeAt().toString().substr(1,1)]

  const diff = new (require('text-diff'))()

  globalProperties.$diff = (a, b) => {
    return diff.prettyHtml(diff.main(a+'', b+''))
  }
})
