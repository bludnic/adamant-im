import Queue from 'promise-queue'

import { Transactions, Delegates } from './constants'
import utils from './adamant'
import client from './adamant-api-client'
import renderMarkdown from './markdown'

Queue.configure(Promise)

/** Promises queue to execute them sequentially */
const queue = new Queue(1, Infinity)

/** @type {{privateKey: Buffer, publicKey: Buffer}} */
let myKeypair = { }
let myAddress = null

const publicKeysCache = { }

/**
 * Creates a new transaction with the common fields pre-filled
 * @param {number} type transaction type
 * @returns {{type: number, senderId: string, senderPublicKey: string, timestamp: number}}
 */
function newTransaction (type) {
  return {
    type,
    amount: 0,
    senderId: myAddress,
    senderPublicKey: myKeypair.publicKey.toString('hex')
  }
}

/**
 * Sets transaction timestamp and signature and returns it.
 * @param {object} transaction ADM transaction
 * @param {number} timeDelta server endpoint time delta
 * @returns {object}
 */
function signTransaction (transaction, timeDelta) {
  if (transaction.signature) {
    delete transaction.signature
  }

  transaction.timestamp = utils.epochTime() - timeDelta
  transaction.signature = utils.transactionSign(transaction, myKeypair)

  return transaction
}

export function unlock (passphrase) {
  const hash = utils.createPassPhraseHash(passphrase)
  myKeypair = utils.makeKeypair(hash)
  myAddress = utils.getAddressFromPublicKey(myKeypair.publicKey)
}

/**
 * Retrieves current account details, creating it if necessary.
 * @returns {Promise<any>}
 */
export function getCurrentAccount () {
  const publicKey = myKeypair.publicKey.toString('hex')

  return client.get('/api/accounts', { publicKey })
    .then(response => {
      if (response.success) {
        return response.account
      } else if (response.error === 'Address not found') {
        // Create account if it does not yet exist
        return client.post('/api/accounts/new', { publicKey }).then(response => {
          if (response.error) throw new Error(response.error)
          response.account.isNew = true
          return response.account
        })
      }

      throw new Error(response.error)
    })
    .then(account => {
      account.balance = utils.toAdm(account.balance)
      account.unconfirmedBalance = utils.toAdm(account.unconfirmedBalance)
      account.publicKey = myKeypair.publicKey
      return account
    })
}

/**
 * Returns `true` if API client is unlocked and ready to process requests. *
 * @returns {Boolean}
 */
export function isReady () {
  return Boolean(myAddress && myKeypair)
}

/**
 * Retrieves user public key by his address
 * @param {string} address ADM address
 * @returns {Promise<string>}
 */
export function getPublicKey (address = '') {
  if (publicKeysCache[address]) {
    return Promise.resolve(publicKeysCache[address])
  }

  return client.get('/api/accounts/getPublicKey', { address })
    .then(response => {
      const key = response.publicKey
      publicKeysCache[address] = key
      return key
    })
}

/**
 * @typedef {Object} MsgParams
 * @property {string} to target address
 * @property {string|object} message message to send (object value will be JSON-serialized)
 * @property {number} type 1 for a regular message, 2 for a special one
 * @property {number} amount ADMs to send with this message
 */

/**
 * Sends message with the specified payload
 * @param {MsgParams} params
 * @returns {Promise<{success: boolean, transactionId: string}>}
 */
export function sendMessage (params) {
  return getPublicKey(params.to)
    .then(publicKey => {
      const text = typeof params.message === 'string'
        ? params.message
        : JSON.stringify(params.message)
      const encoded = utils.encodeMessage(text, publicKey, myKeypair.privateKey)
      const chat = {
        message: encoded.message,
        own_message: encoded.nonce,
        type: params.type || 1
      }

      const transaction = newTransaction(Transactions.CHAT_MESSAGE)
      transaction.amount = params.amount ? utils.prepareAmount(params.amount) : 0
      transaction.asset = { chat }
      transaction.recipientId = params.to

      return client.post('/api/chats/process', (endpoint) => {
        return { transaction: signTransaction(transaction, endpoint.timeDelta) }
      })
    }).catch(reason => {
      return reason
    })
}

