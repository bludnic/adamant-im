<template>
  <component v-bind:is="transactionComponent" :id="tx_id" :crypto="crypto" />
</template>

<script>
import AdmTransaction from '../../components/transactions/AdmTransaction.vue'
import EthTransaction from '../../components/transactions/EthTransaction.vue'
import Erc20Transaction from '../../components/transactions/Erc20Transaction.vue'

import { Cryptos, isErc20 } from '../../lib/constants'

export default {
  name: 'transaction',
  props: ['tx_id', 'crypto'],
  components: {
    AdmTransaction,
    EthTransaction,
    Erc20Transaction
  },
  computed: {
    transactionComponent () {
      if (this.crypto === Cryptos.ETH) return 'eth-transaction'
      if (isErc20(this.crypto)) return 'erc20-transaction'
      return 'adm-transaction'
    }
  }
}
</script>
