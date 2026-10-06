<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

/** shadcn Pagination o'rami: o'zbekcha yozuvlar, mobilda faqat strelkalar + joriy sahifa */
const page = defineModel<number>('page', { required: true })
defineProps<{ total: number, perPage: number, disabled?: boolean }>()
</script>

<template>
  <Pagination
    v-slot="{ page: current }"
    v-model:page="page"
    :total="total"
    :items-per-page="perPage"
    :sibling-count="1"
    :disabled="disabled"
    show-edges
  >
    <PaginationContent v-slot="{ items }">
      <PaginationPrevious>
        <ChevronLeftIcon />
        <span class="hidden sm:inline">Oldingi</span>
      </PaginationPrevious>

      <template v-for="(item, index) in items" :key="index">
        <PaginationItem
          v-if="item.type === 'page'"
          :value="item.value"
          :is-active="item.value === current"
          class="max-sm:hidden"
          :class="{ 'max-sm:inline-flex': item.value === current }"
        >
          {{ item.value }}
        </PaginationItem>
        <PaginationEllipsis v-else :index="index" class="max-sm:hidden" />
      </template>

      <PaginationNext>
        <span class="hidden sm:inline">Keyingi</span>
        <ChevronRightIcon />
      </PaginationNext>
    </PaginationContent>
  </Pagination>
</template>
