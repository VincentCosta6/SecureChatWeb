import React, { useState, useEffect } from "react"

import { connect } from "react-redux"
import { withTheme, useTheme, makeStyles, CircularProgress } from "@material-ui/core"
import useInterval from "../utility/useInterval"

import { loadChannels } from "../actions/channelActions"

import SidePanel from "./SidePanel"
import ChannelView from "./ChannelView"

import CreateChannel from "./CreateChannel"

import { openWebsocket } from "../actions/socketActions"

const useStyles = makeStyles({
    container: {
        height: "100%",
        display: "flex", 
        width: "100%"
    },
    viewContainer: ({ theme }) => ({
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",

        "& div": {
            textAlign: "center", 
            margin: "auto",
            color: theme.palette.text.primary, 
        }
    })
})

export const Container = props => {
    const theme = useTheme()
    const styles = useStyles({ theme })

    const [width, setWidth] = useState(window.innerWidth)

    const [retry, setRetry] = useState(5)

    useEffect(_ => {
        window.addEventListener("resize", updateWindowWidth)

        return _ => {
            window.removeEventListener("resize", updateWindowWidth)
        }
    }, [])

    useInterval(_ => {
        if(retry === 1) {
            props.openWebsocket(props.user.token)
            setRetry(10)
        }
        else {
            setRetry(retry - 1)
        }
    }, !props.websocket.opening && props.websocket.failed ? 1000 : null)

    useEffect(_ => {
        if(props.user.token && props.user.token.length > 10 && !props.websocket.websocket) {
            props.openWebsocket(props.user.token)
        }
    }, [props.connection.websocketConnected, props.user, props.user.token])

    useEffect(_ => {
        reload()
    }, [props.connection.serverConnected, props.connection.websocketConnected])

    const reload = _ => {
        if(props.connection.websocketConnected) {
            props.loadChannels(props.user)
        }
    }

    const updateWindowWidth = _ => {
        setWidth(window.innerWidth)
    }

    const _renderContent = _ => {
        const loading = props.channels.LOADING_CHANNELS
        const notIn = !props.channels.LOADING_CHANNELS && props.channels.channels.length === 0
        const click = !props.channels.LOADING_CHANNELS && props.channels.activeChannel === -1

        if(loading || notIn || click) {
            let message = ""

            if(loading) {
                message = <CircularProgress size = {23} color = "primary" />
            }
            else if(notIn) {
                return(
                    <div className = {styles.viewContainer}>
                        <div>
                            <h1>You are not in any channels!</h1>
                            <CreateChannel />
                        </div>
                    </div>
                )
            }
            else if(click && width > 750) {
                message = <h1>Click on a channel</h1>
            }
            else if(click) {
                return <SidePanel width = {width} />
            }
            return (
                <div className = {styles.viewContainer}>
                    {message}
                </div>
            )
        }
        else {
            return <ChannelView />
        }
    }

    const _renderPage = _ => {
        if(props.websocket.opening || props.channels.LOADING_CHANNELS || props.websocket.failed) {
            let message = ""

            if(props.websocket.opening) message = "Connecting"
            else if(props.channels.LOADING_CHANNELS) {
                if(props.channels.DECRYPTING) {
                    message = "Decrypting messages"
                }
                else message = "Fetching messages"
            }
            else if(props.websocket.failed) message = "Failed to connect"

            return (
                <div className = {styles.viewContainer}>
                    <div>
                        { !props.websocket.failed && <CircularProgress size = {23} /> }
                        <h1>{message}</h1>
                        { !props.websocket.opening && props.websocket.failed && <h3>Trying again in {retry}</h3> }
                    </div>
                </div>
            )  
        }
        return (
            <div className = {styles.container} style = {{ flexDirection: width <= 750 ? "column" : "" }}>
                { width > 750 && <SidePanel width = {width} /> }
                { _renderContent() }
            </div>
        )
    }

    return (
        <div className = {styles.container} style = {{ flexDirection: width <= 750 ? "column" : "" }}>
            { _renderPage() }
        </div>
    )
}

const mapStateToProps = state => {
    return {
        user: state.user,
        channels: state.channels,
        connection: state.connection,
        websocket: state.websocket
    }
}

export default connect(mapStateToProps, { loadChannels, openWebsocket })(withTheme(Container))