/**
 * Sends special message with the specified payload
 * @param {string} to recipient address
 * @param {object} payload message payload
 */
export function sendSpecialMessage (to, payload) {
  return sendMessage({ to, message: payload, type: 2 })
}

/**
 * Stores the supplied value into the Adamant KVS under the specified key.
 * @param {string} key key for the stored value
 * @param {any} value value to store
 * @returns {Promise<{success: boolean}>}
 */
export function storeValue (key, value, encode = false) {
  if (encode) {
    const encoded = utils.encodeValue(value, myKeypair.privateKey)
    value = JSON.stringify(encoded)
  }

  const transaction = newTransaction(Transactions.STATE)
  transaction.asset = { state: { key, value, type: 0 } }
  transaction.signature = utils.transactionSign(transaction, myKeypair)
  return client.post('/api/states/store', (endpoint) => {
    return { transaction: signTransaction(transaction, endpoint.timeDelta) }
  })
}

function tryDecodeStoredValue (value) {
  let json = null
  try {
    json = JSON.parse(value)
  } catch (e) {
    // Not a JSON => not an encoded value
    return value
  }

  if (json.nonce) {
    try {
      return utils.decodeValue(json.message, myKeypair.privateKey, json.nonce)
    } catch (e) {
      console.warn('Failed to parse encoded value', e)
      throw e
    }
  }

  return json
}

/**
 * Retrieves the stored value from the Adamant KVS
 * @param {string} key key in the KVS
 * @param {string=} ownerAddress address of the value owner
 * @returns {Promise<any>}
 */
export function getStored (key, ownerAddress) {
  if (!ownerAddress) {
    ownerAddress = myAddress
  }

  const params = {
    senderId: ownerAddress,
    key,
    orderBy: 'timestamp:desc',
    limit: 1
  }

  return client.get('/api/states/get', params).then(response => {
    let value = null

    if (response.success && Array.isArray(response.transactions)) {
      const tx = response.transactions[0]
      value = tx && tx.asset && tx.asset.state && tx.asset.state.value
    }

    return tryDecodeStoredValue(value)
  })
}

/**
 * Sends the specified amount of ADM to the specified ADM address
 * @param {string} to receiver address
 * @param {number} amount amount of ADM to send
 * @returns {Promise<{success: boolean, transactionId: string}>}
 */
export function sendTokens (to, amount) {
  const transaction = newTransaction(Transactions.SEND)
  transaction.amount = utils.prepareAmount(amount)
  transaction.recipientId = to
  transaction.signature = utils.transactionSign(transaction, myKeypair)

  return client.post('/api/transactions/process', (endpoint) => {
    return { transaction: signTransaction(transaction, endpoint.timeDelta) }
  })
}

export function getDelegates (limit, offset) {
  return client.get('/api/delegates', { limit, offset })
}

export function getDelegatesWithVotes (address) {
  return client.get('/api/accounts/delegates', { address })
}

export function getDelegatesCount () {
  return client.get('/api/delegates/count')
}

export function checkUnconfirmedTransactions () {
  return client.get('/api/transactions/unconfirmed')
}

export function voteForDelegates (votes) {
  let transaction = newTransaction(Transactions.VOTE)
  transaction = Object.assign({
    asset: { votes: votes },
    recipientId: myAddress,
    amount: 0
  }, transaction)
  transaction.signature = utils.transactionSign(transaction, myKeypair)
  return client.post('/api/accounts/delegates', (endpoint) => signTransaction(transaction, endpoint.timeDelta))
}

export function getNextForgers () {
  return client.get('/api/delegates/getNextForgers', { limit: Delegates.ACTIVE_DELEGATES })
}

export function getBlocks () {
  return client.get('/api/blocks?orderBy=height:desc&limit=100')
}

export function getForgedByAccount (accountPublicKey) {
  return client.get('/api/delegates/forging/getForgedByAccount', { generatorPublicKey: accountPublicKey })
}

