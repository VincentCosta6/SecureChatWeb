import React, { useState, useEffect } from "react"

import { useSelector } from "react-redux"
import { withTheme, useTheme } from "@material-ui/core"

import axios, { authReq } from "../axios-auth"
import { buf2hex, str2ab } from "../utility/conversions"

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

const pemHeader = "-----BEGIN PUBLIC KEY-----"
const pemFooter = "-----END PUBLIC KEY-----"

const AddPerson = props => {
    const theme = useTheme()

    const { user, channels } = useSelector(state => ({
        user: state.user,
        channels: state.channels
    }))

    const [searchUser, setSearchUser] = useState("")

    const [foundUsers, setFoundUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])
    
    const [searchLoading, setSearchLoading] = useState(false)
    const [requestLoading, setRequestLoading] = useState(false)

    const[errorText, setErrorText] = useState("")

    const addUsers = async _ => {
        if(selectedUsers.length === 0) {
            setErrorText("You must add at least 1 user to this channel")
            return
        }

        const currentChannel = channels.channels[channels.activeChannel]

        setErrorText("")
        setRequestLoading(true)

        const privateKeys = {}
        const userMap = {}

        await Promise.all(selectedUsers.map(async user => {
            const pemContents = user.publicKey.substring(pemHeader.length + 1, user.publicKey.length - pemFooter.length - 1);

            const userKey = await crypto.subtle.importKey("spki", str2ab(atob(pemContents)), { name: "RSA-OAEP", hash: "SHA-256" }, true, ["wrapKey"])
            const userWrappedKey = await crypto.subtle.wrapKey("raw", currentChannel.AESKey, userKey, "RSA-OAEP")

            privateKeys[user._id] = buf2hex(userWrappedKey)
            userMap[user._id]     = user.username
        }))

        const addUserForm = {
            channelID: currentChannel._id,
            privateKeys: privateKeys,
            userMap
        }

        authReq(user.token).post("https://servicetechlink.com/channel/add/user", JSON.stringify(addUserForm))
            .then(_data => {
                setRequestLoading(false)
                props.handleClose()
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
        if(searchUser !== "") {
            setSearchLoading(true)
            axios.get("https://servicetechlink.com/like/users/" + searchUser)
                .then(data => {
                    const set = new Set()

                    for(let user of selectedUsers) 
                        set.add(user.username)

                    setFoundUsers(data.data.results.filter(userList => userList.username !== user.username && !set.has(userList.username)))
                    setSearchLoading(false)
                })
                .catch(_err => { })
        }
    }, [searchUser])

    return (
        <Dialog
            open={props.open}
            onClose={props.handleClose}
            aria-labelledby="form-dialog-title"
            fullWidth
        >
            <DialogTitle id="form-dialog-title">Add people</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Add people to your channel
                </DialogContentText>
                <Autocomplete
                    style = {{ margin: "10px 0px" }}
                    id="username"
                    label="Username"
                    type="text"
                    variant="outlined"
                    getOptionSelected={(option, value) => option.username === value.username}
                    onChange={event => {
                        const text = event.target.textContent
                        const user = foundUsers.find(user => user.username === text)

                        if(user) 
                            handleAddUser(user)
                    }}
                    getOptionLabel = {option => option.username || ""}
                    options = {foundUsers}
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
                <h3 style = {{ margin: "10px 0px 0px 0px" }}>{selectedUsers.length} user{selectedUsers.length === 1 ? "" :"s"}:</h3>
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
                <h3 style = {{ color: "red" }}>{errorText}</h3>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.handleClose} color="primary">Cancel</Button>
                {
                    requestLoading ? 
                        <CircularProgress size={17} /> :
                        <Button disabled = {selectedUsers.length === 0} onClick={addUsers} variant="contained" color="primary">Add ({selectedUsers.length})</Button>
                }
            </DialogActions>
        </Dialog>
    )
}

export default withTheme(AddPerson)