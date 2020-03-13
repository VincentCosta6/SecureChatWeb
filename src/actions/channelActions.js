import axiosAuth from "../axios-auth"

export const LOAD_CHANNELS = "LOAD_CHANNELS"
export const ADD_CHANNEL = "ADD_CHANNEL"
export const DELETE_CHANNEL = "DELETE_CHANNEL"

export const SET_ACTIVE = "SET_ACTIVE"

export const ADD_MESSAGE = "ADD_MESSAGE"

export const SET_LOAD_CHANNELS = "SET_LOAD_CHANNELS"

export const loadChannels = user => dispatch => {
    dispatch({
        type: SET_LOAD_CHANNELS,
        isLoading: true
    })

    axiosAuth.get(`https://${"bruh"}/channels/mine`, {
        headers: {
            'Accept': "application/json"
        }
    })
        .then(res => {
            let channels = res.data.results

            channels = channels.map((channel, index) => {})

            dispatch({
                type: LOAD_CHANNELS,
                channels,
                isLoading: false
            })
        })
}

export const addChannel = (user, channel) => dispatch => {
    const newChannel = {}

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