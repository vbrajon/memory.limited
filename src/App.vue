<script>
export default {
  data() {
    return {
      now: new Date().format("hh:mm"),
      search: "",
      history: Array(10).fill({}),
      tabs: Array(10).fill({}),
      bookmarks: Array(10).fill({}),
      hoff: 0,
      toff: 0,
      boff: 0,
      size: Math.min(10, Math.floor((window.innerHeight - 200) / 80)),
    }
  },
  computed: {
    h() {
      if (!this.search) return this.history
      const r = RegExp(this.search, "i")
      return this.history.filter((v) => ["title", "url"].some((k) => r.test(v[k])))
    },
    t() {
      if (!this.search) return this.tabs
      const r = RegExp(this.search, "i")
      return this.tabs.filter((v) => ["title", "url"].some((k) => r.test(v[k])))
    },
    b() {
      if (!this.search) return this.bookmarks
      const r = RegExp(this.search, "i")
      return this.bookmarks.filter((v) => ["title", "url", "year"].some((k) => r.test(v[k])))
    },
  },
  methods: {
    backup() {
      const backup = { history: this.history, tabs: this.tabs, bookmarks: this.bookmarks }
      const blob = new Blob([JSON.stringify(backup)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `memory-limited-${new Date().format("YYYY-MM-DD")}.json`
      a.click()
    },
  },
  async created() {
    const flat = (v) => {
      if (v.length) return v.map(flat).flat()
      if (v.children) return flat(v.children)
      return { ...v, year: new Date(v.dateAdded).format("YYYY") }
    }
    const bookmarks = flat(await chrome.bookmarks.getTree.promisify()).sort("-dateAdded")
    const history = await chrome.history.search.promisify({ text: "", maxResults: 10, startTime: Date.now() - 90 * 24 * 60 * 60 * 1000 })
    const tabs = (await chrome.sessions.getDevices.promisify()).flatMap((v) => v.sessions).flatMap((v) => v.window.tabs)
    this.history = Object.freeze(history)
    this.tabs = Object.freeze(tabs)
    this.bookmarks = Object.freeze(bookmarks)
    setInterval(() => (this.now = new Date().format("hh:mm")), 1000)

    const localHistory = await idb.get("history")
    const lastVisitTime = localHistory ? localHistory[0].lastVisitTime + 1 : Date.now() - 90 * 24 * 60 * 60 * 1000
    const recentHistory = await chrome.history.search.promisify({ text: "", maxResults: 0, startTime: lastVisitTime })
    const fullHistory = recentHistory.concat(localHistory || [])
    this.history = Object.freeze(fullHistory)
    await idb.set("history", fullHistory)
  },
}
</script>

<template>
  <div class="relative flex">
    <div class="absolute -translate-y-full p-1 text-[9px] font-bold">Hit "Tab" to focus, "Arrows" to navigate</div>
    <input class="h-[4.5rem] flex-1 rounded px-6 text-2xl font-bold sm:max-w-[66%] dark:bg-slate-800 dark:placeholder-slate-300 dark:hover:bg-slate-600" type="search" placeholder="Search" v-model="search" />
    <div class="grid grid-cols-2 gap-2 px-2 max-md:hidden">
      <button class="h-8 w-8 rounded bg-slate-100 shadow hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-600" @click="window.chrome.tabs.update({ url: 'chrome://downloads' })">
        <div class="i-lucide/cloud-download text-lg"></div>
      </button>
      <button class="h-8 w-8 rounded bg-slate-100 shadow hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-600" @click="backup">
        <div class="i-lucide/cloud-upload text-lg"></div>
      </button>
      <button class="h-8 w-8 rounded bg-slate-100 shadow hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-600" @click="window.chrome.tabs.update({ url: 'chrome://extensions' })">
        <div class="i-lucide/package text-lg"></div>
      </button>
      <button class="h-8 w-8 rounded bg-slate-100 shadow hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-600" @click="window.chrome.tabs.update({ url: 'chrome://settings' })">
        <div class="i-lucide/settings text-lg"></div>
      </button>
    </div>
    <div class="ml-auto flex text-7xl font-bold max-sm:hidden" v-text="now"></div>
  </div>
  <div class="mt-auto flex gap-4 py-4">
    <div class="flex flex-1 flex-col gap-4">
      <button class="mx-auto flex rounded p-2 hover:bg-slate-200 hover:shadow dark:hover:bg-slate-600" @click="window.chrome.tabs.update({ url: 'chrome://history' })">
        <div class="i-lucide/clock mr-2 text-xl"></div>
        <div class="w-10" v-text="h.length"></div>
      </button>
      <div class="-m-2 overflow-auto" :style="{ height: 80 * size + 'px' }" @scroll="hoff = Math.floor($event.target.scrollTop / 76.8)">
        <div class="sticky top-0 grid gap-4 p-2">
          <a class="line-clamp-2 flex h-16 place-content-center place-items-center rounded bg-slate-100 p-4 shadow hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-600" :href="item.url" rel="nofollow noreferrer" v-for="item in h.slice(hoff, hoff + size)">
            <img class="pr-2" :src="'/_favicon/?size=16&pageUrl=' + encodeURIComponent(item.url || 'https://x.com')" />
            <div class="line-clamp-2 font-medium" v-text="item.title"></div>
            <div class="ml-auto pl-2" v-text="new Date(item.lastVisitTime).relative().replace(/ (.*?)s? ago/, (m, u) => Date.UNITS.find(([k]) => k === u)[2])"></div>
          </a>
        </div>
        <div :style="`height: ${(h.length - size) * 76.8}px`" v-if="h.length > size"></div>
      </div>
    </div>
    <div class="flex flex-1 flex-col gap-4 max-sm:hidden">
      <button class="mx-auto flex rounded p-2 hover:bg-slate-200 hover:shadow dark:hover:bg-slate-600" @click="window.chrome.tabs.update({ url: 'chrome://bookmarks' })">
        <div class="i-lucide/bookmark mr-2 text-xl"></div>
        <div class="w-10" v-text="b.length"></div>
      </button>
      <div class="-m-2 overflow-auto" :style="{ height: 80 * size + 'px' }" @scroll="boff = Math.floor($event.target.scrollTop / 76.8)">
        <div class="sticky top-0 grid gap-4 p-2">
          <a class="line-clamp-2 flex h-16 place-content-center place-items-center rounded bg-slate-100 p-4 shadow hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-600" :href="item.url" rel="nofollow noreferrer" v-for="item in b.slice(boff, boff + size)">
            <img class="pr-2" :src="'/_favicon/?size=16&pageUrl=' + encodeURIComponent(item.url || 'https://x.com')" />
            <div class="line-clamp-2 font-medium" v-text="item.title"></div>
            <div class="ml-auto pl-2" v-text="new Date(item.dateAdded).format('YYYY')"></div>
          </a>
        </div>
        <div :style="`height: ${(b.length - size) * 76.8}px`" v-if="b.length > size"></div>
      </div>
    </div>
    <div class="flex flex-1 flex-col gap-4 max-md:hidden">
      <button class="mx-auto flex rounded p-2 hover:bg-slate-200 hover:shadow dark:hover:bg-slate-600" @click="window.chrome.tabs.update({ url: 'chrome://history/syncedTabs' })">
        <div class="i-lucide/smartphone mr-2 text-xl"></div>
        <div class="w-10" v-text="t.length"></div>
      </button>
      <div class="-m-2 overflow-auto" :style="{ height: 80 * size + 'px' }" @scroll="toff = Math.floor($event.target.scrollTop / 76.8)">
        <div class="sticky top-0 grid gap-4 p-2">
          <a class="line-clamp-2 flex h-16 place-content-center place-items-center rounded bg-slate-100 p-4 shadow hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-600" :href="item.url" rel="nofollow noreferrer" v-for="item in t.slice(toff, toff + size)">
            <img class="pr-2" :src="'/_favicon/?size=16&pageUrl=' + encodeURIComponent(item.url || 'https://x.com')" />
            <div class="line-clamp-2 font-medium" v-text="item.title"></div>
            <div class="ml-auto pl-2" v-text="new Date(item.lastVisitTime).relative().replace(/ (.*?)s? ago/, (m, u) => Date.UNITS.find(([k]) => k === u)[2])"></div>
          </a>
        </div>
        <div :style="`height: ${(t.length - size) * 76.8}px`" v-if="t.length > size"></div>
      </div>
    </div>
  </div>
</template>
