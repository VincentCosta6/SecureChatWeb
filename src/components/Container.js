import React, { useState, useEffect } from "react"

import { connect } from "react-redux"
import { withTheme, useTheme, makeStyles } from "@material-ui/core"

import { loadChannels } from "../actions/channelActions"

import SidePanel from "./SidePanel"
import ChannelView from "./ChannelView"

import CreateChannel from "./CreateChannel"

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
        backgroundColor: theme.palette.background.default,

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

    useEffect(_ => {
        window.addEventListener("resize", updateWindowWidth)

        return _ => {
            window.removeEventListener("resize", updateWindowWidth)
        }
    }, [])

    useEffect(_ => {
        reload()
    }, [props.connection.serverConnected])

    const reload = _ => {
        if (props.channels.channels.length === 0)
            props.loadChannels(props.user)
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

            if(loading) message = "Decrypting channels..."
            else if(notIn) return(
                <div className = {styles.viewContainer}>
                    <div>
                        <h1>You are not in any channels!</h1>
                        <CreateChannel />
                    </div>
                </div>
            )
            else if(click && width > 750) message = "Click on a channel"
            else if(click) return (
                <>
                    <h1 style = {{ marginLeft: 15 }}>Channels</h1>
                    <SidePanel width = {width} />
                </>
            )

            return (
                <div className = {styles.viewContainer}>
                    <h1 style = {{ marginLeft: 15 }}>{message}</h1>
                </div>
            )
        }
        else {
            return <ChannelView />
        }
    }

    return (
        <div className = {styles.container} style = {{ flexDirection: width <= 750 ? "column" : "" }}>
            { width > 750 && <SidePanel width = {width} /> }
            { _renderContent() }
        </div>
    )
}

const mapStateToProps = state => {
    return {
        user: state.user,
        channels: state.channels,
        connection: state.connection
    }
}

export default connect(mapStateToProps, { loadChannels })(withTheme(Container))