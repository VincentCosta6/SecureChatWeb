import React, { useState, useEffect } from "react"

import { connect } from "react-redux"
import { withTheme, useTheme, makeStyles } from "@material-ui/core"

import SidePanel from "./SidePanel"
import ChannelView from "./ChannelView"

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

        "& h1": {
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
            else if(notIn) message = "You are not in any channels! Click '+' to create a channel"
            else if(click) message = "Click on a channel"

            return (
                <div className = {styles.viewContainer}>
                    <h1>{message}</h1>
                </div>
            )
        }
        else {
            return <ChannelView />
        }
    }

    return (
        <div className = {styles.container}>
            { width > 800 && <SidePanel /> }
            { _renderContent() }
        </div>
    )
}

const mapStateToProps = state => {
    console.log(state)
    return {
        user: state.user,
        channels: state.channels
    }
}

export default connect(mapStateToProps, {  })(withTheme(Container))