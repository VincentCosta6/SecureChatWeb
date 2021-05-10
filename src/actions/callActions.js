import Peer from 'simple-peer'

import { authReq } from '../axios-auth'

import store from '../store'
import { sendData } from './socketActions'

export const START_CALL = 'START_CALL'

export const CALL_INCOMING = 'CALL_INCOMING'

export const ACCEPT_CALL = 'ACCEPT_CALL'
export const DECLINE_CALL = 'DECLINE_CALL'

export const CALL_ACCEPTED = 'CALL_ACCEPTED'
export const CALL_DECLINED = 'CALL_DECLINED'

export const END_CALL = 'END_CALL'
export const LEAVE_CALL = 'LEAVE_CALL'

export const startCall = (constraints, activeChannel, user_id, username) => dispatch => {
  const type = constraints.video ? 'Video' : 'Voice'
  navigator.mediaDevices.getUserMedia(constraints)
    .then(async stream => {
      const peer = new Peer({ initiator: true, stream, trickle: false })
      const currentChannel = store.getState().channels.channels[activeChannel]
      let users = Object.keys(currentChannel.privateKeys).map(key => key)

      users = users.filter(user => store.getState().user._id !== user)

      const res = await authReq(localStorage.getItem('token'))
        .post('https://securechat-go.herokuapp.com/call', JSON.stringify({ ChannelID: currentChannel._id, Type: type }))

      dispatch({
        type: START_CALL,
        peer,
        stream,
        data: {
          whoID: user_id,
          whoUsername: username,

          call_type: type,
          channel_id: currentChannel._id,
          channel_name: currentChannel.Name,

          users
        }
      })

      const audioElement = document.querySelector('video#localVideo')
      audioElement.srcObject = stream

      peer.on('signal', signalData => {
        console.log(signalData)

        store.dispatch(sendData(JSON.stringify({
          type: 'OFFER',
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

      peer.on('connect', () => {
        console.log('Connected to peer')
      })

      peer.on('stream', stream2 => {
        const externalVid = document.querySelector('video#externalVideo')
        externalVid.srcObject = stream2

        console.log('stream')
      })

      peer.on('close', _ => {
        dispatch({
          type: END_CALL
        })
      })

      peer.on('end', _ => {
        dispatch({
          type: END_CALL
        })
      })

      peer.on('error', _ => {
        dispatch({
          type: END_CALL
        })
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
  const constraints = data.Call_Type === 'Video'
    ? { video: true, audio: true }
    : { audio: true }

  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
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
    type: END_CALL
  })
}
export const leaveCall = _ => dispatch => {
  dispatch({
    type: LEAVE_CALL
  })
}
