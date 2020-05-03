import React, { useState, useEffect } from "react"

import { connect } from "react-redux"
import { withTheme, useTheme, makeStyles, CircularProgress } from "@material-ui/core"
import useInterval from "../utility/useInterval"

import { loadChannels } from "../actions/channelActions"
import { openIndexDB } from "../actions/indexDBActions"

import {
    isPushNotificationSupported,
    askUserPermission,
    registerServiceWorker,
    createNotificationSubscription,
    getUserSubscription
  } from "../push_notifications/pushNotifs";

import SidePanel from "./SidePanel"
import ChannelView from "./ChannelView"

import CreateChannel from "./CreateChannel"

import { openWebsocket } from "../actions/socketActions"
import { authReq } from "../axios-auth"

const pushNotificationSupported = isPushNotificationSupported()

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

const public_key = "BO47up6T_b3tELDFjeBPXNpUZZ45B5wcHgDKnsjI3ykGGW6q2b8qKFDfL4v8XBtDUlqOEKl2pfEcYg8nE9NIUqE"

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

    useEffect(_ => {
        if(isPushNotificationSupported) {
            askUserPermission().then(async consent => {
                console.log(`Notification consent is set to ${consent}`)

                if(consent === "granted") {
                    const reg = await navigator.serviceWorker.register("/../service-worker.js")

                    await navigator.serviceWorker.ready

                    console.log("[Service Worker] Registration: ", reg)
                    let subscription = await reg.pushManager.getSubscription()

                    if(!subscription) {
                        console.log("[Web Push] No subscription found generating one...")
                        subscription = await reg.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: public_key
                        })
                    }

                    async function receivePushNotification(event) {
                        console.log("[Service Worker] Push Received.");

                        console.log(event)
                    
                        const options = {
                            vibrate: [200, 100, 200],
                        };

                        const reg = await navigator.serviceWorker.ready

                        event.waitUntil(reg.showNotification("Notification", options));
                    }
                    
                    function openPushNotification(event) {
                        console.log("[Service Worker] Notification click Received.", event.notification.data);
                    
                        event.notification.close();
                        event.waitUntil(window.self.clients.openWindow(event.notification.data));
                    }
                    
                    window.self.addEventListener("push", receivePushNotification);
                    window.self.addEventListener("notificationclick", openPushNotification);
                    
                    console.log("[Web Push] Subscription: ", subscription)

                    const res = await authReq(localStorage.getItem("token"))
                        .post("https://servicetechlink.com/subscription", subscription)

                    console.log(res)
                }
            })
            .catch(err => {
                console.error("[Service Worker] Error occured while asking for permissions", err)
            })
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
        props.openIndexDB()
    }, [])

    useEffect(_ => {
        if(props.user.token && props.user.token.length > 10 && !props.websocket.websocket && props.indexdb.db) {
            props.openWebsocket(props.user.token)
        }
    }, [props.connection.websocketConnected, props.user, props.user.token, props.indexdb.db])

    useEffect(_ => {
        reload()
    }, [props.connection.serverConnected, props.connection.websocketConnected])

    const reload = _ => {
        if(props.connection.websocketConnected && props.channels.channels.length === 0) {
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
                            <CreateChannel width = {width} />
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
        if(props.websocket.opening || props.channels.LOADING_CHANNELS || props.websocket.failed || props.indexdb.opening || props.indexdb.failed) {
            let message = ""

            if(props.indexdb.opening) message = "Connecting IndexDB"
            else if(props.indexdb.failed) message = "IndexDB failed, did you deny the permission?"
            else if(props.websocket.opening) message = "Connecting"
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
        websocket: state.websocket,
        indexdb: state.indexdb
    }
}

export default connect(mapStateToProps, { loadChannels, openWebsocket, openIndexDB })(withTheme(Container))