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
const app = createApp({
  data() {
    return {
      now: new Date().format("hh:mm"),
      search: "",
      history: Array(10).fill({}),
      bookmarks: Array(10).fill({}),
      hoff: 0,
      boff: 0,
    }
  },
  computed: {
    h() {
      if (!this.search) return this.history
      const r = RegExp(this.search, "i")
      return this.history.filter((v) => ["title", "url"].some((k) => r.test(v[k])))
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
      return v
    }
    const bookmarks = flat(await chrome.bookmarks.getTree.promisify()).sort("-dateAdded")
    this.bookmarks = Object.freeze(
      bookmarks.map((v) => {
        v.year = new Date(v.dateAdded).format("YYYY")
        return v
      })
    )
    this.history = await chrome.history.search.promisify({ text: "", maxResults: 10, startTime: Date.now() - 90 * 24 * 60 * 60 * 1000 })
    setInterval(() => (this.now = new Date().format("hh:mm")), 1000)

    const localHistory = await idb.get("history")
    const lastVisitTime = localHistory ? localHistory.map("lastVisitTime").max().ceil() : Date.now() - 90 * 24 * 60 * 60 * 1000
    const recentHistory = await chrome.history.search.promisify({ text: "", maxResults: 0, startTime: lastVisitTime })
    const history = recentHistory.concat(localHistory || [])
    this.history = Object.freeze(history)
    await idb.set("history", history)
  },
})
app.config.globalProperties.window = window
app.mount("main")
