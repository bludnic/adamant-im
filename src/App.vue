<template>
  <v-app :dark="getDarkTheme">
    <v-content>
      <router-view/>
    </v-content>
    <v-footer fixed app>
      <v-layout row>
        <v-flex xs12 >
          <v-layout row wrap>
            <v-flex xs4 sm3>

            </v-flex>
            <v-flex xs4 sm3>

            </v-flex>
            <v-flex xs4 sm3>

            </v-flex>
            <v-flex hidden-xs-only sm3 class="text-sm-right">
            </v-flex>
          </v-layout>
        </v-flex>
      </v-layout>
    </v-footer>
    <Snackbar :message="$store.state.snackbarMessage"></Snackbar>

    <md-theme md-name="grey">
      <main>
        <router-view></router-view>
      </main>
      <footer :style="footerCss">
        <div class="bottom-fixed">
          <md-bottom-bar v-if="logged && isBottomPanelShown && !isTransferBackShown" md-theme="bottomBar">
            <md-bottom-bar-item md-icon="account_balance_wallet" v-on:click="$router.push('/home/')" :md-active="!!$router.currentRoute.path.match(/\/home\//) || !!$router.currentRoute.path.match(/\/transactions\//) || !!$router.currentRoute.path.match(/\/transfer\//)">{{$t('bottom.wallet_button')}}</md-bottom-bar-item>
            <md-bottom-bar-item md-icon="forum" v-on:click="$router.push('/chats/')" :md-active="chatsPage">{{$t('bottom.chats_button')}}<div class="new-icon" v-if="totalNew">{{ totalNew }}</div></md-bottom-bar-item>
            <md-bottom-bar-item md-icon="settings" v-on:click="$router.push('/options/')" :md-active="!!$router.currentRoute.path.match(/\/options\//)">{{$t('bottom.settings_button')}}</md-bottom-bar-item>
            <md-bottom-bar-item md-icon="exit_to_app" v-on:click="exitme" :title="$t('bottom.exit_button_tooltip')">{{$t('bottom.exit_button')}}</md-bottom-bar-item>
          </md-bottom-bar>
        </div>
      </footer>
      <a name="bottom"></a>
    </md-theme>
    <div class="forbid" v-if="disabled" style="display: table;"><div style="display: table-cell; vertical-align: middle;">{{ $t('login.device_unsupported') }}</div></div>
    <audio ref="messageSound" class="newMessageNotification" id="messageSound" src="/sound/bbpro_link.mp3"></audio>
  </v-app>
</template>

<script>
import i18n from './i18n'
import { mapGetters } from 'vuex'
import Snackbar from '@/components/common/Snackbar'

export default {
  name: 'app',
  components: {
    Snackbar
  },
  mounted: function () {
    this.checkChatPage(this.$router.currentRoute.path)
    setInterval(
      ((self) => {
        return function () {
          if (self.$store.state.totalNewChats > 0 && (self.$store.state.notifyBar)) {
            if (window.notify_amount !== self.$store.state.totalNewChats) {
              if (window.notify_interval) {
                clearInterval(window.notify_interval)
              }
              window.notify_toggle = false
              window.notify_amount = self.$store.state.totalNewChats
              window.notify_interval = setInterval(function () {
                if (window.notify_toggle) {
                  document.title = i18n.t('app_title')
                } else {
                  var newTitle = ''
                  if (window.notify_amount % 10 === 1 && window.notify_amount % 100 !== 11) {
                    newTitle = window.notify_amount + ' ' + i18n.t('new_messages_1')
                  } else if (window.notify_amount % 10 >= 2 && window.notify_amount % 10 <= 4 && (window.notify_amount % 100 < 10 || window.notify_amount % 100 >= 20)) {
                    newTitle = window.notify_amount + ' ' + i18n.t('new_messages_2')
                  } else {
                    newTitle = window.notify_amount + ' ' + i18n.t('new_messages_5')
                  }
                  document.title = newTitle
                }
                window.notify_toggle = !window.notify_toggle
              }, 1000)
            }
          } else {
            if (window.notify_interval) {
              clearInterval(window.notify_interval)
              setTimeout(function () {
                document.title = i18n.t('app_title')
              }, 200)
            }

            if (document.title !== i18n.t('app_title')) {
              setTimeout(function () {
                document.title = i18n.t('app_title')
              }, 200)
            }
          }
          self.$store.dispatch('update')
        }
      })(this),
      3000
    )

    window.audio = require('simple-audio')

    if (!this.$store.getters.getPassPhrase && this.$route.path !== '/') {
      this.$router.push('/')
    }
  },
  methods: {
    showSnack (text, color = 'error') {
      this.$store.commit('setMessage', { snackbar_visibility: true, text, color })
    },
    exitme () {
      this.$store.commit('logout')
      this.$store.dispatch('reset')
      this.$router.push('/')
    },
    checkChatPage (path) {
      this.chatsPage = path.includes('/chats')
    }
  },
  computed: {
    ...mapGetters([
      'getDarkTheme'
    ]),
    footerCss () {
      if (this.$store.getters.getPassPhrase) {
        return 'display:block'
      }
      return 'display:none'
    },
    totalNew () {
      return this.$store.state.totalNewChats
    },
    disabled () {
      return this.$store.state.disabled
    },

    isTransferBackShown () {
      return this.transferBackShown
    },
    isBottomPanelShown () {
      return this.$store.state.showBottom
    },
    isAjax () {
      return this.$store.state.ajaxIsOngoing
    },
    logged () {
      return this.$store.getters.getPassPhrase
    }
  },
  watch: {
    '$route.name': function (name) {
      this.transferBackShown = (this.$router.currentRoute.name === 'Transfer')
    }
  },
  updated () {
    this.checkChatPage(this.$router.currentRoute.path)
  },
  data () {
    return {
      transferBackShown: (this.$router.currentRoute.name === 'Transfer'),
      chatsPage: false
    }
  }
}
</script>

