import React, { useState, useEffect } from "react"

import { connect } from "react-redux"
import { withTheme, useTheme } from "@material-ui/core"

import axios, { authReq } from "../axios-auth"
import { randomBytes } from "crypto"
import { dbQueryPromise } from "../utility/indexDBWrappers"

import forge from "node-forge"

import { FiPlus, FiMinusCircle } from "react-icons/fi"
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
import { Autocomplete } from "@material-ui/lab/"

const RSA = forge.pki.rsa

const CreateChannel = props => {
    const theme = useTheme()

    const [formOpen, setOpen] = useState(false)

    const [channelName, setChannelName] = useState("")
    const [searchUser, setSearchUser] = useState("")

    const [foundUsers, setFoundUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])

    const [searchLoading, setSearchLoading] = useState(false)
    const [requestLoading, setRequestLoading] = useState(false)

    const [errorText, setErrorText] = useState("")

    const handleClickOpen = _ => {
        setOpen(true)
        setChannelName("")
    }

    const handleClose = _ => {
        setOpen(false)
    }

    const createChannel = async _ => {
        if (channelName === "") {
            setErrorText("You must give the channel a name")
            return
        }

        if (selectedUsers.length === 0) {
            setErrorText("You must add at least 1 user to this channel")
            return
        }

        setErrorText("")
        setRequestLoading(true)

        function buf2hex(buffer) { // buffer is an ArrayBuffer
            return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
        }
        function str2ab(str) {
            const buf = new ArrayBuffer(str.length);
            const bufView = new Uint8Array(buf);
            for (let i = 0, strLen = str.length; i < strLen; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            return buf;
        }

        const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])

        const exported = await crypto.subtle.exportKey("raw", key)

        console.log(buf2hex(exported))

        const keyStore = props.indexdb.db.transaction(["keystore"]).objectStore("keystore")
        const request = keyStore.get(props.user.username)

        const result = await dbQueryPromise(request)

        const value = result.target.result

        const myWrappedKey = await crypto.subtle.wrapKey("raw", key, value.keys.publicKey, "RSA-OAEP")

        console.log(buf2hex(myWrappedKey))

        const privateKeys = {}

        privateKeys[props.user._id] = buf2hex(myWrappedKey)

        await Promise.all(selectedUsers.map(async user => {
            const pemHeader = "-----BEGIN PUBLIC KEY-----";
            const pemFooter = "-----END PUBLIC KEY-----";
            const pemContents = user.publicKey.substring(pemHeader.length + 1, user.publicKey.length - pemFooter.length - 1);

            const userKey = await crypto.subtle.importKey("spki", str2ab(atob(pemContents)), { name: "RSA-OAEP", hash: "SHA-256" }, true, ["wrapKey"])

            const userWrappedKey = await crypto.subtle.wrapKey("raw", key, userKey, "RSA-OAEP")

            privateKeys[user._id] = buf2hex(userWrappedKey)
        }))

        console.log(privateKeys)

        const channelObj = {
            name: channelName,
            privateKeys
        }

        authReq(localStorage.getItem("token")).post("https://servicetechlink.com/channel/create", JSON.stringify(channelObj))
            .then(_data => {
                setRequestLoading(false)
                setOpen(false)
            })
            .catch(err => {
                console.error(err)
                setErrorText("An unknown error occured")
                setRequestLoading(false)
            })
    }

    const handleRemoveUser = userIndex => {
        setSelectedUsers(selectedUsers.filter((_user, index) => index !== userIndex))
    }

    const handleAddUser = user => {
        setSelectedUsers([...selectedUsers, user])
        setFoundUsers([])
        setSearchUser("")
    }

    useEffect(_ => {
        if (searchUser !== "") {
            setSearchLoading(true)
            axios.get("https://servicetechlink.com/like/users/" + searchUser)
                .then(data => {
                    const set = new Set()

                    for (let user of selectedUsers)
                        set.add(user.username)

                    setFoundUsers(data.data.results.filter(user => user.username !== props.user.username && !set.has(user.username)))
                    setSearchLoading(false)
                })
                .catch(_err => { })
        }
    }, [searchUser])

    const percentage = props.width && props.width <= 750 ? "90%" : "100%"

    return (
        <>
            <Divider />
            <div style = {{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: percentage, marginTop: 5, marginBottom: 5 }} onClick={handleClickOpen} color="primary" variant="contained"><FiPlus color={theme.palette.primary.contrastText} size={23} />Channel</Button>
            </div>
            <Dialog
                open={formOpen}
                onClose={handleClose}
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Create Channel</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Create a channel and add unlimited users
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Channel Name"
                        type="text"
                        fullWidth
                        value={channelName}
                        onChange={event => setChannelName(event.target.value)}
                    />
                    <Autocomplete
                        style={{ margin: "10px 0px" }}
                        id="username"
                        label="Username"
                        type="text"
                        variant="outlined"
                        getOptionSelected={(option, value) => option.username === value.username}
                        onChange={event => {
                            const text = event.target.textContent
                            const user = foundUsers.find(user => user.username === text)

                            if (user)
                                handleAddUser(user)
                        }}
                        getOptionLabel={option => option.username || ""}
                        options={foundUsers}
                        renderInput={params => (
                            <TextField
                                {...params}
                                label="Username"
                                fullWidth
                                variant="outlined"
                                onChange={event => setSearchUser(event.target.value)}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <React.Fragment>
                                            {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </React.Fragment>
                                    ),
                                }}
                            />
                        )}
                    />
                    <h3 style={{ margin: "10px 0px 0px 0px" }}>{selectedUsers.length} user{selectedUsers.length === 1 ? "" : "s"}:</h3>
                    <List>
                        {
                            selectedUsers.reverse().slice(0, 50).map((user, index) =>
                                <ListItem key={user._id}>
                                    {user.username}
                                    <FiMinusCircle color="red" onClick={_ => handleRemoveUser(index)} style={{ cursor: "pointer", margin: "0px 5px" }} />
                                </ListItem>
                            )
                        }
                    </List>
                    <h3 style={{ color: "red" }}>{errorText}</h3>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">Cancel</Button>
                    {
                        requestLoading ?
                            <CircularProgress size={17} /> :
                            <Button onClick={createChannel} variant="contained" color="primary">Create</Button>
                    }
                </DialogActions>
            </Dialog>
        </>
    )
}

const mapStateToProps = state => {
    return {
        user: state.user,
        indexdb: state.indexdb
    }
}

export default connect(mapStateToProps, {})(withTheme(CreateChannel))

function removeLines(str) {
    return str.replace("\n", "");
}

function base64ToArrayBuffer(b64) {
    var byteString = window.atob(b64);
    var byteArray = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
    }

    return byteArray;
}

function pemToArrayBuffer(pem) {
    var b64Lines = removeLines(pem);
    var b64Prefix = b64Lines.replace('-----BEGIN PUBLIC KEY-----', '');
    var b64Final = b64Prefix.replace('-----END PUBLIC KEY-----', '');

    return base64ToArrayBuffer(b64Final);
}