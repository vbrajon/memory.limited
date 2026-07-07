const $ = (s, el = document) => el.querySelector(s)
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
  set(key, value) {
    return this.transaction("readwrite", (store) => store.put(value, key))
  },
}

const state = { search: "", history: [], bookmarks: [], tabs: [], size: Math.min(10, Math.floor((innerHeight - 200) / 80)) }
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
const UNITS = [
  [31536e6, "Y"],
  [2592e6, "M"],
  [864e5, "D"],
  [36e5, "h"],
  [6e4, "m"],
  [1e3, "s"],
]
const ago = (t) => {
  const d = Date.now() - t
  const [ms, unit] = UNITS.find(([ms]) => ms <= Math.abs(d)) || [1e3, "s"]
  return Math.round(d / ms) + unit
}

const cols = [
  { el: "#history", list: () => state.history, keys: ["title", "url"], when: (v) => ago(v.lastVisitTime) },
  { el: "#bookmarks", list: () => state.bookmarks, keys: ["title", "url", "year"], when: (v) => v.year },
  { el: "#tabs", list: () => state.tabs, keys: ["title", "url"], when: (v) => ago(v.lastVisitTime) },
]
function render(c) {
  const root = $(c.el)
  let list = c.list()
  if (state.search) {
    try {
      const r = RegExp(state.search, "i")
      list = list.filter((v) => c.keys.some((k) => r.test(v[k])))
    } catch {}
  }
  $(".count", root).textContent = list.length
  const scroll = $(".scroll", root)
  scroll.style.height = 80 * state.size + "px"
  const off = Math.floor(scroll.scrollTop / 76.8)
  $(".items", root).innerHTML = list
    .slice(off, off + state.size)
    .map((v) => `<a href="${esc(v.url)}" rel="nofollow noreferrer"><img src="/_favicon/?size=16&pageUrl=${encodeURIComponent(v.url || "https://x.com")}" alt="" /><div class="title">${esc(v.title)}</div><div class="when">${c.when(v)}</div></a>`)
    .join("")
  $(".spacer", root).style.height = list.length > state.size ? (list.length - state.size) * 76.8 + "px" : "0px"
}
const renderAll = () => cols.map(render)

const clock = () => ($("time").textContent = new Date().toTimeString().slice(0, 5))
clock()
setInterval(clock, 1000)
$("input").oninput = (e) => ((state.search = e.target.value), renderAll())
cols.map((c) => ($(".scroll", $(c.el)).onscroll = () => render(c)))
document.querySelectorAll("[data-url]").forEach((b) => (b.onclick = () => chrome.tabs.update({ url: b.dataset.url })))
$("#backup").onclick = () => {
  const backup = { history: state.history, tabs: state.tabs, bookmarks: state.bookmarks }
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: "application/json" }))
  a.download = `memory-limited-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
}

const flat = (v) => (v.length ? v.flatMap(flat) : v.children ? flat(v.children) : { ...v, year: String(new Date(v.dateAdded).getFullYear()) })
;(async () => {
  state.bookmarks = flat(await chrome.bookmarks.getTree()).sort((a, b) => b.dateAdded - a.dateAdded)
  state.tabs = (await chrome.sessions.getDevices()).flatMap((v) => v.sessions).flatMap((v) => v.window.tabs)
  state.history = await chrome.history.search({ text: "", maxResults: 10, startTime: Date.now() - 90 * 864e5 })
  renderAll()

  const localHistory = await idb.get("history")
  const lastVisitTime = localHistory ? localHistory[0].lastVisitTime + 1 : Date.now() - 90 * 864e5
  const recentHistory = await chrome.history.search({ text: "", maxResults: 0, startTime: lastVisitTime })
  state.history = recentHistory.concat(localHistory || [])
  renderAll()
  await idb.set("history", state.history)
})()

addEventListener(
  "keydown",
  (e) => {
    if (document.activeElement.tagName === "INPUT") if (e.key === "ArrowDown") return $("a").focus()
    if (e.key === "ArrowUp" && document.activeElement === $("a")) return $("input").focus()
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
    if (document.activeElement === document.body) $("input").focus()
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
  const reader = new FileReader()
  reader.onload = () => {
    const backup = JSON.parse(reader.result)
    state.history = backup.history
    state.tabs = backup.tabs
    state.bookmarks = backup.bookmarks
    renderAll()
    idb.set("history", backup.history)
  }
  reader.readAsText(e.dataTransfer.files[0])
})
