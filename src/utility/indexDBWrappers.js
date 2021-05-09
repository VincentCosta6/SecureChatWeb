export const dbPromise = (indexedDBObj) => {
  return new Promise(function (resolve, reject) {
    indexedDBObj.onerror = reject
    indexedDBObj.oncomplete = resolve
  })
}

export const dbQueryPromise = (indexedDBObj) => {
  return new Promise(function (resolve, reject) {
    indexedDBObj.onerror = reject
    indexedDBObj.onsuccess = resolve
  })
}
