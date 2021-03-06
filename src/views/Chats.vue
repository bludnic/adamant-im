<template>
  <div class="chats" style="position:relative">
      <md-layout class='chat_loads' v-if="firstLoading">
          <md-spinner :md-size="150" :md-stroke="1" md-indeterminate class="md-accent" style="margin: 0px -75px;position: fixed;left: 50%;"></md-spinner>
      </md-layout>
        <md-layout md-align="center" md-gutter="16">

        <md-list class="md-double-line md-transparent" >
            <md-list-item v-on:click="startNewChat()" :title="$t('chats.new_chat_tooltip')" id="new_chat">
                <md-avatar class="md-avatar-icon">
                    <md-icon>add</md-icon>
                </md-avatar>

                <div class="md-list-text-container">
                    <span>{{ $t('chats.new_chat') }} </span>
                    <p></p>
                </div>

            </md-list-item>

            <md-list-item :id="formatPartnerName(chat.partner)" class="black-text" v-for="(chat) in chatList" :key="chat.partner" v-on:click="$router.push('/chats/' + chat.partner + '/')">
                <md-avatar v-if="!chat.readOnly" class="md-avatar-icon" style="overflow: visible;">
                    <md-icon>sms</md-icon>
                    <div class="new-icon" v-if="newMessages(chat.partner)">{{ newMessages(chat.partner) }}</div>
                </md-avatar>
                <md-avatar class="adamant-avatar-wrapper" v-else>
                  <md-icon :md-src="adamantAvatarIcon" class="adamant-avatar"></md-icon>
                </md-avatar>
                <div class="md-list-text-container">
                    <div class="chat_entry_title">{{ chatName(chat.partner) }}</div>
                    <div class="chat-entry-wrapper">
                      <div class="message-status-block" :message-status="chat.last_message.confirm_class" v-if="chat.last_message.direction === 'from'"></div>
                      <chat-entry :message="chat.last_message" :brief="true"></chat-entry>
                    </div>
                    <span class="dt" v-if="chat.last_message.timestamp">{{ $formatDate(chat.last_message.timestamp) }}</span>
                </div>
            </md-list-item>
        </md-list>
    </md-layout>
    <new-chat openFrom="#new_chat" closeTo="#new_chat" ref="new-chat-dialog"></new-chat>
  </div>
</template>

<script>
import NewChat from '@/components/NewChat.vue'
import ChatEntry from '@/components/chat/ChatEntry.vue'

const VueScrollTo = require('vue-scrollto')
const scrollOptions = {
  duration: 1000,
  easing: 'ease',
  offset: -20,
  cancelable: true,
  onStart: false,
  onDone: false,
  onCancel: false,
  x: false,
  y: true
}

export default {
  name: 'chats',
  components: { NewChat, ChatEntry },
  methods: {
    load () {
      this.$store.dispatch('loadChats')
    },
    newMessages (address) {
      if (this.$store.state.newChats[address]) {
        return this.$store.state.newChats[address]
      }
      return 0
    },
    chatName (address) {
      return this.$store.getters['partners/displayName'](address) || address
    },
    startNewChat () {
      this.$refs['new-chat-dialog'].open()
    },
    formatPartnerName (partnerName) {
      return partnerName.replace(' ', '-')
    }
  },
  computed: {
    adamantAvatarIcon: function () {
      return '/img/Wallet/adm-address.svg'
    },
    firstLoading: function () {
      return this.$store.state.firstChatLoad
    },
    chatList: function () {
      function compare (a, b) {
        if (a.last_message.timestamp < b.last_message.timestamp) {
          return 1
        }
        if (a.last_message.timestamp > b.last_message.timestamp) {
          return -1
        }
        return 0
      }
      if (this.$store.state.chats) {
        return Object.values(this.$store.state.chats).sort(compare)
      }
      return this.$store.state.chats
    },
    lastVisitedChat: function () {
      return this.$store.getters.lastVisitedChat || null
    }
  },
  mounted () {
    let lastVisitedChat = String(this.lastVisitedChat)
    lastVisitedChat = lastVisitedChat.replace(' ', '-')
    if (lastVisitedChat) {
      let lastVisitedChatElement = document.getElementById(lastVisitedChat)
      if (lastVisitedChatElement) {
        if (lastVisitedChatElement.offsetTop > 250) {
          VueScrollTo.scrollTo('#' + lastVisitedChat, 1000, scrollOptions)
        }
      }
    }
  },
  watch: {
  },
  data () {
    return {
      targetAddress: '',
      message: ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
    .chats .chat_entry {
      max-height:25px;
      justify-content: flex-start;
    }
    .chats .chat_entry p {
        margin-top: 0;
    }
    .chat_loads {
        position: absolute;
        background: rgba(0,0,0,0.3);
        height: 100%;
        width: 100%;
        min-height: 100vh;
        left: 0;

        padding-top: 15%;
        z-index: 10;
        top: -25px;
    }
    .md-list-text-container .dt {
        position: absolute;
        top: 3px;
        right: 5px;
        font-size: 8px!important;
        font-style: italic;
        line-height:10px;
    }
    .md-avatar .new-icon {
        position: absolute;
        right: -5px;
        bottom: -5px;
        color: #4A4A4A;
        width: 20px;
        height: 20px;
        background: #BAD3FF;
        border-radius: 10px;
        line-height: 20px;
        text-align: center;
        z-index: 100;
    }
    .md-avatar {
        overflow: visible;
    }
    .md-spinner.md-accent .md-spinner-path
    {
        stroke: #4A4A4A;
    }
    .md-list-text-container p {
        max-height:25px;
    }
    .md-list-text-container p p
    {
        padding: 0;
        margin: 0;
    }
    .black-text {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    .chat_entry_title {
      font-weight: 500;
      padding-top: 3px;
      padding-bottom: 2px;
      justify-content: flex-start;
    }

    .adamant-avatar-wrapper {
      background-color: #9d9d9d !important;
    }

    .adamant-avatar {
      color: #fff !important;
    }

    .md-avatar-icon {
      background-color: #9d9d9d !important;
    }

    .md-list-item .md-list-item-container {
      padding: 0 10px 0 10px !important;
    }

    .md-list-text-container .dt {
      right: 10px !important;
    }
    .chat-entry-wrapper {
      flex-direction: row;
      display: flex;
      min-height: 25px;
    }
    .message-status-block {
      margin-right: 10px;
    }
    [message-status=confirmed]:before {
      content: 'done';
      font-family: "Material Icons";
      text-rendering: optimizeLegibility;
      position: absolute;
      bottom: 14px;
      left: 64px;
      font-size: 8px;
    }

    [message-status=unconfirmed]:before {
      content: 'query_builder';
      font-family: "Material Icons";
      text-rendering: optimizeLegibility;
      position: absolute;
      bottom: 14px;
      left: 64px;
      font-size: 8px;
    }

    [message-status=sent]:before {
      content: 'watch_later';
      font-family: "Material Icons";
      text-rendering: optimizeLegibility;
      position: absolute;
      bottom: 14px;
      left: 64px;
      font-size: 8px;
    }

    [message-status=error]:before {
      content: 'error';
      font-family: "Material Icons";
      text-rendering: optimizeLegibility;
      position: absolute;
      bottom: 14px;
      left: 64px;
      font-size: 8px;
    }

    [message-status=rejected]:before {
      content: 'cancel';
      font-family: "Material Icons";
      text-rendering: optimizeLegibility;
      position: absolute;
      bottom: 14px;
      left: 64px;
      color: red;
      font-size: 8px;
    }

    .md-list-item a {
        color: black !important;
    }

</style>
