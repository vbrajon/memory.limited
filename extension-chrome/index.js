import "./cut.js"
import { createApp } from "./vue.esm-browser.prod.js"
window.idb = {
  db: new Promise((resolve, reject) => {
    const openreq = indexedDB.open("kvs", 1)
    openreq.onerror = () => reject(openreq.error)
    openreq.onsuccess = () => resolve(openreq.result)
    openreq.onupgradeneeded = () => openreq.result.createObjectStore("kv")
  }),
  transaction(type, fn) {
    return this.db
      .then(
        (db) =>
          new Promise((resolve, reject) => {
            const transaction = db.transaction("kv", type)
            transaction.oncomplete = () => resolve(request)
            transaction.onabort = transaction.onerror = () => reject(transaction.error)
            const request = fn(transaction.objectStore("kv"))
          })
      )
      .then((req) => req.result)
  },
  get(key) {
    return this.transaction("readonly", (store) => store.get(key))
  },
  keys() {
    return this.transaction("readonly", (store) => store.getAllKeys())
  },
  set(key, value) {
    return this.transaction("readwrite", (store) => store.put(value, key))
  },
  del(key) {
    return this.transaction("readwrite", (store) => store.delete(key))
  },
  clear() {
    return this.transaction("readwrite", (store) => store.clear())
  },
}
window.app = createApp({
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
  async created() {
    const flat = (v) => {
      if (v.length) return v.map(flat).flat()
      if (v.children) return flat(v.children)
      return { ...v, year: new Date(v.dateAdded).format("YYYY") }
    }
    const bookmarks = flat(await chrome.bookmarks.getTree.promisify()).sort("-dateAdded")
    const history = await chrome.history.search.promisify({ text: "", maxResults: 0, startTime: Date.now() - 90 * 24 * 60 * 60 * 1000 })
    const tabs = (await chrome.sessions.getDevices.promisify()).flatMap((v) => v.sessions).flatMap((v) => v.window.tabs)
    this.history = Object.freeze(history)
    this.tabs = Object.freeze(tabs)
    this.bookmarks = Object.freeze(bookmarks)
    setInterval(() => (this.now = new Date().format("hh:mm")), 1000)

    const localHistory = await idb.get("history")
    const lastVisitTime = localHistory ? localHistory.map("lastVisitTime").max().ceil() : Date.now() - 90 * 24 * 60 * 60 * 1000
    const recentHistory = await chrome.history.search.promisify({ text: "", maxResults: 0, startTime: lastVisitTime })
    const fullHistory = recentHistory.concat(localHistory || [])
    this.history = Object.freeze(fullHistory)
    await idb.set("history", fullHistory)
  },
})
app.config.globalProperties.window = window
window.instance = app.mount("main")
