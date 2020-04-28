import React, { Fragment } from "react"

import { connect } from "react-redux"
import { withRouter } from "react-router"
import { withTheme, useTheme } from "@material-ui/core/styles"

import { setActive } from "../actions/channelActions"

import Channel from "./Channel"
import CreateChannel from "./CreateChannel"

import { CircularProgress, makeStyles, Divider } from "@material-ui/core"

const useStyles = makeStyles({
    container: ({ theme }) => ({
        resize: "horizontal",
        minWidth: 200,
        overflowY: "auto", 
        backgroundColor: theme.palette.background.paper, 
    }),
    loadingContainer: {
        display: "flex", 
        justifyContent: "center", 
        margin: "15px 0"
    },
    divider: ({ theme }) => ({
        backgroundColor: theme.palette.background.default
    })
})

const SidePanel = props => {
    const theme = useTheme()
    const styles = useStyles({ theme })

    const setActive = (channelIndex) => {
        props.setActive(channelIndex)
    }

    const sortChannels = (c1, c2) => {
        const c1Last = c1.messages[c1.messages.length - 1]
        const c2Last = c2.messages[c2.messages.length - 1]

        if(!c1Last) return 1
        if(!c2Last) return -1

        const c1Time = new Date(c1Last.Timestamp)
        const c2Time = new Date(c2Last.Timestamp)

        return c2Time - c1Time
    }

    const _renderChannels = _ => {
        if (props.channels.LOADING_CHANNELS) {
            return (
                <div className = {styles.loadingContainer}>
                    <CircularProgress size={17} />
                </div>
            )
        }
        else {
            if( props.channels.channels.length !== 0)
                return props.channels.channels.slice().sort(sortChannels).map(e =>
                    <Fragment key={e._id}>
                        <Channel data={e} setDrawer = {props.setDrawer} setActive={setActive} isCurrent={props.channels.activeChannel === e.index} myUsername = {props.user.username} />
                        <Divider className = {styles.divider} />
                    </Fragment>
                )
                else {
                    return <h5 style = {{ margin: "0px 0px 10px 15px" }}>You arent in any channels</h5>
                }
        }
    }

    return (
        <div className = {styles.container} style = {{ maxWidth: props.width && props.width <= 750 ? "" : "400px", borderRight: "1px solid black" }}>
            {_renderChannels()}
            
            <CreateChannel width = {props.width} />
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

export default connect(mapStateToProps, { setActive })(withRouter(withTheme(SidePanel)))

