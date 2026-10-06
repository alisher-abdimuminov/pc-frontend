import { useColorMode } from '@vueuse/core'

/** light/dark rejim (html.dark klassi, localStorage'da saqlanadi) */
export function useTheme() {
  const mode = useColorMode({ storageKey: 'pc-theme', initialValue: 'light' })
  const isDark = computed(() => mode.value === 'dark')
  const toggle = () => {
    mode.value = isDark.value ? 'light' : 'dark'
  }
  return { mode, isDark, toggle }
}
