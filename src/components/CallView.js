import React, { useState, useEffect } from "react"

import { withTheme, useTheme } from "@material-ui/core"

import { FiPhone, FiPhoneOff, FiVideo } from "react-icons/fi"

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    Divider,
    TextField,
    DialogActions,
    Button,
    CircularProgress,
    List,
    ListItem,
} from "@material-ui/core"

import { connect } from "react-redux"

const CallView = props => {
    const theme = useTheme()

    const [otherID, setOtherID] = useState("")
    const [stream, setStream] = useState(null)
    const [callActive, setCallActive] = useState(false)

    useEffect(_ => {
        if(props.channels.activeChannel !== -1) {
            const channel = props.channels.channels[props.channels.activeChannel]

            if(Object.keys(channel.privateKeys).length === 2) {
                const copy = Object.assign(channel.privateKeys, {})

                delete copy[props.user._id];

                const user_id = Object.keys(copy)[0]

                setOtherID(user_id)

                return _ => {}
            }
        }
        
        setOtherID("")
    }, [props.channels.activeChannel, props.channels.channels])

    const handleCall = _ => {
        const constraints = {
            'audio': true,
            'video': true
        }

        setCallActive(true)

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                const audioElement = document.querySelector("video#localVideo")
                audioElement.srcObject = stream

                setStream(stream)
            })
            .catch(err => {
                console.error(err)
            })
    }

    const handleHangUp = _ => {
        setCallActive(false)
        stream.getTracks().forEach(track => track.stop())
        //document.querySelector("video#localAudio").remove()
    }

    const _renderCallButton = _ => (
        <>
            { !callActive && <FiPhone size = {23} color = {theme.palette.primary.main} onClick = {handleCall} style={{ cursor: "pointer", marginRight: 15 }} />}
        </>
    )

    const _renderVideoButton = _ => (
        <>
            { !callActive && <FiVideo size = {23} color = {theme.palette.primary.main} onClick = {handleCall} style={{ cursor: "pointer", marginRight: 15 }} />}
        </>
    )

    const _renderActiveCall = _ => (
        <>
            <FiPhoneOff size = {23} color = {"red"} onClick = {handleHangUp} style={{ cursor: "pointer", marginRight: 15 }} />
        </>
    )

    return (
        <>
            {
                props.connection.websocketConnected && 
                    <>
                        { otherID !== "" && _renderCallButton() }
                        { otherID !== "" && _renderVideoButton() }

                        { callActive && _renderActiveCall() }
                    </>
            }
            <Dialog
                open={callActive}
                onClose={handleHangUp}
                aria-labelledby="form-dialog-title"
                maxWidth = {0}
                fullScreen
            >
                <DialogTitle id="form-dialog-title">Call</DialogTitle>
                <DialogContent>
                    <video id = "localVideo" autoPlay playsInline controls = {false} style = {{ width: "100%", height: "100%" }} /> 
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleHangUp} color="primary">End Call</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

const mapStateToProps = state => {
    return {
        user: state.user,
        connection: state.connection,
        channels: state.channels,
        websocket: state.websocket
    }
}

export default connect(mapStateToProps, {  })(CallView)