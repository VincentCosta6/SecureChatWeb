
import { WEBSOCKET_STATUS } from "./connectionActions"

import { 
    WebsocketOpen, 
    WebsocketMessage, 
    WebsocketError, 
    WebsocketClose 
} from "../websocket/ws-redux-connect"

export const OPENING_WEBSOCKET = "OPENING_WEBSOCKET"
export const WEBSOCKET_FAILED = "WEBSOCKET_FAILED"
export const WEBSOCKET_SUCCESS = "WEBSOCKET_SUCCESS"

export const OPEN_WEBSOCKET = "OPEN_WEBSOCKET"
export const SEND_DATA = "SEND_DATA"
export const CLOSE_WEBSOCKET = "CLOSE_WEBSOCKET"

export const ADD_MESSAGE_TO_QUEUE = "ADD_MESSAGE_TO_QUEUE"

export const openWebsocket = token => dispatch => {
    const client = new WebSocket(`wss://servicetechlink.com/ws`, ["asd", token])

    dispatch({
        type: OPENING_WEBSOCKET
    })

    client.onopen = _ => {
        WebsocketOpen()

        dispatch({
            type: WEBSOCKET_STATUS,
            status: true
        })
        dispatch({
            type: WEBSOCKET_SUCCESS,
        })
    }

    client.onmessage = message => {
        const parsed = JSON.parse(message.data)
        WebsocketMessage(parsed)
    }

    client.onerror = err => {
        WebsocketError(err)

        dispatch({
            type: WEBSOCKET_FAILED
        })
    }

    client.onclose = ev => {
        WebsocketClose()
        
        dispatch({
            type: CLOSE_WEBSOCKET
        })
        dispatch({
            type: WEBSOCKET_STATUS,
            status: false
        })
    }

    dispatch({
        type: OPEN_WEBSOCKET,
        websocket: client
    })
}

export const addMessageToQueue = (message) => dispatch => {
    dispatch({
        type: ADD_MESSAGE_TO_QUEUE,
        message
    })
}

export const sendData = data => dispatch => {
    console.log("Sending data", data)
    
    dispatch({
        type: SEND_DATA,
        data
    })
}

export const closeWebsocket = _ => dispatch => {
    dispatch({
        type: CLOSE_WEBSOCKET
    })
}
