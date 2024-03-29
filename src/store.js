import {
  createStore,
  combineReducers,
  applyMiddleware,
  compose
} from 'redux'
import thunk from 'redux-thunk'

import userReducer from './reducers/userReducer'
import channelReducer from './reducers/channelReducer'
import connectionReducer from './reducers/connectionReducer'
import socketReducer from './reducers/socketReducer'
import themeReducer from './reducers/themeReducer'
import callReducer from './reducers/callReducer'
import indexDBReducer from './reducers/indexDBReducer'

const rootReducer = combineReducers({
  user: userReducer,
  channels: channelReducer,
  connection: connectionReducer,
  theme: themeReducer,
  websocket: socketReducer,
  call: callReducer,
  indexdb: indexDBReducer
})

const initialState = {}

const middleware = [thunk]

// const hasWindow = typeof window === "object";
// const composeEnhancers = (hasWindow && window.__REDUX_DEVTOOLS_EXTENSION__ ) || compose;

const Store = createStore(
  rootReducer,
  initialState,
  compose(
    applyMiddleware(...middleware),
    window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : f => f
  )
)

export default Store
