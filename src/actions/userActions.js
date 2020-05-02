import store from "../store"
import { dbPromise } from "../utility/indexDBWrappers"

export const SET_USER = "SET_USER"
export const LOAD_USER = "LOAD_USER"
export const LOGOUT = "LOGOUT"

export const setUser = (user, token) => dispatch => {
    const transaction = store.getState().indexdb.db.transaction(["user_data"], "readwrite")

    dbPromise(transaction)
        .then(event => {
            dispatch({
                type: SET_USER,
                user,
                token
            })
        })
        .catch(err => {
            console.error(err)
        })

    const userState = {
        _id: user._id,
        username: user.username,
        token: token
    }

    const keystoreObjectStore = transaction.objectStore("user_data")
    keystoreObjectStore.put(userState)
}

export const loadUser = (userFromStorage) => dispatch => {
    dispatch({
        type: LOAD_USER,
        user: userFromStorage
    })
}

export const logout = _ => dispatch => {
    dispatch({
        type: LOGOUT
    })
}