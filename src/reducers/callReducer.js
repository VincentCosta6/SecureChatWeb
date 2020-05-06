import { START_CALL, CALL_INCOMING, DECLINE_CALL, ACCEPT_CALL, CALL_ACCEPTED, CALL_DECLINED, END_CALL, endCall } from "../actions/callActions"

import store from "../store"

import { sendData } from "../actions/socketActions"

import Peer from "simple-peer"

const initialState = {
    incomingCalls: [],
    incomingCall: null,
    currentCall: null,
    stream: null,
    peer: new Peer({ initiator: false, trickle: false }),
}

export default function(state = initialState, action) {
    switch(action.type) {
        case START_CALL: {
            
            return { ...state, peer: action.peer, stream: action.stream, currentCall: action.data }
        }
        case CALL_INCOMING: {
            const data = action.data

            if(state.currentCall && state.currentCall.Channel_ID === data.MessageContent.Channel_ID) {
                return { ...state }
            }

            return { ...state, incomingCall: data.MessageContent }
        }
        case DECLINE_CALL: {
            return { ...state, incomingCall: null }
        }
        case ACCEPT_CALL: {
            state.peer.on("signal", signalData => {
                const currentChannel = store.getState().channels.channels.find(channel => channel._id === action.data.Channel_ID)

                let users = Object.keys(currentChannel.privateKeys).map(key => key)

                users = users.filter(user => store.getState().user._id !== user)

                const audioElement = document.querySelector("video#localVideo")
                audioElement.srcObject = action.stream3

                // TODO: Fix janky double signal

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

            state.peer.on("close", _ => {
                store.dispatch(endCall())
            })

            state.peer.on("end", _ => {
                store.dispatch(endCall())
            })

            state.peer.on("error", err => {
                console.error(err)
                store.dispatch(endCall())
            })

            state.peer.signal(action.offer)

            state.peer.addStream(action.stream3)

            return { ...state, currentCall: state.incomingCall, incomingCall: null, stream: action.stream3 }
        }
        case CALL_ACCEPTED: {
            state.peer.signal(action.answer.MessageContent.SignalData)

            state.peer.on("stream", stream2 => {
                const externalVid = document.querySelector("video#externalVideo")
                externalVid.srcObject = stream2

                externalVid.play()
            })

            return { ...state, currentCall: state.incomingCall || state.currentCall, incomingCall: null }
        }
        case END_CALL: {
            state.peer.end()
            state.stream.getTracks().forEach(track => track.stop())
            return { ...state, currentCall: null, peer: new Peer({ initiator: false, trickle: false }) }
        }
        default: 
            return state;
    }
}