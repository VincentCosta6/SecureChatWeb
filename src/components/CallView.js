import React, { useState, useEffect } from "react"

import { withTheme, useTheme } from "@material-ui/core"

import Peer from "simple-peer"

import { sendData } from "../actions/socketActions"
import { acceptCall, declineCall, startCall } from "../actions/callActions"

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

    const [data, setData] = useState({})

    useEffect(_ => {
        if(props.channels.activeChannel !== -1) {
            const channel = props.channels.channels[props.channels.activeChannel]

            if(Object.keys(channel.privateKeys).length === 2) {
                const copy = Object.assign(channel.privateKeys, {})

                delete copy[props.user._id];

                const user_id = Object.keys(copy)[0]

                setOtherID(user_id)
            }
        }
        else 
            setOtherID("")
    }, [props.channels.activeChannel, props.channels.channels])

    const handleVoiceCall = _ => {
        const constraints = {
            'audio': true,
        }

        handleCall(constraints, { type: "Voice" })
    }

    const handleVideoCall = _ => {
        const constraints = {
            'audio': true,
            'video': true,
        }

        handleCall(constraints, { type: "Video" })
    }

    const handleConnect = answer => {
        console.log(answer)
        data.peer.signal(answer)
    }

    const handleCall = (constraints, data) => {
        setCallActive(true)

        props.startCall(constraints, props.channels.activeChannel, props.user._id, props.user.username, data.type)
    }

    const handleHangUp = _ => {
        setCallActive(false)
        stream.getTracks().forEach(track => track.stop())
        //document.querySelector("video#localAudio").remove()
    }

    const _renderCallButton = _ => (
        <>
            { !callActive && <FiPhone size = {23} color = {theme.palette.primary.main} onClick = {handleVoiceCall} style={{ cursor: "pointer", marginRight: 15 }} />}
        </>
    )

    const _renderVideoButton = _ => (
        <>
            { !callActive && <FiVideo size = {23} color = {theme.palette.primary.main} onClick = {handleVideoCall} style={{ cursor: "pointer", marginRight: 15 }} />}
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
                open = {props.call.incomingCall && props.call.incomingCall.MessageContent}
                onClose = {handleHangUp}
                maxWidth = {0}
                fullScreen
            >
                { props.call.incomingCall && props.call.incomingCall.MessageContent && 
                    <>
                        <DialogTitle id="form-dialog-title">`Incoming {data.type} call {props.call.incomingCall.MessageContent.WhoUsername} in 
                         {props.call.incomingCall.MessageContent.Channel_Name} channel</DialogTitle>
                        <DialogContent>
                            <button onClick = {_ => props.acceptCall(props.call.incomingCall, props.call.incomingCall.MessageContent.SignalData)}>Accept</button>
                            <button onClick = {props.declineCall}>Decline</button>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleHangUp} color="primary">End Call</Button>
                        </DialogActions>
                    </>
                }
                
            </Dialog>
            <Dialog
                open={callActive || props.call.currentCall}
                onClose={handleHangUp}
                aria-labelledby="form-dialog-title"
                maxWidth = {0}
                fullScreen
            >
                <DialogTitle id="form-dialog-title">{`${data.type} call`}</DialogTitle>
                <DialogContent>
                    <video id = "localVideo" autoPlay playsInline controls = {false} style = {{ width: "10%", height: "10%", position: "absolute" }} /> 
                    <video id = "externalVideo" autoPlay playsInline controls = {false} style = {{ width: "100%", height: "100%" }} /> 
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
        websocket: state.websocket,
        call: state.call
    }
}

export default connect(mapStateToProps, { sendData, startCall, acceptCall, declineCall })(CallView)