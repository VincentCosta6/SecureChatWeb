import { START_CALL, CALL_INCOMING, DECLINE_CALL, ACCEPT_CALL, CALL_ACCEPTED, CALL_DECLINED } from "../actions/callActions"

import store from "../store"

import { sendData } from "../actions/socketActions"

import Peer from "simple-peer"

const initialState = {
    incomingCalls: [],
    incomingCall: null,
    currentCall: null,
    peer: new Peer({ initiator: false, trickle: false })
}

export default function(state = initialState, action) {
    switch(action.type) {
        case START_CALL: {
            
            return { ...state, peer: action.peer }
        }
        case CALL_INCOMING: {
            const data = action.data

            return { ...state, incomingCall: data }
        }
        case DECLINE_CALL: {
            return { ...state, incomingCall: null }
        }
        case ACCEPT_CALL: {
            state.peer.on("signal", signalData => {
                const currentChannel = store.getState().channels.channels.find(channel => channel._id === action.data.MessageContent.Channel_ID)

                const users = Object.keys(currentChannel.privateKeys).map(key => key)

                store.dispatch(sendData(JSON.stringify({
                    type: "ANSWER",
                    content: {
                        whoID: store.getState().user._id,
                        whoUsername: store.getState().user.username,
                        
                        channel_id: action.data.Channel_ID,
                        channel_name: action.data.Channel_Name,

                        users,
                        signalData
                    }
                })))
            })

            state.peer.on("stream", stream2 => {
                const externalVid = document.querySelector("video#externalVideo")
                externalVid.srcObject = stream2

                externalVid.play()
            })

            state.peer.signal(action.offer)

            state.peer.addStream(action.stream3)

            return { ...state, incomingCall: null, currentCall: 1 }
        }
        case CALL_ACCEPTED: {
            state.peer.signal(action.answer.MessageContent.SignalData)

            state.peer.on("stream", stream2 => {
                const externalVid = document.querySelector("video#externalVideo")
                externalVid.srcObject = stream2

                externalVid.play()
            })

            return { ...state, incomingCall: null, currentCall: true }
        }
        default: 
            return state;
    }
}