/**
 * Retrieves ADM transactions.
 * @param {{type: number, from: number, to: number}} options specifies height range
 * @returns {Promise<{success: boolean, transactions: Array}>}
 */
export function getTransactions (options = { }) {
  const query = {
    inId: myAddress,
    'and:type': options.type || Transactions.SEND,
    orderBy: 'timestamp:desc'
  }

  if (options.to) {
    query['and:toHeight'] = options.to
  }

  if (options.from) {
    query['and:fromHeight'] = options.from
  }

  return client.get('/api/transactions', query)
}

/**
 * Returns transaction with the specified ID.
 * @param {string} id transaction ID
 * @returns {Promise<{id: string, height: number, amount: number}>}
 */
export function getTransaction (id) {
  const query = { id }
  return client.get('/api/transactions/get', query)
    .then(response => {
      if (response.success) return response
      return client.get('/api/transactions/unconfirmed/get', query)
    })
    .then(response => response.transaction || null)
}

/**
 * Retrieves chat messages for the current account.
 * @param {number} from fetch messages starting from the specified height
 * @param {number} offset offset (defaults to 0)
 * @returns {Promise<{count: number, transactions: Array}>}
 */
export function getChats (from = 0, offset = 0) {
  const params = {
    isIn: myAddress,
    orderBy: 'timestamp:desc'
  }

  if (from) {
    params.fromHeight = from
  }

  if (offset) {
    params.offset = offset
  }

  return client.get('/api/chats/get/', params).then(response => {
    const { count, transactions } = response

    const promises = transactions.map(transaction => {
      const promise = (transaction.recipientId === myAddress)
        ? Promise.resolve(transaction.senderPublicKey)
        : queue.add(() => getPublicKey(transaction.recipientId))

      return promise
        .then(key => decodeChat(transaction, key))
        .catch(err => console.warn('Failed to parse chat message', { transaction, err }))
    })

    return Promise.all(promises).then(decoded => ({
      count,
      transactions: decoded
    }))
  })
}

/**
 * Decodes chat transaction message setting the `message` property of the `transaction`. If the message is a
 * pre-defined I18N-one, `isI18n` property is also set to `true`.
 * @param {{senderId: string, asset: object}} transaction chat transaction
 * @param {Buffer} key sender public key
 * @returns {{senderId: string, asset: object, message: any, isI18n: boolean}}
 */
function decodeChat (transaction, key) {
  const chat = transaction.asset.chat
  const message = utils.decodeMessage(chat.message, key, myKeypair.privateKey, chat.own_message)

  if (chat.type === 2) {
    // So-called rich-text messages of type 2 are actually JSON objects
    transaction.message = JSON.parse(message)
  } else {
    // Text message may actually be an internationalizable auto-generated message (we used to have those
    // at the beginning)
    const i18nMsg = getI18nMessage(message, transaction.senderId)
    if (i18nMsg) {
      // Yeap, that's a i18n one
      transaction.message = i18nMsg
      transaction.isI18n = true
    } else {
      transaction.message = renderMarkdown(message)
    }
  }

  return transaction
}

/**
 * Checks if the specified `message` is an auto-generated i18n message. If it is, its respective i18n code is returned.
 * Otherwise returns an empty string.
 * @param {string} message message to check
 * @param {string} senderId message sender address
 * @returns {string}
 */
function getI18nMessage (message, senderId) {
  // At the beginning of the project we used to send auto-generated welcome messages to the new users.
  // These messages have i18n codes as their content and known senders listed below.
  // P.S. I hate this function, but there's no way to get rid of it now.

  const isI18n =
    (message.indexOf('chats.welcome_message') > -1 && senderId === 'U15423595369615486571') ||
    (message.indexOf('chats.preico_message') > -1 && senderId === 'U7047165086065693428') ||
    (message.indexOf('chats.ico_message') > -1 && senderId === 'U7047165086065693428')

  if (isI18n) {
    if (senderId === 'U15423595369615486571') {
      return 'chats.welcome_message'
    }
    if (senderId === 'U7047165086065693428') {
      return 'chats.ico_message'
    }
  }

  return ''
}
