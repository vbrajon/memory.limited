import * as idb from './idb-keyval.mjs'

localStorage.from = localStorage.from || Date.now() - 90 * 24 * 3600 * 1000
chrome.bookmarks.getTree(bm => idb.set('bm', bm))
chrome.history.search({
  text: '',
  maxResults: 0,
  startTime: +localStorage.from,
  endTime: Date.now(),
}, async hi => {
  const history = (await idb.get('hi') || []).concat(hi)
  const bookmarks = await idb.get('bm')
  localStorage.from = Date.now()
  document.querySelector('main').innerText = history.length
})
