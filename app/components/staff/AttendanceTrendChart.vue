<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { DashboardDay } from '~/types'

/**
 * Kunlik davomat: fon treki - amaliyotga borishi kerak bo'lganlar (kutilgan),
 * to'ldirilgan ustun - kamida bitta qadamni tasdiqlaganlar (kelgan). Bitta o'q, bitta o'lchov (talaba soni).
 */
const props = defineProps<{ days: DashboardDay[] }>()

const view = ref<'chart' | 'table'>('chart')
const hovered = ref<number | null>(null)

const max = computed(() => {
  const m = Math.max(1, ...props.days.map(d => d.expected))
  // o'q uchun "chiroyli" yuqori chegara
  const step = m <= 5 ? 1 : m <= 20 ? 5 : m <= 100 ? 10 : 50
  return Math.ceil(m / step) * step
})
const ticks = computed(() => [max.value, Math.round(max.value / 2), 0])

const pct = (v: number) => `${(v / max.value) * 100}%`
const rate = (d: DashboardDay) => (d.expected ? Math.round((d.came / d.expected) * 100) : null)
const dayLabel = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`
const WEEK = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']
const weekday = (iso: string) => WEEK[new Date(`${iso}T00:00:00`).getDay()]
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <!-- legenda: 2 ta element - har doim ko'rinadi -->
      <div class="flex items-center gap-4 text-xs text-muted-foreground">
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2.5 rounded-sm bg-[#65a30d]" /> Kelgan
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2.5 rounded-sm bg-muted-foreground/25" /> Kutilgan
        </span>
      </div>
      <ToggleGroup
        :model-value="view"
        type="single"
        variant="outline"
        size="sm"
        aria-label="Ko'rinish"
        @update:model-value="$event && (view = $event as 'chart' | 'table')"
      >
        <ToggleGroupItem value="chart">
          Grafik
        </ToggleGroupItem>
        <ToggleGroupItem value="table">
          Jadval
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <div v-if="view === 'chart'" class="flex gap-2">
      <!-- y o'qi -->
      <div class="flex h-48 w-6 flex-col justify-between text-right text-[10px] text-muted-foreground tabular-nums">
        <span v-for="t in ticks" :key="t" class="-translate-y-1/2 last:translate-y-1/2">{{ t }}</span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="relative h-48">
          <!-- yordamchi chiziqlar -->
          <div
            v-for="(t, i) in ticks"
            :key="t"
            class="absolute inset-x-0 border-t"
            :class="i === ticks.length - 1 ? 'border-border' : 'border-dashed border-border/60'"
            :style="{ bottom: pct(t) }"
          />
          <div class="absolute inset-0 flex items-end gap-0.5">
            <div
              v-for="(d, i) in days"
              :key="d.date"
              class="relative flex h-full flex-1 items-end justify-center"
              @mouseenter="hovered = i"
              @mouseleave="hovered = null"
              @focus="hovered = i"
              @blur="hovered = null"
              tabindex="0"
              :aria-label="`${dayLabel(d.date)}: ${d.came} / ${d.expected}`"
            >
              <!-- hit-target ustunning o'zidan katta (butun balandlik) -->
              <div
                v-if="d.expected"
                class="relative w-full max-w-8 rounded-t-[4px] bg-muted-foreground/15 transition-colors"
                :class="{ 'bg-muted-foreground/25': hovered === i }"
                :style="{ height: pct(d.expected) }"
              >
                <div
                  class="absolute inset-x-0 bottom-0 rounded-t-[4px] bg-[#65a30d]"
                  :style="{ height: d.expected ? `${(d.came / d.expected) * 100}%` : '0' }"
                />
              </div>

              <!-- tooltip -->
              <div
                v-if="hovered === i"
                class="pointer-events-none absolute bottom-full z-10 mb-2 w-max rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"
                :class="i < 3 ? 'left-0' : i > days.length - 4 ? 'right-0' : 'left-1/2 -translate-x-1/2'"
              >
                <div class="font-medium">
                  {{ weekday(d.date) }}, {{ dayLabel(d.date) }}
                </div>
                <template v-if="d.expected">
                  <div class="mt-1 flex items-center gap-1.5 text-muted-foreground">
                    <span class="size-2 rounded-sm bg-[#65a30d]" /> Kelgan:
                    <b class="text-foreground tabular-nums">{{ d.came }}</b>
                  </div>
                  <div class="flex items-center gap-1.5 text-muted-foreground">
                    <span class="size-2 rounded-sm bg-muted-foreground/25" /> Kutilgan:
                    <b class="text-foreground tabular-nums">{{ d.expected }}</b>
                  </div>
                  <div class="text-muted-foreground">
                    3/3: <b class="text-foreground tabular-nums">{{ d.full }}</b> · {{ rate(d) }}%
                  </div>
                </template>
                <div v-else class="mt-1 text-muted-foreground">
                  Amaliyot kuni emas
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- x o'qi -->
        <div class="mt-1.5 flex gap-0.5 text-center text-[10px] text-muted-foreground tabular-nums">
          <span v-for="(d, i) in days" :key="d.date" class="flex-1" :class="{ 'max-sm:invisible': i % 2 === 1 && i !== days.length - 1 }">
            {{ dayLabel(d.date) }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="max-h-72 overflow-auto rounded-lg border">
      <Table>
        <TableHeader class="sticky top-0 bg-muted">
          <TableRow>
            <TableHead>Sana</TableHead>
            <TableHead class="text-right">
              Kutilgan
            </TableHead>
            <TableHead class="text-right">
              Kelgan
            </TableHead>
            <TableHead class="text-right">
              3/3
            </TableHead>
            <TableHead class="text-right">
              %
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody class="tabular-nums">
          <TableRow v-for="d in [...days].reverse()" :key="d.date">
            <TableCell>{{ weekday(d.date) }}, {{ dayLabel(d.date) }}</TableCell>
            <TableCell class="text-right">
              {{ d.expected || '—' }}
            </TableCell>
            <TableCell class="text-right">
              {{ d.expected ? d.came : '—' }}
            </TableCell>
            <TableCell class="text-right">
              {{ d.expected ? d.full : '—' }}
            </TableCell>
            <TableCell class="text-right">
              {{ rate(d) ?? '—' }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
