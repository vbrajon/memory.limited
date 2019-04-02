import * as idb from './-idb-keyval.mjs'
import Vue from './-vue.esm.browser.js'
Vue.config.devtools = Vue.config.productionTip = false
Vue.prototype.window = window
// Object.getOwnPropertyNames(window).map(key => Vue.prototype[key] = window[key])
Vue.directive('focus', el => el.focus())
new Vue({
  el: 'main',
  data() {
    return {
      history: [],
      bookmarks: {},
      search: '',
      index: 0,
    }
  },
  computed: {
    results() {
      // const searchFN = d => !this.search || this.search.split(' ').every(s => Object.values(d).some(v => RegExp(s, 'i').test(v)))
      const searchFN = d => !this.search || RegExp(this.search, 'i').test(d.title)
      return this.history.filter(searchFN)
    },
    focus() {
      return this.results[this.index] || {}
    },
  },
  async created() {
    this.history = (await idb.get('hi')) || []
    this.bookmarks = await idb.get('bm')

    localStorage.from = localStorage.from || Date.now() - 90 * 24 * 3600 * 1000
    chrome.bookmarks.getTree(bm => idb.set('bm', bm))
    chrome.history.search(
      {
        text: '',
        maxResults: 0,
        startTime: +localStorage.from,
        endTime: Date.now(),
      },
      hi => {
        this.history = this.history.concat(hi)
        localStorage.from = Date.now()
        idb.set('hi', this.history)
      },
    )
  },
})
