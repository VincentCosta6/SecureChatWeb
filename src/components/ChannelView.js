import React, { useEffect, useState, useRef } from "react"

import { connect } from "react-redux"
import { withTheme, useTheme } from "@material-ui/core"
import useLongPress from "../utility/useLongPress"

import { sendData } from "../actions/socketActions"
import { encrypt } from "../actions/channelActions"

import { authReq } from "../axios-auth"

import Message from "./Message"

import { 
    TextField, 
    Button, 
    CircularProgress, 
    Divider,
    Menu,
    MenuItem
} from "@material-ui/core"
import { FiPaperclip } from "react-icons/fi"

let lastSend = null
const typingDurationSafety = 3000

const ChannelView = props => {
    const theme = useTheme()
    const fileRef = useRef(null)
    const inputRef = useRef(null)

    const sendButtonLongPress = useLongPress(_ => handleLongPress(), 500)

    const [formMessage, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [loading] = useState(false)

    const [optionsMenu, setOptionsMenu] = useState(false)
    const [cancelNextPress, setCancelNextPress] = useState(false)

    const buttonRef = useRef(null)
    const [anchorEl, setAnchorEl] = useState(null)

    const currentChannel = props.channels.channels[props.channels.activeChannel]
    const users = Object.keys(currentChannel.privateKeys).map(key => key)
    const typers = Object.keys(currentChannel.typers).map(key => currentChannel.typers[key]).filter(typer => typer.WhoTypingID !== props.user._id)
    let typingText = " "

    if(typers.length > 3) {
        typingText = "Multiple people are typing"
    }
    else if(typers.length === 1) {
        typingText = typers[0].WhoTypingUsername + " is typing"
    }
    else if(typers.length === 2) {
        typingText = typers[0].WhoTypingUsername + " and " + typers[1].WhoTypingUsername + " are typing"
    }
    else if(typers.length > 2) {
        /* eslint-disable prefer-const */
        for(let i of typers) {
            typingText += i.WhoTypingUsername

            if(i !== typers[typers.length - 1]) {
                typingText += ", "
            }
        }

        typingText += " are typing"
    }
    useEffect(_ => {
        lastSend = null

        return _ => {
            lastSend = null
        }
    }, [])

    useEffect(_ => {
        document.getElementById("message-scroll-here").scrollTop = document.getElementById("message-scroll-here").scrollHeight
    }, [currentChannel.messages.length])

    const sendMessage = async (content, type) => {
        if(content === "") {
            return
        }

        setSending(true)

        authReq(localStorage.getItem("token")).post("https://servicetechlink.com/message/create", JSON.stringify({
            channelID: currentChannel._id,
            message: await encrypt(JSON.stringify({
                content,
                sender: props.user.username,
                type
            }), currentChannel.AESKey)
        }))
            .then(_data => {
                setSending(false)
                setMessage("")
            })
    }

    const sendTyping = _ => {
        const userCopy = [...users]

        //delete userCopy[props.user._id]

        props.sendData(JSON.stringify({
            type: "IS_TYPING",
            content: {
                channelID: currentChannel._id,
                users: userCopy,
                whoTypingUsername: props.user.username,
                whoTypingID: props.user._id
            }
        }))
        lastSend = new Date()
    }

    const handleKeyPress = event => {
        if(!event) return

        const keyCode = event.keyCode || event.which

        if(keyCode === 13 && !loading) {
            sendMessage(formMessage, "MESSAGE")
            return false
        } else if(!loading) {
            if(!lastSend) {
                sendTyping()
            }
            else if(new Date().getTime() - lastSend.getTime() >= typingDurationSafety) {
                sendTyping()
            }
        }
    }

    const _renderMessages = _ => {
        if(loading) {
            return <><h4>Loading and decrypting messages...</h4><CircularProgress size = {23} /></>
        }
        else return currentChannel.messages.map((e, index) => {
            let data = e.Encrypted

            if(typeof data === "string")
                data = JSON.parse(e.Encrypted)

            let last = false

            if(index > 0) {
                last = currentChannel.messages[index - 1]

                if(typeof last.Encrypted === "string")
                    last.Encrypted = JSON.parse(currentChannel.messages[index - 1].Encrypted)
            }

            let isLast = true

            if(index < currentChannel.messages.length - 1) {
                let next = currentChannel.messages[index + 1]

                let parsed = next.Encrypted

                if(typeof parsed === "string")
                    parsed = JSON.parse(parsed)

                if(parsed.sender === data.sender) {
                    isLast = false
                }
            }

            return (
                <Message 
                    key = {e._id} 
                    data = {e} 
                    parsed = {data} 
                    myself = {props.user.username} 
                    last = {last} 
                    isLast = {isLast}
                    myColor = {theme.palette.primary.main} 
                    myText = {theme.palette.primary.contrastText}
                    otherColor = {theme.palette.secondary.main}
                    otherText = {theme.palette.secondary.contrastText}
                    backgroundText = {theme.palette.text.primary}
                    backgroundColor = {theme.palette.background.paper}
                    fileDownloaded = {fileDownloaded}
                />
            )
        })
    }

    const fileChanged = _ => {
        
    }

    const fileDownloaded = metadata => {
        
    }

    const handleLongPress = _ => {
        setCancelNextPress(true)
        setOptionsMenu(true)

        setAnchorEl(buttonRef.current)
    }

    const handleRegularPress = _ => {
        if(cancelNextPress) {
            setCancelNextPress(false)
            return
        }

        sendMessage(formMessage, "MESSAGE")
        setOptionsMenu(false)
        inputRef.current.focus()
    }

    return (
        <div style = {{ flex: 1, display: "flex", flexDirection: "column", height: "100%", backgroundColor: theme.palette.background.default }}>
            <Menu
                id = "simple-menu"
                anchorEl = {anchorEl}
                keepMounted
                open = {Boolean(anchorEl)}
                onClose = {_ => setAnchorEl(null)}
            >
                <MenuItem onClick={_ => {}}>
                    <FiPaperclip size = {23} style = {{ marginRight: 5 }} color = "primary" />
                    Send File
                </MenuItem>
            </Menu>
            <div style = {{ flex: "1 1 auto", display: "flex", flexDirection: "column", overflowY: "auto" }} id = "message-scroll-here">
                { _renderMessages() }
                { typers.map(typer => <p key = {typer.WhoTypingID}>{typer.WhoTypingUsername} is typing...</p>) }
            </div>
            <Divider />
            <div style = {{ display: "flex", flexDirection: "column", justifyContent: "center", backgroundColor: theme.palette.background.default, marginTop: 5 }}>
                <div style = {{ display: "flex", alignItems: "center", backgroundColor: theme.palette.background.default, margin: "5px" }}>
                    <TextField 
                        style = {{ flex: 1, padding: 0, borderRadius: "4px 0 0 4px" }} 
                        label = {"Message " + currentChannel.Name}
                        variant = "outlined" 
                        value = {formMessage} 
                        onChange = {event => setMessage(event.target.value)} 
                        onKeyDown = {handleKeyPress}
                        inputRef={inputRef}
                    />
                    <Button 
                        style = {{ height: 56, borderRadius: "0 4px 4px 0" }} 
                        color = "primary" variant = "contained" disabled = {sending} 
                        { ...sendButtonLongPress }
                        onClick = {handleRegularPress}
                        onBlur = {_ => setOptionsMenu(false)}
                        ref = {buttonRef}
                    >
                        Send
                    </Button>
                </div>
                {/*<h6 style = {{ margin: 0, marginLeft: 15, color: theme.palette.text.primary, minHeight: 15 }}>{typingText}</h6>*/}
            </div>
        </div>
    )
}

const mapStateToProps = state => {
    return {
        user: state.user,
        channels: state.channels,
    }
}

export default connect(mapStateToProps, { sendData })(withTheme(ChannelView))