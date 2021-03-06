<template>
  <div class="chat_entry black-text"
       v-bind:class="{
        'right-align-block' :  direction === 'from'
    }">
    <md-layout
      class="chat_message md-whiteframe md-whiteframe-1dp"
      v-bind:class="{
        'md-flex-xsmall-offset-10 from-message': direction === 'from',
        'md-own md-flex-xsmall-offset-5': direction === 'to'
      }"
      v-if="!brief"
    >
      <div v-if="direction !== 'to'" class="message-tick" :data-confirmation="confirm"></div>
      <div v-if="readOnly" class="adamant-avatar"></div>
      <div v-else class="avatar-holder" v-bind:class="{fromAvatarHolder: toMessageFlag}"></div>
      <div class="message-block">
        <div class="msg-holder">
          <div class="sent-message" v-bind:class="{to: toMessageFlag, sent: sentMessageFlag, confirm: confirmMessageFlag, reject: retryMessageFlag}">
            <slot></slot>
          </div>
        </div>
        <div v-if="!readOnly" class="dt">{{ $formatDate(timestamp) }}</div>
        <div v-if='retryMessageFlag'>
          <div class="retryMessage" v-on:click='retryMessage'>{{getRetryMessage}}</div>
        </div>
      </div>
    </md-layout>
    <span v-if="brief">
      <slot name="brief-view"></slot>
    </span>
  </div>
</template>

<script>

export default {
  name: 'chat-entry-template',
  props: ['confirm', 'direction', 'timestamp', 'brief', 'readOnly', 'message'],
  methods: {
    retryMessage () {
      this.$store.dispatch('retry_message', this.message.id)
    }
  },
  computed: {
    retryMessageFlag () {
      return this.confirm === 'rejected'
    },
    sentMessageFlag () {
      return this.confirm === 'sent'
    },
    confirmMessageFlag () {
      return this.confirm === 'confirmed'
    },
    toMessageFlag () {
      return this.direction === 'to'
    },
    getRetryMessage () {
      return this.$i18n.t('chats.retry_message')
    }
  }
}
</script>

<style>
  .confirm {
    padding: 5px 0
  }
  .sent {
    padding: 5px 0
  }
  .to {
    padding: 5px 0
  }
  .reject {
    padding: 10px 0
  }
  .chat_entry {
    width: 100%;
  }
  .fromAvatarHolder {
    top: 18px !important;
  }
  .black-text {
    color: rgba(0, 0, 0, 0.87) !important;
  }
  .chat_message p {
    margin: 0;
    padding: 5px 0;

    overflow-wrap: break-word;
    word-wrap: break-word;

    -ms-word-break: break-all;
    /* This is the dangerous one in WebKit, as it breaks things wherever */
    word-break: break-all;
    /* Instead use this non-standard one: */
    word-break: break-word;

    /* Adds a hyphen where the word breaks, if supported (No Blink) */
    -ms-hyphens: auto;
    -moz-hyphens: auto;
    -webkit-hyphens: auto;
    hyphens: auto;
  }

  .message-tick:before {
    content: 'done';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    position: absolute;
    bottom: 0;
    left: 1px;
    font-size: 8px;
  }

  [data-confirmation=confirmed]:before {
    content: 'done';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    position: absolute;
    bottom: 0;
    left: 1px;
    font-size: 8px;
  }

  [data-confirmation=sent]:before {
    content: 'watch_later';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    position: absolute;
    bottom: 0;
    left: 1px;
    font-size: 8px;
  }

  [data-confirmation=sent] p {
    color: red;
  }

  [data-confirmation=rejected]:before {
    content: 'cancel';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    position: absolute;
    bottom: 0;
    left: 1px;
    color: red;
    font-size: 8px;
  }

  [data-confirmation=unconfirmed]:before {
    content: 'query_builder';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    position: absolute;
    bottom: 0;
    left: 1px;
    font-size: 8px;
  }

  [data-confirmation=error]:before {
    content: 'error';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    position: absolute;
    bottom: 0;
    left: 1px;
    font-size: 8px;
  }

  .msg-holder {
    margin-top: -10px;
    margin-left: 2px;
  }

  .msg-holder .transaction-amount {
    font-size: 24px;
    cursor: pointer;
  }

  .chat_message {
    margin-bottom: 20px;
    padding: 15px 10px;
    text-align: left;
    position:relative;
    padding-right: 50px;
    min-height: 0;
    flex: 0 1 auto !important;
    min-width: 110px;
    max-width: 70%;
  }

  .chat_message .dt {
    position: absolute;
    top: 0;
    right: 5px;
    font-size: 8px;
    font-style: italic;
  }

  .chat_message.md-own {
    margin-left: 5% !important;
  }

  .from-message {
    border-right: 3px #ebebeb solid;
    margin-right: 5% !important;
    margin-left: 5% !important;
  }

  .chat_messagej:after {
    content: ' ';
    position: absolute;
    width: 0;
    height: 0;
    left: -20px;
    right: auto;
    top: 0px;
    bottom: auto;
    border: 22px solid;
    border-color: #4A4A4A transparent transparent transparent;
  }

  .adamant-avatar {
    width: 45px;
    height: 45px;
    position: absolute;
    top: 5px;
    left: 0;
    background: url('/img/Wallet/adm-address.svg');
  }

  .md-whiteframe.md-whiteframe-1dp {
    background: white !important;
    border-radius: 4px !important;
    box-shadow: 0 1px 10px rgba(100,100,100,.06), 0 1px 1px rgba(100,100,100,.04), 0 2px 10px -1px rgba(100,100,100,.02) !important;
  }

  .right-align-block {
    justify-content: flex-end;
  }

  .retryMessage {
    font-size: 10px;
    font-style: italic;
    color: red;
    cursor: pointer;
    margin-left: 4px;
    margin-top: -8px;
  }
</style>
