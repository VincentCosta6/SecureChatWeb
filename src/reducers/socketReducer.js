import { OPEN_WEBSOCKET, SEND_DATA, CLOSE_WEBSOCKET, ADD_MESSAGE_TO_QUEUE, OPENING_WEBSOCKET, WEBSOCKET_FAILED, WEBSOCKET_SUCCESS } from '../actions/socketActions'

const initialState = {
  websocket: null,
  opening: false,
  failed: false,
  queue: []
}

export default function socketReducer(state = initialState, action) {
  switch (action.type) {
    case OPENING_WEBSOCKET:
      return { ...state, opening: true, failed: false }
    case WEBSOCKET_FAILED:
      return { ...state, opening: false, failed: true }
    case WEBSOCKET_SUCCESS:
      return { ...state, opening: false, failed: false }
    case OPEN_WEBSOCKET:
      return { ...state, websocket: action.websocket }
    case SEND_DATA:
      if (state.websocket && state.websocket.send) {
        state.websocket.send(action.data, (err) => {
          console.error(err)
        })
      }

      return state
    case CLOSE_WEBSOCKET:
      if (state.websocket && state.websocket.close) {
        state.websocket.close()
      }

      return { ...state, websocket: null }
    case ADD_MESSAGE_TO_QUEUE:
      return { ...state, queue: [...state.queue, action.message] }
    default:
      return state
  }
}
