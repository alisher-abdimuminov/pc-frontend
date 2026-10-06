export default defineNuxtPlugin(() => {
  const tg = window.Telegram?.WebApp
  if (tg?.initData) {
    tg.ready()
    tg.expand()
  }
})
