import React, { useState, useEffect } from "react"

import { withTheme, useTheme } from "@material-ui/core"

import { sendData } from "../actions/socketActions"
import { acceptCall, declineCall, startCall, endCall } from "../actions/callActions"

import { FiPhone, FiPhoneOff, FiVideo } from "react-icons/fi"
import { FaPhone, FaMicrophone, FaMicrophoneSlash, FaUserAlt, FaBolt } from "react-icons/fa"
import { GiSpeaker } from "react-icons/gi"
import { BsThreeDotsVertical } from "react-icons/bs"
import { MdSpeakerNotesOff } from "react-icons/md"
import { IoIosExit } from "react-icons/io"

import AddPerson from "./AddPerson"

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
    Menu,
    MenuItem
} from "@material-ui/core"
import Draggable from "react-draggable"

import { authReq } from "../axios-auth"

import { connect } from "react-redux"

const CallView = props => {
    const theme = useTheme()

    const [data, setData] = useState({})
    const [microphoneActive, setMicrophoneActive] = useState(true)

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
        setAnchorEl(null)

        props.startCall(constraints, props.channels.activeChannel, props.user._id, props.user.username, data.type)
    }

    const handleHangUp = _ => {
        props.endCall()
    }

    const toggleMicrophone = _ => {
        for(let stream of props.call.stream.getAudioTracks()) {
            stream.enabled = !microphoneActive
            setMicrophoneActive(!microphoneActive)
        }
    }

    const getTitle = _ => {
        if(props.call.incomingCall) {
            if(props.call.incomingCall.call_type) {
                return props.call.incomingCall.call_type
            }
            else {
                return props.call.incomingCall.Call_Type
            }
        }
        else if(props.call.currentCall) {
            if(props.call.currentCall.call_type) {
                return props.call.currentCall.call_type
            }
            else {
                return props.call.currentCall.Call_Type
            }
        }
        else return ""
    }

    const handleViewParticipants = _ => {
        setAnchorEl(null)
        setAddVisible(true)
    }

    const handleMuteChannel = _ => {
        setAnchorEl(null)
    }

    const handleLeaveChannel = async _ => {
        setAnchorEl(null)
        const channelID = props.channels.channels[props.channels.activeChannel]._id

        const res = await authReq(localStorage.getItem("token")).delete("https://servicetechlink.com/channel/leave", { data: { channelID } })

        console.log(res)
    }

    const [anchorEl, setAnchorEl] = useState(null)

    const handleOptionsClick = event => {
        setAnchorEl(event.currentTarget)
    }

    const [addVisible, setAddVisible] = useState(false)

    const handleClose = _ => {
        setAddVisible(false)
    }

    return (
        <>
            {
                props.connection.websocketConnected && 
                    <>
                        { props.channels.activeChannel !== -1 && 
                        <BsThreeDotsVertical onClick = {handleOptionsClick} aria-controls = "simple-menu" size = {30} color = {theme.palette.primary.main} style = {{ cursor: "pointer" }} /> }
                    </>
            }
            {/*
                props.connection.websocketConnected ?
                <FaBolt color={theme.palette.primary.main} size={23} title="Websocket is open" /> :
                <div onClick={_ => props.openWebsocket(props.user.token)}>
                    <FaBolt color="red" size={30} title="Websocket is closed" />
                </div>
            */}
            <AddPerson
                open = {addVisible}
                handleClose = {handleClose}
            />
            <Menu
                id = "simple-menu"
                anchorEl = {anchorEl}
                keepMounted
                open = {Boolean(anchorEl)}
                onClose = {_ => setAnchorEl(null)}
            >
                <MenuItem onClick={handleViewParticipants}>
                    <FaUserAlt size = {23} color = {theme.palette.primary.main} style={{ cursor: "pointer", marginRight: 15 }} />
                    Add Participant
                </MenuItem>
                <MenuItem onClick={handleMuteChannel}>
                    <MdSpeakerNotesOff size = {23} color = {theme.palette.primary.main} style={{ cursor: "pointer", marginRight: 15 }} />
                    Mute Channel
                </MenuItem>
                {
                    props.channels.activeChannel !== -1 && Object.keys(props.channels.channels[props.channels.activeChannel].privateKeys).length === 2 &&
                    <div>
                        <MenuItem onClick={handleVoiceCall}>
                            <FiPhone size = {23} color = {theme.palette.primary.main} style={{ cursor: "pointer", marginRight: 15 }} />
                            Audio Call
                        </MenuItem>
                        <MenuItem onClick={handleVideoCall}>
                            <FiVideo size = {23} color = {theme.palette.primary.main} onClick = {handleVideoCall} style={{ cursor: "pointer", marginRight: 15 }} />
                            Video Call
                        </MenuItem>
                    </div>
                }
                <MenuItem onClick={handleLeaveChannel}>
                    <IoIosExit size = {23} color = {theme.palette.primary.main} onClick = {handleVideoCall} style={{ cursor: "pointer", marginRight: 15 }} />
                    Leave Channel
                </MenuItem>
            </Menu>
            <Dialog
                open = {props.call.incomingCall && props.call.incomingCall ? true : false}
                onClose = {handleHangUp}
                fullScreen
                style = {{ backgroundColor: "black" }}
            >
                { 
                    props.call.incomingCall && props.call.incomingCall ?
                        <>
                            <DialogTitle id="form-dialog-title" style = {{ backgroundColor: "black", color: "white" }}>{props.call.incomingCall.Call_Type} call</DialogTitle>
                            <DialogContent style = {{ backgroundColor: "black", overflow: "none", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                                <h1>Incoming {props.call.incomingCall.Call_Type} call</h1>
                                <h2>Channel: {props.call.incomingCall.Channel_Name}</h2>
                                <h3>Caller: {props.call.incomingCall.WhoUsername}</h3>
                            </DialogContent>
                            <DialogActions style = {{ backgroundColor: "black", display: "flex", justifyContent: "center" }}>
                                <div onClick={_ => props.acceptCall(props.call.incomingCall, props.call.incomingCall.SignalData)} style = {{ 
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    bottom: 10, 
                                    cursor: "pointer", 
                                    backgroundColor: "green", 
                                    borderRadius: "50%",
                                    width: "5vh",
                                    height: "5vh",
                                    minWidth: 50,
                                    minHeight: 50,
                                    maxWidth: 80,
                                    maxHeight: 80,
                                    marginRight: 15
                                }}>
                                    <FaPhone color="white" style = {{ transform: "scaleX(-1)", width: "2.2vh", height: "2.2vh" }} />
                                </div>
                                <div onClick={props.declineCall} style = {{ 
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    bottom: 10, 
                                    cursor: "pointer", 
                                    backgroundColor: "red", 
                                    borderRadius: "50%",
                                    width: "5vh",
                                    height: "5vh",
                                    minWidth: 50,
                                    minHeight: 50,
                                    maxWidth: 80,
                                    maxHeight: 80,
                                }}>
                                    <FaPhone color="white" style = {{ transform: "scaleX(-1)", width: "2.2vh", height: "2.2vh" }} size = {30} />
                                </div>
                            </DialogActions>
                        </>
                        :
                        <div></div>
                }
            </Dialog>
            <Dialog
                open={Boolean(props.call.currentCall)}
                onClose={handleHangUp}
                aria-labelledby="form-dialog-title"
                fullScreen
                style = {{ backgroundColor: "black" }}
            >
                <DialogTitle id="form-dialog-title" style = {{ backgroundColor: "black", color: "white" }}>
                    { getTitle() } call
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