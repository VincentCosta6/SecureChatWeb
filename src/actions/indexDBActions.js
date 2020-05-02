export const OPEN_INDEXDB = "OPEN_INDEXDB"

export const INDEXDB_ATTEMPT = "INDEXDB_ATTEMPT"
export const INDEXDB_FAILED = "INDEXDB_FAILED"

export const INDEXDB_ERROR = "INDEXDB_ERROR"

export const UPGRADE_DB = "UPGRADE_DB"

export const openIndexDB = data => dispatch => {
    dispatch({
        type: INDEXDB_ATTEMPT
    })

    let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    let IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}
    let IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange

    if(!indexedDB) {
        dispatch({
            type: INDEXDB_FAILED
        })

        return
    }

    let request = window.indexedDB.open("securechat", 3)

    let firstReq = true

    request.onerror = event => {
        dispatch({
            type: firstReq ? INDEXDB_FAILED : INDEXDB_ERROR
        })
    }

    request.onsuccess = event => {
        firstReq = false

        dispatch({
            type: OPEN_INDEXDB,
            db: event.target.result
        })
    }

    request.onupgradeneeded = event => {
        const db = event.target.result

        const channels = db.createObjectStore("channels", { keyPath: "channel_id" })
        channels.createIndex("channel_name", "channel_name", { unique: false })

        const keystore = db.createObjectStore("keystore", { keyPath: "username" })

        const channel_keystore = db.createObjectStore("channel_keystore", { keyPath: "channel_id" })

        dispatch({
            type: UPGRADE_DB
        })
    }
}