import React, { useState, useEffect } from "react"

import { withTheme, useTheme } from "@material-ui/core"

import { sendData } from "../actions/socketActions"
import { acceptCall, declineCall, startCall, endCall } from "../actions/callActions"

import { FiPhone, FiPhoneOff, FiVideo } from "react-icons/fi"
import { FaPhone, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa"
import { GiSpeaker } from "react-icons/gi"

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
import Draggable from "react-draggable"

import { connect } from "react-redux"

const CallView = props => {
    const theme = useTheme()

    const [otherID, setOtherID] = useState("")
    const [callActive, setCallActive] = useState(false)

    const [data, setData] = useState({})
    const [microphoneActive, setMicrophoneActive] = useState(true)


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

    const handleCall = (constraints, data) => {
        setCallActive(true)

        props.startCall(constraints, props.channels.activeChannel, props.user._id, props.user.username, data.type)
    }

    const handleHangUp = _ => {
        setCallActive(false)
        props.endCall()
        //stream.getTracks().forEach(track => track.stop())
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

    const toggleMicrophone = _ => {
        for(let stream of props.call.stream.getAudioTracks()) {
            stream.enabled = !microphoneActive
            setMicrophoneActive(!microphoneActive)
        }
    }

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
                open = {props.call.incomingCall && props.call.incomingCall ? true : false}
                onClose = {handleHangUp}
                fullScreen
            >
                { 
                    props.call.incomingCall && props.call.incomingCall ?
                        <>
                            <DialogTitle id="form-dialog-title">`Incoming {data.type} call {props.call.incomingCall.WhoUsername} in 
                            {props.call.incomingCall.Channel_Name} channel</DialogTitle>
                            <DialogContent>
                                <button onClick = {_ => props.acceptCall(props.call.incomingCall, props.call.incomingCall.SignalData)}>Accept</button>
                                <button onClick = {props.declineCall}>Decline</button>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleHangUp} color="primary" style = {{ display: "absolute", bottom: 0 }}>End Call</Button>
                            </DialogActions>
                        </>
                        :
                        <div></div>
                }
            </Dialog>
            <Dialog
                open={callActive || props.call.currentCall ? true : false}
                onClose={handleHangUp}
                aria-labelledby="form-dialog-title"
                fullScreen
                style = {{ backgroundColor: "black" }}
            >
                <DialogTitle id="form-dialog-title" style = {{ backgroundColor: "black", color: "white" }}>
                    {`${props.call.incomingCall ? props.call.incomingCall.call_type : (props.call.currentCall ? props.call.currentCall.Call_Type : "")} call`}
                </DialogTitle>
                <DialogContent style = {{ backgroundColor: "black", overflow: "none" }}>
                    <Draggable defaultPosition = {{ x: 10, y: 10 }}>
                        <video id = "localVideo"  draggable muted autoPlay playsInline controls = {false} style = {{ 
                            width: "25%", 
                            minWidth: 100,
                            maxWidth: 450,
                            position: "absolute", 
                            zIndex: 500,
                            }} 
                        /> 
                    </Draggable>
                    <video id = "externalVideo" autoPlay playsInline controls = {false} style = {{ width: "100%", height: "100%" }} /> 
                </DialogContent>
                <DialogActions style = {{ backgroundColor: "black", display: "flex", justifyContent: "center" }}>
                    <div onClick={toggleMicrophone} style = {{ 
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            bottom: 10, 
                            cursor: "pointer", 
                            backgroundColor: "#eee", 
                            borderRadius: "50%",
                            width: 50,
                            height: 50
                        }}>
                        { microphoneActive ? <FaMicrophone color="black" /> : <FaMicrophoneSlash color="black" />}
                    </div>
                    <div onClick={handleHangUp} style = {{ 
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bottom: 10, 
                        cursor: "pointer", 
                        backgroundColor: "red", 
                        borderRadius: "50%",
                        width: 50,
                        height: 50
                    }}>
                        <FaPhone color="white" style = {{ transform: "scaleX(-1)" }} />
                    </div>
                    <div onClick={handleHangUp} style = {{ 
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bottom: 10, 
                        cursor: "pointer", 
                        backgroundColor: "#eee", 
                        borderRadius: "50%",
                        width: 50,
                        height: 50
                    }}>
                        <GiSpeaker color="black" size = {23} />
                    </div>
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

export default connect(mapStateToProps, { sendData, startCall, acceptCall, declineCall, endCall })(CallView)