import store from '../store'
import { loadUser } from './userActions'
import { changeTheme } from './themeActions'
import { dbQueryPromise } from '../utility/indexDBWrappers'

export const OPEN_INDEXDB = 'OPEN_INDEXDB'

export const INDEXDB_ATTEMPT = 'INDEXDB_ATTEMPT'
export const INDEXDB_FAILED = 'INDEXDB_FAILED'

export const INDEXDB_ERROR = 'INDEXDB_ERROR'

export const UPGRADE_DB = 'UPGRADE_DB'

export const openIndexDB = () => dispatch => {
  dispatch({
    type: INDEXDB_ATTEMPT
  })

  const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB

  if (!indexedDB) {
    dispatch({
      type: INDEXDB_FAILED
    })

    return
  }

  const request = window.indexedDB.open('securechat', 5)

  let firstReq = true

  request.onerror = () => {
    dispatch({
      type: firstReq ? INDEXDB_FAILED : INDEXDB_ERROR
    })
  }

  request.onsuccess = async event => {
    firstReq = false

    dispatch({
      type: OPEN_INDEXDB,
      db: event.target.result
    })

    const stored = localStorage.getItem('user')

    if (stored && stored.length > 4) {
      const transaction = store.getState().indexdb.db.transaction(['user_data', 'themes'])

      const userDataStore = transaction.objectStore('user_data')
      let request = userDataStore.get(stored)

      let result = await dbQueryPromise(request)

      store.dispatch(loadUser(result.target.result))

      const themeDataStore = transaction.objectStore('themes')
      request = themeDataStore.get(stored)

      result = await dbQueryPromise(request)

      if (result.target.result) { store.dispatch(changeTheme(result.target.result.theme)) }
    }
  }

  request.onupgradeneeded = event => {
    const db = event.target.result

    const set = DOMStringListToSet(db.objectStoreNames)

    console.log(set)

    if (!set.has('channels')) {
      const channels = db.createObjectStore('channels', { keyPath: 'channel_id' })
      channels.createIndex('channel_name', 'channel_name', { unique: false })
    }

    if (!set.has('keystore')) {
      db.createObjectStore('keystore', { keyPath: 'username' })
    }

    if (!set.has('channel_keystore')) {
      db.createObjectStore('channel_keystore', { keyPath: 'channel_id' })
    }

    if (!set.has('user_data')) {
      db.createObjectStore('user_data', { keyPath: '_id' })
    }

    if (!set.has('themes')) {
      db.createObjectStore('themes', { keyPath: 'username' })
    }

    dispatch({
      type: UPGRADE_DB
    })
  }
}

function DOMStringListToSet (DomStringList) {
  const set = new Set()

  for (const key of DomStringList) {
    set.add(key)
  }

  return set
}
