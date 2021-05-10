import store from '../store'

import { dbPromise, dbQueryPromise } from '../utility/indexDBWrappers'

import { authReq } from '../axios-auth'
import { AES } from 'crypto-js'

export const LOAD_CHANNELS = 'LOAD_CHANNELS'
export const DECRYPTING = 'DECRYPTING'

export const ADD_CHANNEL = 'ADD_CHANNEL'
export const DELETE_CHANNEL = 'DELETE_CHANNEL'
export const SET_ACTIVE = 'SET_ACTIVE'
export const ADD_MESSAGE = 'ADD_MESSAGE'
export const SET_LOAD_CHANNELS = 'SET_LOAD_CHANNELS'
export const ADD_TYPER = 'ADD_TYPER'
export const REMOVE_TYPER = 'REMOVE_TYPER'
export const ADD_USER = 'ADD_USER'

export const CLEAR_DATA = 'CLEAR_DATA'

export const loadChannels = user => dispatch => {
  dispatch({
    type: SET_LOAD_CHANNELS,
    isLoading: true
  })

  authReq(localStorage.getItem('token')).get('https://securechat-go.herokuapp.com/channels/mine')
    .then(async data => {
      dispatch({
        type: DECRYPTING
      })

      const keyStore = store.getState().indexdb.db.transaction(['keystore']).objectStore('keystore')
      const request = keyStore.get(store.getState().user.username)

      const event = await dbQueryPromise(request)
      const privateKey = event.target.result.keys.privateKey

      const channels = await Promise.all(data.data.results.map(async (channel, index) => await decryptChannel(user, channel, index, privateKey)))

      dispatch({
        type: LOAD_CHANNELS,
        channels
      })
    })
}

export const addChannel = (user, channel) => async dispatch => {
  const keyStore = store.getState().indexdb.db.transaction(['keystore']).objectStore('keystore')
  const request = keyStore.get(store.getState().user.username)

  const event = await dbQueryPromise(request)
  const privateKey = event.target.result.keys.privateKey

  const newChannel = await decryptChannel(user, channel, -2, privateKey)

  dispatch({
    type: ADD_CHANNEL,
    channel: newChannel
  })
}

export const deleteChannel = channelID => dispatch => {
  dispatch({
    type: DELETE_CHANNEL,
    id: channelID
  })
}

export const setActive = (channelIndex) => dispatch => {
  dispatch({
    type: SET_ACTIVE,
    channelIndex
  })
}

export const addMessage = (message) => async dispatch => {
  let channel_index = -1

  const channels = store.getState().channels.channels

  for (const i in channels) {
    if (channels[i]._id === message.ChannelID) {
      channel_index = i
    }
  }

  const decrypted = await decrypt(message.Encrypted, store.getState().channels.channels[channel_index].AESKey)

  message.Encrypted = decrypted

  dispatch({
    type: ADD_MESSAGE,
    message,
    channel_index
  })
}

export const addTyper = typer => dispatch => {
  dispatch({
    type: ADD_TYPER,
    typer
  })
}

export const removeTyper = typer => dispatch => {
  dispatch({
    type: REMOVE_TYPER,
    typer
  })
}

export const addUser = (channelID, newUsers) => dispatch => {
  dispatch({
    type: ADD_USER,
    channel: channelID,
    newUsers: newUsers
  })
}

export const clearData = _ => dispatch => {
  dispatch({
    type: CLEAR_DATA
  })
}

export async function decryptChannel (user, channel, index, myPrivateKey) {
  const myKey = channel.PrivateKeys[user._id]

  console.time('KeyDerivation')
  // query the channel key from indexedDB, if it fails unwrap my key from the channel and store that in indexedDB
  let channel_key
  const channelKeyStore = store.getState().indexdb.db.transaction(['channel_keystore']).objectStore('channel_keystore')
  const requestChannel = channelKeyStore.get(channel._id)
  try {
    channel_key = (await dbQueryPromise(requestChannel)).target.result.key
  } catch (err) {
    channel_key = await crypto.subtle.unwrapKey('raw', Buffer.from(myKey, 'hex'), myPrivateKey, 'RSA-OAEP', { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
    const transaction = store.getState().indexdb.db.transaction(['channel_keystore'], 'readwrite')

    const keystoreObjectStore = transaction.objectStore('channel_keystore')
    keystoreObjectStore.put({ channel_id: channel._id, key: channel_key })
  }

  console.timeEnd('KeyDerivation')

  // Start decrypting the messages in the channel
  try {
    let decryptedMessages = []

    if (channel.Messages) {
      console.time('DecryptMessages')
      decryptedMessages = await Promise.all(channel.Messages.map(async message => {
        return { ...message, Encrypted: await decrypt(message.Encrypted, channel_key) }
      }))
      console.timeEnd('DecryptMessages')
    }

    return {
      _id: channel._id,
      Name: channel.Name,
      privateKeys: channel.PrivateKeys,
      userMap: channel.UserMap,
      AESKey: channel_key,
      index,
      messages: decryptedMessages,
      typers: {}
    }
  } catch (e) {
    console.error(e)
  }
}

export async function decrypt (message, AESKey) {
  const decoder = new TextDecoder()

  const bData = Buffer.from(message, 'base64')

  // convert data to buffers
  const iv = bData.slice(0, 16)
  const salt = bData.slice(16, 80)
  const text = bData.slice(80)

  const keyMaterial = await getKeyMaterial(AESKey)
  const key = await deriveKeyWithSalt(keyMaterial, salt)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    text
  )

  return decoder.decode(decrypted)
}

export async function encrypt (text, masterkey) {
  const encoder = new TextEncoder()

  const iv = window.crypto.getRandomValues(new Uint8Array(16))
  const salt = window.crypto.getRandomValues(new Uint8Array(64))

  const keyMaterial = await getKeyMaterial(masterkey)
  const key = await deriveKeyWithSalt(keyMaterial, salt)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(text)
  )

  return Buffer.concat([Buffer.from(iv), Buffer.from(salt), Buffer.from(encrypted)]).toString('base64')
}

async function getKeyMaterial (AESKey) {
  const enc = new TextEncoder()

  const keyString = await crypto.subtle.exportKey('raw', AESKey)

  return window.crypto.subtle.importKey(
    'raw',
    enc.encode(keyString),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
}

function deriveKeyWithSalt (keyMaterial, salt) {
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 2000,
      hash: 'SHA-512'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}
