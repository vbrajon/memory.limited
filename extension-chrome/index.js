import './raw.js'
import Vue from './vue.esm.browser.js'
Object.getOwnPropertyNames(Math)
  .filter(k => typeof Math[k] === 'function')
  .forEach(k => (Number[k] = Math[k]))
Object.extend(true)
Vue.config.devtools = Vue.config.productionTip = false
Vue.prototype.window = window
window.idb = {
  db: new Promise((resolve, reject) => {
    const openreq = indexedDB.open('kvs', 1)
    openreq.onerror = () => reject(openreq.error)
    openreq.onsuccess = () => resolve(openreq.result)
    openreq.onupgradeneeded = () => openreq.result.createObjectStore('kv')
  }),
  transaction(type, fn) {
    return this.db.then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction('kv', type)
      transaction.oncomplete = () => resolve(request)
      transaction.onabort = transaction.onerror = () => reject(transaction.error)
      const request = fn(transaction.objectStore('kv'))
    })).then(req => req.result)
  },
  get(key) { return this.transaction('readonly', store => store.get(key)) },
  set(key, value) { return this.transaction('readwrite', store => store.put(value, key)) },
  del(key) { return this.transaction('readwrite', store => store.delete(key)) },
  clear() { return this.transaction('readwrite', store => store.clear()) },
  keys() { return this.transaction('readwrite', store => store.getAllKeys()) },
}
window.$root = new Vue({
  el: 'main',
  data() {
    return {
      search: '',
      history: null,
      bookmarks: null,
    }
  },
  computed: {
    h() {
      if (!this.history) return Array(10).fill().map(v => ({ title: '', lastVisitTime: Date.now(), url: 'file://' }))
      if (!this.search) return this.history
      const r = RegExp(this.search, 'i')
      return this.history.filter(v => ['title', 'url'].some(k => r.test(v[k])))
    },
    b() {
      if (!this.bookmarks) return Array(10).fill().map(v => ({ title: '', lastVisitTime: Date.now(), url: 'file://' }))
      if (!this.search) return this.bookmarks
      const r = RegExp(this.search, 'i')
      return this.bookmarks.filter(v => ['title', 'url'].some(k => r.test(v[k])))
    },
  },
  async created() {
    const pfy = fn => (...args) => new Promise(r => fn(...args, r))
    const flat = v => {
      if (v.length) return v.map(flat).flat()
      if (v.children) return flat(v.children)
      return v
    }
    this.bookmarks = Object.freeze(flat(await pfy(chrome.bookmarks.getTree)()))
    const localHistory = await idb.get('history')
    const lastVisitTime = localHistory ? localHistory.map('lastVisitTime').max().ceil() : Date.now() - 90 * 24 * 60 * 60 * 1000
    const recentHistory = await pfy(chrome.history.search)({ text: '', maxResults: 0, startTime: lastVisitTime })
    const history = recentHistory.concat(localHistory || [])
    this.history = Object.freeze(history)
    await idb.set('history', history)
  },
})
