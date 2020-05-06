import store from "../store"
import { loadUser } from "./userActions"
import { changeTheme } from "./themeActions"
import { dbQueryPromise } from "../utility/indexDBWrappers"
import { GiTorpedo } from "react-icons/gi"

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

    let request = window.indexedDB.open("securechat", 4)

    let firstReq = true

    request.onerror = event => {
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

        const stored = localStorage.getItem("user")

        if(stored && stored.length > 4) {
            const userDataStore = store.getState().indexdb.db.transaction(["user_data"]).objectStore("user_data")
            let request = userDataStore.get(stored)
    
            let result = await dbQueryPromise(request)
    
            store.dispatch(loadUser(result.target.result))

            const themeDataStore = store.getState().indexdb.db.transaction(["themes"]).objectStore("themes")
            request = themeDataStore.get(stored)
    
            result = await dbQueryPromise(request)

            if(result.target.result)
                store.dispatch(changeTheme(result.target.result.theme))
        }
    }

    request.onupgradeneeded = event => {
        const db = event.target.result

        const channels = db.createObjectStore("channels", { keyPath: "channel_id" })
        channels.createIndex("channel_name", "channel_name", { unique: false })

        const keystore = db.createObjectStore("keystore", { keyPath: "username" })

        const channel_keystore = db.createObjectStore("channel_keystore", { keyPath: "channel_id" })

        const user_data = db.createObjectStore("user_data", { keyPath: "_id" })

        const themes = db.createObjectStore("themes", { keyPath: "username" })

        dispatch({
            type: UPGRADE_DB
        })
    }
}