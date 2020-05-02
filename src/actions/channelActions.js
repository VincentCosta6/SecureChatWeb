import store from "../store"

import { dbQueryPromise } from "../utility/indexDBWrappers"

import { authReq } from "../axios-auth"
import { AES } from "crypto-js"

export const LOAD_CHANNELS = "LOAD_CHANNELS"
export const DECRYPTING = "DECRYPTING"

export const ADD_CHANNEL = "ADD_CHANNEL"
export const DELETE_CHANNEL = "DELETE_CHANNEL"
export const SET_ACTIVE = "SET_ACTIVE"
export const ADD_MESSAGE = "ADD_MESSAGE"
export const SET_LOAD_CHANNELS = "SET_LOAD_CHANNELS"
export const ADD_TYPER = "ADD_TYPER"
export const REMOVE_TYPER = "REMOVE_TYPER"
export const ADD_USER = "ADD_USER"

export const CLEAR_DATA = "CLEAR_DATA"

export const loadChannels = user => dispatch => {
    dispatch({
        type: SET_LOAD_CHANNELS,
        isLoading: true
    })

    authReq(localStorage.getItem("token")).get("https://servicetechlink.com/channels/mine")
        .then(async data => {

            dispatch({
                type: DECRYPTING
            })

            const channels = await Promise.all(data.data.results.map(async (channel, index) => await decryptChannel(user, channel, index)))

            console.log("here")

            // merge websocket queue messages

            dispatch({
                type: LOAD_CHANNELS,
                channels
            })
        })
}

export const addChannel = (user, channel) => dispatch => {
    const newChannel = decryptChannel(user, channel, -2)

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
        channelIndex,
    })
}

export const addMessage = (message) => async dispatch => {
    let channel_index = -1

    const channels = store.getState().channels.channels

    for(let i in channels) {
        if(channels[i]._id === message.ChannelID) {
            channel_index = i
        }
    }

    console.log(message)

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

export async function decryptChannel(user, channel, index) {
    const myKey = channel.PrivateKeys[user._id]

    const keyStore = store.getState().indexdb.db.transaction(["keystore"]).objectStore("keystore")
    const request = keyStore.get(store.getState().user.username)

    try {
        const event = await dbQueryPromise(request)

        const privateKey = event.target.result.keys.privateKey

        console.log(myKey)

        const encoder = new TextEncoder()

        const unwrapped = await crypto.subtle.unwrapKey("raw", Buffer.from(myKey, "hex"), privateKey, "RSA-OAEP", { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"] )

        let decryptedMessages = []

        if (channel.Messages) {
            decryptedMessages = await Promise.all(channel.Messages.map(async message => {
                return { ...message, Encrypted: await decrypt(message.Encrypted, unwrapped) }
            }))
        }

        console.log(channel)

        return {
            _id: channel._id,
            Name: channel.Name,
            privateKeys: channel.PrivateKeys,
            AESKey: unwrapped,
            index,
            messages: decryptedMessages,
            typers: {}
        }
    }
    catch (e) {
        console.error(e)
    }


}

function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}


function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

// AESKey is a base64 string
export async function decrypt(message, AESKey) {
    const decoder = new TextDecoder()

    const bData = Buffer.from(message, "base64")

    // convert data to buffers
    const iv = bData.slice(0, 16)
    const salt = bData.slice(16, 80)
    const text = bData.slice(80)

    const keyMaterial = await getKeyMaterial(AESKey)
    const key = await deriveKeyWithSalt(keyMaterial, salt)

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        text
    )

    return decoder.decode(decrypted)
}

// masterkey is a utf-8 string
export async function encrypt(text, masterkey) {
    const encoder = new TextEncoder()

    const iv = window.crypto.getRandomValues(new Uint8Array(16))
    const salt = window.crypto.getRandomValues(new Uint8Array(64))

    const keyMaterial = await getKeyMaterial(masterkey)
    const key = await deriveKeyWithSalt(keyMaterial, salt)

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoder.encode(text)
    )

    return Buffer.concat([Buffer.from(iv), Buffer.from(salt), Buffer.from(encrypted)]).toString("base64")
}

async function getKeyMaterial(AESKey) {
    let enc = new TextEncoder()

    const keyString = await crypto.subtle.exportKey("raw", AESKey)

    return window.crypto.subtle.importKey(
        "raw",
        enc.encode(keyString),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    )
}

function deriveKeyWithSalt(keyMaterial, salt) {
    return window.crypto.subtle.deriveKey(
        {
            "name": "PBKDF2",
            salt: salt,
            "iterations": 100000,
            "hash": "SHA-512"
        },
        keyMaterial,
        { "name": "AES-GCM", "length": 256 },
        true,
        ["encrypt", "decrypt"]
    )
}