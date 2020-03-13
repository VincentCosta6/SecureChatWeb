import { createStore, combineReducers, applyMiddleware, compose } from "redux"
import thunk from "redux-thunk"

import channelReducer from "./reducers/channelReducer"
import userReducer from "./reducers/userReducer"

const rootReducer = combineReducers({
    channel: channelReducer,
    user: userReducer,
})

const initialState = {}

const middleware = [thunk]

const Store = createStore(
    rootReducer,
    initialState,
    compose(
        applyMiddleware(...middleware),
        window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : f => f
    )
)

export default Store