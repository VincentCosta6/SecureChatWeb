import React, { useState, useEffect } from "react"

import { useSelector, connect } from "react-redux"
import { withTheme, useTheme } from "@material-ui/core"

import axios, { authReq } from "../../axios-auth"
import { buf2hex, str2ab } from "../../utility/conversions"
import { dbQueryPromise } from "../../utility/indexDBWrappers"

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

const CreateChannel = props => {
    const theme = useTheme()

    const { user, indexdb } = useSelector(state => ({
        user: state.user,
        indexdb: state.indexdb
    }))

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

        const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])

        const keyStore = indexdb.db.transaction(["keystore"]).objectStore("keystore")
        const request = keyStore.get(user.username)

        const result = await dbQueryPromise(request)
        const value = result.target.result

        const myWrappedKey = await crypto.subtle.wrapKey("raw", key, value.keys.publicKey, "RSA-OAEP")

        const privateKeys = {}
        const userMap = {}

        privateKeys[user._id] = buf2hex(myWrappedKey)
        userMap[user._id]     = user.username

        await Promise.all(selectedUsers.map(async userList => {
            const pemHeader = "-----BEGIN PUBLIC KEY-----";
            const pemFooter = "-----END PUBLIC KEY-----";
            const pemContents = userList.publicKey.substring(pemHeader.length + 1, userList.publicKey.length - pemFooter.length - 1);

            const userKey = await crypto.subtle.importKey("spki", str2ab(atob(pemContents)), { name: "RSA-OAEP", hash: "SHA-256" }, true, ["wrapKey"])

            const userWrappedKey = await crypto.subtle.wrapKey("raw", key, userKey, "RSA-OAEP")

            privateKeys[userList._id] = buf2hex(userWrappedKey)
            userMap[userList._id]     = userList.username
        }))

        const channelObj = {
            name: channelName,
            privateKeys,
            userMap
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

                    for (let userList of selectedUsers)
                        set.add(userList.username)

                    setFoundUsers(data.data.results.filter(userList => userList.username !== user.username && !set.has(userList.username)))
                    setSearchLoading(false)
                })
                .catch(_err => { })
        }
    }, [searchUser])

    const percentage = props.width && props.width <= 750 ? "90%" : "100%"

    return (
        <>
            <div style = {{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: percentage, marginTop: 5, marginBottom: 5 }} onClick={handleClickOpen} color="primary" variant="contained"><FiPlus color={theme.palette.primary.contrastText} size={23} />Channel</Button>
            </div>
            <Dialog
                open={formOpen}
                onClose={handleClose}
                aria-labelledby="form-dialog-title"
                fullScreen
                style = {{ padding: props.width < 750 ? 0 : 50 }}
            >
                <DialogTitle id="form-dialog-title">Create Channel</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Channel Name"
                        type="text"
                        variant = "outlined"
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
                            <Button onClick={createChannel} variant="contained" color="primary" disabled = {channelName === "" || selectedUsers.length === 0}>Create</Button>
                    }
                </DialogActions>
            </Dialog>
        </>
    )
}

export default withTheme(CreateChannel)