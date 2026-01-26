<script setup lang="ts">
import type {
  LogisticsWidgetData,
  OrderWidgetData,
  PriceComparisonWidgetData,
  ProductListWidgetData,
  ProductWidgetData,
  WidgetData,
} from './types'

import LogisticsWidget from './LogisticsWidget.vue'
import OrderWidget from './OrderWidget.vue'
import PriceComparisonWidget from './PriceComparisonWidget.vue'
import ProductListWidget from './ProductListWidget.vue'
import ProductWidget from './ProductWidget.vue'

interface IProps {
  type: string
  data: WidgetData
}
const props = defineProps<IProps>()

const widgetType = ['order', 'logistics', 'product', 'product_list', 'price_comparison']
</script>

<template>
  <OrderWidget v-if="type === 'order'" :data="data as OrderWidgetData" />
  <LogisticsWidget v-else-if="type === 'logistics'" :data="data as LogisticsWidgetData" />
  <ProductWidget v-else-if="type === 'product'" :data="data as ProductWidgetData" />
  <ProductListWidget v-else-if="type === 'product_list'" :data="data as ProductListWidgetData" />
  <PriceComparisonWidget v-else-if="type === 'price_comparison'" :data="data as PriceComparisonWidgetData" />
</template>
