import './raw.js'
import Vue from './vue.esm.browser.js'
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
      history: [],
      bookmarks: [],
    }
  },
  computed: {
    h() {
      const r = RegExp(this.search, 'i')
      return this.history.filter(v => ['title', 'url'].some(k => r.test(v[k])))
    },
    b() {
      const r = RegExp(this.search, 'i')
      return this.bookmarks.filter(v => ['title', 'url'].some(k => r.test(v[k])))
    },
  },
  created() {
    const pfy = (fn, ...args) => new Promise(r => fn(...args, r))
    const flat = v => {
      if (v.length) return v.map(flat).flat()
      if (v.children) return flat(v.children)
      return v
    }
    pfy(chrome.bookmarks.getTree).then(r => this.bookmarks = flat(r))
    pfy(chrome.history.search, { text: '', maxResults: 0, startTime: Date.now() - 10 * 24 * 3600 * 1000, endTime: Date.now() }).then(r => this.history = r)
  },
})
