import { authReq } from "../axios-auth"

import crypto from "crypto-browserify"

import forge, { cipher } from "node-forge"
const RSA = forge.pki.rsa

export const LOAD_CHANNELS = "LOAD_CHANNELS"
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
        .then(data => {
            let channels = data.data.results

            channels = channels.map((channel, index) => decyptChannel(user, channel, index))

            dispatch({
                type: LOAD_CHANNELS,
                channels,
                isLoading: false
            })
        })
}

export const addChannel = (user, channel) => dispatch => {
    const newChannel = decyptChannel(user, channel, -2)

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

export const addMessage = (message) => dispatch => {
    dispatch({
        type: ADD_MESSAGE,
        message
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

export function decyptChannel(user, channel, index) {
    const myKey = channel.PrivateKeys[user._id]

    const myPrivate = JSON.parse(localStorage.getItem("generatedKeys")).privateKey

    const myParsedKey = forge.pki.privateKeyFromPem(myPrivate)

    console.log(forge.util.decode64(myKey))

    const ChannelKey = myParsedKey.decrypt(forge.util.decode64(myKey), "RSA-OAEP")

    console.log(ChannelKey)

    let decryptedMessages = []

    if(channel.Messages) {
        decryptedMessages = channel.Messages.map(message => {
            return { ...message, Encrypted: decrypt(message.Encrypted, ChannelKey) }
        })
    }
    
    return {
        _id: channel._id,
        Name: channel.Name,
        privateKeys: channel.PrivateKeys,
        AESKey: ChannelKey,
        index,
        messages: decryptedMessages,
        typers: {}
    }
}

export function decrypt(message, AESKey) {
    const bData = Buffer.from(message, "base64")

    // convert data to buffers
    const salt = bData.slice(0, 64)
    const iv = bData.slice(64, 80)
    const tag = bData.slice(80, 96)
    const text = bData.slice(96)

    // derive key using; 32 byte key length
    const key = crypto.pbkdf2Sync(AESKey, salt , 2145, 32, "sha512")

    // AES 256 GCM Mode
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)

    // encrypt the given text
    const decrypted = decipher.update(text, "binary", "utf8") + decipher.final("utf8")

    return decrypted
}

export function encrypt(text, masterkey){
    // random initialization vector
    const iv = crypto.randomBytes(16)

    // random salt
    const salt = crypto.randomBytes(64)

    // derive encryption key: 32 byte key length
    // in assumption the masterkey is a cryptographic and NOT a password there is no need for
    // a large number of iterations. It may can replaced by HKDF
    // the value of 2145 is randomly chosen!
    const key = crypto.pbkdf2Sync(masterkey, salt, 2145, 32, "sha512")

    // AES 256 GCM Mode
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

    // encrypt the given text
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])

    // extract the auth tag
    const tag = cipher.getAuthTag()

    // generate output
    return Buffer.concat([salt, iv, tag, encrypted]).toString("base64")
}