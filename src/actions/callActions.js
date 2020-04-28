import Peer from "simple-peer"

import store from "../store"
import { sendData } from "./socketActions"

export const START_CALL = "START_CALL"

export const CALL_INCOMING = "CALL_INCOMING"

export const ACCEPT_CALL = "ACCEPT_CALL"
export const DECLINE_CALL = "DECLINE_CALL"

export const CALL_ACCEPTED = "CALL_ACCEPTED"
export const CALL_DECLINED = "CALL_DECLINED"

export const END_CALL = "END_CALL"
export const LEAVE_CALL = "LEAVE_CALL"

export const startCall = (constraints, activeChannel, user_id, username, type) => dispatch => {
    navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                const peer = new Peer({ initiator: true, stream, trickle: false })

                const audioElement = document.querySelector("video#localVideo")
                audioElement.srcObject = stream

                peer.on("signal", signalData => {
                    console.log(signalData)

                    const currentChannel = store.getState().channels.channels[activeChannel]
                    const users = Object.keys(currentChannel.privateKeys).map(key => key)

                    store.dispatch(sendData(JSON.stringify({
                        type: "OFFER",
                        content: {
                            whoID: user_id,
                            whoUsername: username,
                            
                            call_type: type,
                            channel_id: currentChannel._id,
                            channel_name: currentChannel.Name,
    
                            users,
                            signalData
                        }
                    })))
                })

                peer.on("connect", () => {
                    console.log("Connected to peer")
                })

                peer.on("stream", stream2 => {
                    const externalVid = document.querySelector("video#externalVideo")
                    externalVid.srcObject = stream2

                    externalVid.play()
                })

                dispatch({
                    type: START_CALL,
                    peer
                })
            })
            .catch(err => {
                console.error(err)
            })
    
}

export const callIncoming = data => dispatch => {
    dispatch({
        type: CALL_INCOMING,
        data
    })
}

export const acceptCall = (data, offer) => dispatch => {
    const constraints = data.MessageContent.Call_Type === "Video" ? 
    { video: true, audio: true } :
    { audio: true }

    navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                const audioElement = document.querySelector("video#localVideo")
                audioElement.srcObject = stream

                dispatch({
                    type: ACCEPT_CALL,
                    data,
                    offer,
                    stream3: stream
                })
            })
            .catch(err => {
                console.error(err)
            })
    
}
export const declineCall = declineCall => dispatch => {
    dispatch({
        type: DECLINE_CALL,
        declineCall
    })
}

export const callAccepted = answer => dispatch => {
    dispatch({
        type: CALL_ACCEPTED,
        answer
    })
}
export const callDeclined = _ => dispatch => {
    dispatch({
        type: CALL_DECLINED
    })
}

export const endCall = _ => dispatch => {
    dispatch({
        type: END_CALL,
    })
}
export const leaveCall = _ => dispatch => {
    dispatch({
        type: LEAVE_CALL,
    })
}