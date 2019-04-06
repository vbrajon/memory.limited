import * as idb from './-idb-keyval.mjs'
import Vue from './-vue.esm.browser.js'
Vue.config.devtools = Vue.config.productionTip = false
Vue.prototype.window = window
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
      if (!this.search) return this.history
      const search = RegExp(this.search.replace(/[^A-z0-9]/g, '.'))
      return this.history.filter(d => ['title', 'url'].some(k => search.test(d[k])))
    },
    focus() {
      return this.results[this.index] || {}
    },
  },
  async created() {
    let history = (await idb.get('history')) || []
    let bookmarks = (await idb.get('bookmarks')) || {}

    localStorage.from = localStorage.from || Date.now() - 90 * 24 * 3600 * 1000
    chrome.bookmarks.getTree(bm => idb.set('bookmarks', bm))
    chrome.history.search(
      {
        text: '',
        maxResults: 0,
        startTime: +localStorage.from,
        endTime: Date.now(),
      },
      hi => {
        history = hi.concat(history)
        localStorage.from = Date.now()
        idb.set('history', history)
        this.history = history
      },
    )

    addEventListener('keydown', e => {
      if (e.key === 'Enter') return (location.href = this.focus.url)
      document.querySelector('input').focus()
      if (e.key === 'ArrowUp' && this.index > 0) this.index--
      if (e.key === 'ArrowDown' && this.index < Math.min(50, this.results.length) - 1) this.index++
      setTimeout(() => document.querySelector('.active') && document.querySelector('.active').scrollIntoView(), 0)
    })
  },
})