<style>
body {
  margin: 0;
  min-height: 100%;

}
#app {
    min-height: 100vh;
}
html {
    background-color: #fefefe;
}
body.md-theme-default {
    /*background-color: #fefefe;*/
    background: repeating-linear-gradient(140deg,#f6f6f6,#f6f6f6 1px,#fefefe 0,#fefefe 5px)
}
footer {
    height: 100px;
}
.login {
    position:relative;
}
.aloader {
    position: fixed!important;
    top: 0;
}
.md-toolbar .md-title
{
    min-width: 70%;
}
.md-toolbar .md-title .md-input-container:after {
    background: none !important;
}
.md-toolbar .md-title .md-input-container.md-input-focused:after {
    background-color: rgba(0, 0, 0, 0.12);
}
.md-toolbar .md-title .md-input-container
{
    padding-top: 16px;
    min-height: 48px;
}
.md-toolbar .md-title .md-input-container label
{
    top: 13px;
    font-size: 18px;
}
.md-theme-grey.md-input-container.md-input-focused label {
  color: rgba(0, 0, 0, 0.54) !important;
}
.md-toolbar .md-title .md-input-container.md-input-focused label, .md-toolbar .md-title .md-input-container.md-has-value label {
    top: 0;
    font-size: 12px;
}
.md-bottom-bar .new-icon {
    position: absolute;
    right: -5px;
    top: -30px;
    color: #4A4A4A;
    width: 20px;
    height: 20px;
    background: #BAD3FF;
    border-radius: 10px;
    line-height: 20px;
    text-align: center;
    z-index: 100;
}
.bottom-fixed{
    position:fixed;
    bottom:0;
    width:100%;
    max-width: 800px;
    margin: 0 auto;
    left: 0;
    right: 0;
    z-index: 10;
    background: white;
}

.bottom-fixed .md-bottom-bar {
    box-shadow: none;
    border-top: 1px solid lightgray;
}
.chat, .home, .chats, .settings, .transaction, .transfer, .login, .votes {
    max-width: 800px;
    margin: 0 auto;
    margin-top: 25px;
}
.login {
    margin-top:0px;
}
.settings .md-table tbody .md-table-row {
    border:none;
}
.chats .md-list {
    max-width: 90%;
}
a:not(.md-button) {
  color: #2e7eed!important;
}
.login .create_link {
  color: #4a4a4a!important;
}
.version {
    position:absolute;
    bottom:0;
    right:0;
}
.forbid {
    position:fixed;
    height:100%;
    width:100%;
    top:0;
    left:0;
    background-color: white;
    text-align: center;
    z-index: 100;
    font-size: 2rem;
    line-height: 2rem;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #4A4A4A;
  font-family: 'Exo 2', sans-serif;
    overflow: hidden;
    max-width: 100%;
    height: 100%;

    max-width: 1024px;
    margin-left: auto;
    margin-right: auto;
}
.md-bottom-bar-item.md-active
{
    background-color: #BAD3FF;
    background: repeating-linear-gradient( 140deg, lightgray, lightgray 1px, #FEFEFE 1px, #FEFEFE 15px );
    color: #4A4A4A;
}

main {
  text-align: center;

}

header {
  margin: 0;
  height: 56px;
  padding: 0 16px 0 24px;
  background-color: #484848;
  color: #ffffff;
}
.md-list-item.md-menu-item
{
    background-color:rgba(255,255,255,0.9);
}
.md-primary
{
    background-color: #4A4A4A;
    color: #ffffff;
}
.md-toolbar.md-theme-grey
{
    color: #4A4A4A;
    border-bottom: 1px solid #4A4A4A;
    background-color: #ffffff;
}
header span {
  display: block;
  position: relative;
  font-size: 20px;
  line-height: 1;
  letter-spacing: .02em;
  font-weight: 400;
  box-sizing: border-box;
  padding-top: 16px;
}
@media (max-width: 480px) {
    .version {
        right:8px;
    }
}

.md-dialog {
  box-shadow: initial;
}
.md-dialog .md-primary {
  background: #ffffff;
}
.md-dialog-confirm > .md-dialog > .md-dialog-actions > button{
  color: #000 !important;
}
.md-toolbar.md-theme-grey {
    position: fixed;
    width: 100%;
    top: 0;
    max-width: 800px;
    margin: 0 auto;
    left: 0;
    right: 0;
    z-index: 10;
    /* background: rgba(153, 153, 153, 0.2); */
    /*background: #ebebeb;*/
    border-bottom: none;
}
</style>
