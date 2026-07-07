import "./cut.js"
import "../tailwind.css"
import { createApp } from "vue"
import App from "./App.vue"
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
          }),
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
window.app = createApp(App)
app.config.globalProperties.window = window
app.config.globalProperties.document = document
window.$root = app.mount("main")

addEventListener(
  "keydown",
  (e) => {
    if (document.activeElement.tagName === "INPUT") if (e.key === "ArrowDown") return document.querySelector("a").focus()
    if (e.key === "ArrowUp" && document.activeElement === document.querySelector("a")) return document.querySelector("input").focus()
    if (e.key === "ArrowDown") return document.activeElement.nextElementSibling.focus()
    if (e.key === "ArrowUp") return document.activeElement.previousElementSibling.focus()
    if (e.key === "ArrowRight") return document.activeElement.parentElement.parentElement.parentElement.nextElementSibling.querySelector(`a:nth-child(${Array.from(document.activeElement.parentElement.children).indexOf(document.activeElement) + 1})`).focus()
    if (e.key === "ArrowLeft") return document.activeElement.parentElement.parentElement.parentElement.previousElementSibling.querySelector(`a:nth-child(${Array.from(document.activeElement.parentElement.children).indexOf(document.activeElement) + 1})`).focus()
  },
  { capture: true, passive: true },
)
addEventListener(
  "click",
  (e) => {
    if (document.activeElement === document.body) document.querySelector("input").focus()
    const link = e.composedPath().find((v) => v.href)
    if (link) localStorage.track = JSON.stringify(JSON.parse(localStorage.track || "[]").concat({ url: link.href, time: Date.now() }))
  },
  { capture: true, passive: true },
)
addEventListener(
  "mousedown",
  (e) => {
    if (e.target.tagName === "INPUT") e.preventDefault()
  },
  { capture: true, passive: false },
)
addEventListener("dragover", (e) => e.preventDefault())
addEventListener("drop", (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  const reader = new FileReader()
  reader.onload = () => {
    const backup = JSON.parse(reader.result)
    $root.history = backup.history
    $root.tabs = backup.tabs
    $root.bookmarks = backup.bookmarks
    idb.set("history", backup.history)
  }
  reader.readAsText(file)
})
