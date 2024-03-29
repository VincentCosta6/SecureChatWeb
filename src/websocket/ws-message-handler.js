import store from '../store'

import { addMessage, addChannel, addTyper, removeTyper, addUser, loadChannels } from '../actions/channelActions'
import { addMessageToQueue } from '../actions/socketActions'
import { callIncoming, callAccepted } from '../actions/callActions'

const timeouts = {}

export const handleMessage = async message => {
  console.log(message)

  const isAway = !document.hasFocus()

  if (!message.MessageType || !message.MessageContent) {
    console.error('Invalid message received: message type or message content is not defined')
    return
  }

  if (typeof message.MessageType !== 'string' || typeof message.MessageContent !== 'object') {
    console.error('Invalid message received: message type is not a string or message content is not an object')
    return
  }

  switch (message.MessageType) {
    case 'NEW_MESSAGE':
      if (!store.getState().channels.CHANNELS_LOADED) {
        store.dispatch(addMessageToQueue(message.MessageContent))
        return
      }

      store.dispatch(addMessage(message.MessageContent))

      if (isAway) {
        /* const reg = await navigator.serviceWorker.ready
                reg.showNotification("New message", {
                    vibrate: [100, 50, 100]
                }) */

        new Notification('SecureChat', {
          body: 'New message in SecureChat'
        })
      }

      break
    case 'NEW_CHANNEL':
      store.dispatch(addChannel(store.getState().user, message.MessageContent))

      if (isAway) {
        new Notification('SecureChat', {
          body: 'Someone started a new channel with you',
          icon: ''
        })
      }

      break
    case 'ADD_USER': {
      const channel = message.MessageContent.ChannelID
      const newPeople = message.MessageContent.NewUsers

      const myChannels = Object.keys(store.getState().channels.channels)

      let found = null

      for (const channelObj in myChannels) {
        const channelData = store.getState().channels.channels[channelObj]

        if (channelData._id === channel) {
          found = channelData
        }
      }

      if (!found) {
        // You were added to this channel
        store.dispatch(loadChannels(store.getState().user))

        if (isAway) {
          new Notification('SecureChat', {
            body: 'You were added to a channel',
            icon: ''
          })
        }
      } else {
        // Someone else was added to this channel
        store.dispatch(addUser(channel, newPeople))
      }

      break
    }
    case 'IS_TYPING': {
      const channel = message.MessageContent.ChannelID
      const person = message.MessageContent.WhoTypingID

      if (timeouts[channel] && timeouts[channel][person]) {
        clearTimeout(timeouts[channel][person])
      }

      store.dispatch(addTyper(message.MessageContent))

      timeouts[channel] = {
        ...timeouts[channel],
        [person]: setTimeout(_ => store.dispatch(removeTyper(message.MessageContent)), 3500)
      }

      break
    }
    case 'OFFER': {
      store.dispatch(callIncoming(message))
      break
    }
    case 'ANSWER': {
      store.dispatch(callAccepted(message))
      break
    }
    default:
      console.error('NO_CASE')
  }
}
