import React, { useState, useEffect } from "react"

import { connect } from "react-redux"
import { setUser } from "../actions/userActions"

import { withRouter } from 'react-router'

import { withTheme, useTheme, makeStyles, styled } from "@material-ui/core"

import { TextField, Button, CircularProgress, LinearProgress } from "@material-ui/core"

import ConfirmComp from "./ConfirmComp"

import axios from "axios"

import forge from "node-forge"
const RSA = forge.pki.rsa

let interval = null

const useStyles = makeStyles({
    container: ({ theme }) => ({
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        minHeight: 450,

        backgroundColor: theme.palette.background.default,
    }),
    form: {
        display: "flex",
        flexDirection: "column",
        width: "80%",
        maxWidth: 550,
    },
    input: {
        margin: "10px 0"
    },
    primaryText: ({ theme }) => ({
        color: theme.palette.text.primary
    })
})

const Register = props => {
    const theme = useTheme()
    const styles = useStyles({ theme })

    const [generatingKeys, setGenerating] = useState(false)
    const [isOpen, setOpen] = useState(false)
    const [form, setForm] = useState({ username: "", password: "", confirm: "" })
    const [status, setStatus] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [keys, setKeys] = useState({ publicKey: "", privateKey: "" })

    const [percentage, setPercentage] = useState(0)

    useEffect(_ => {
        setKeys({ publicKey: "", privateKey: "" })

        return _ => {
            clearInterval(interval)
            interval = null
        }
    }, [])

    const handleChange = event => {
        const { name, value } = event.target
        setForm({ ...form, [name]: value.replace(" ", "") })
    }

    const handleClick = event => {
        event.preventDefault()

        setError("")

        if (form.username === "") {
            setError("Username can't be blank")
            return
        }

        if (form.password === "") {
            setError("Password can't be blank")
            return
        }

        if (form.confirm !== form.password) {
            setError("Passwords dont match")
            return
        }

        setOpen(true)
    }

    const handleProceed = _ => {
        setOpen(false)
        handleSubmit()
    }

    const handleCancel = _ => {
        setOpen(false)
    }

    const handleSubmit = _ => {
        setStatus("Generating RSA keypair locally...")
        setGenerating(true)

        const storage = localStorage.getItem("generatedKeys")

        if(!storage || storage.length < 10) {
            RSA.generateKeyPair({ bits: 4096, workers: -1 }, function(err, keypair) {
                const privateK = forge.pki.privateKeyToPem(keypair.privateKey)
                const publicK = forge.pki.publicKeyToPem(keypair.publicKey)

                localStorage.setItem("generatedKeys", JSON.stringify({ privateKey: privateK, publicKey: publicK }))

                setGenerating(false)

                handleSignup(publicK, privateK)
            })
        }
        else {
            const keypair = JSON.parse(localStorage.getItem("generatedKeys"))
            const publicK = keypair.publicKey
            const privateK = keypair.privateKey

            setGenerating(false)

            handleSignup(publicK, privateK)
        }
    }

    const initLoadingInterval = _ => {
        const startTime = new Date().getTime()
        let endTime = new Date()

        endTime.setSeconds(endTime.getSeconds() + 7)
        endTime = endTime.getTime()

        interval = setInterval(_ => {
            const newTime = new Date().getTime() - startTime

            const percentage = newTime * 100 / (endTime - startTime)

            setPercentage(percentage)
        }, 20)
    }

    const sendSignup = (publicKey, privateKey) => {
        axios.post("https://servicetechlink.com/register", JSON.stringify({
            username: form.username,
            password: form.password,
            publicKey,
        }), {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        })
            .then(data => handleSuccess(data, privateKey))
            .catch(handleError)
    }

    const handleSignup = (publicKey, privateKey) => {
        setLoading(true)
        setError("")
        setStatus("")

        initLoadingInterval()

        sendSignup(publicKey, privateKey)
    }

    const handleSuccess = (data, privateKey) => {
        clearInterval(interval)
        props.setUser(data.data.user, data.data.token, form.password)
        localStorage.setItem("user", JSON.stringify(data.data.user))
        localStorage.setItem("token", data.data.token)

        props.history.push("/messages")
    }

    const handleError = err => {
        setLoading(false)
        clearInterval(interval)
        setOpen(false)
        if (err.response) {
            setError(err.response.data.message)
        }
        else if ((err + "").includes("ECONNREFUSED")) {
            setError("You dont have an internet connection or the server is down")
        }
    }

    const _renderGeneratingBar = _ => {
        return generatingKeys && <LinearProgress color="primary" />
    }

    const _renderProgress = _ => {
        return loading && <LinearProgress variant="determinate" value={Math.min(parseInt(percentage), 100)} style={{ marginTop: 5 }} />
    }

    const _renderStatusText = _ => {
        return status && !loading && <h5 className={styles.primaryText}>{status}</h5>
    }

    const _renderSubmittingText = _ => {
        return loading && <h5 className={styles.primaryText}>Note: Registering and login can take a long time</h5>
    }

    const _renderErrorText = _ => {
        return <span style={{ color: "red" }}>{error}</span>
    }

    return (
        <>
            <ConfirmComp
                title="Warning!"
                text={["Registering on this website will only create a temporary account, switch to the desktop or mobile app to create a permanent account",
                    "Registering may take a long time on slower computers, and the program may become unresponsive for a while",
                    "Registering on this website may result in the loss or theft of your private key, try switching to the desktop app"]}
                open={isOpen}
                onCancel={handleCancel}
                onProceed={handleProceed}
            />
            <div className={styles.container}>
                <h1 className={styles.primaryText}>Temporary Account</h1>
                <form className={styles.form} onSubmit={handleClick}>
                    <TextField className={styles.input} type="text" name="username" value={form.username} onChange={handleChange} label="Username" />
                    <TextField className={styles.input} type="password" name="password" value={form.password} onChange={handleChange} label="Password" />
                    <TextField className={styles.input} type="password" name="confirm" value={form.confirm} onChange={handleChange} label="Confirm Password" />

                    <RegisterButton variant="contained" color="primary" type="submit" disabled={loading || generatingKeys}>
                        {loading ? <CircularProgress size={17} /> : "Sign up"}
                    </RegisterButton>

                    {_renderGeneratingBar()}
                    {_renderProgress()}
                    {_renderStatusText()}
                    {_renderSubmittingText()}
                    {_renderErrorText()}

                    {/*<h5 className={styles.primaryText}>
                        Already have an account?
                        <LoginLink variant="text" color="primary" onClick={_ => props.history.push("/login")}>
                            Log in!
                        </LoginLink>
                    </h5> */}
                </form>
            </div>
        </>
    )
}

const mapStateToProps = state => {
    return {

    }
}

export default connect(mapStateToProps, { setUser })(withRouter(withTheme(Register)))

const mainContainerStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    minHeight: 450,
    backgroundColor: "white"
}

const formStyle = {
    display: "flex",
    flexDirection: "column",
    width: "80%",
    maxWidth: 550
}


const RegisterButton = styled(Button)({
    height: 36,
    marginTop: 30
})

const LoginLink = styled(Button)({
    fontSize: 12
})

function arrayBufferToBase64(arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer);
    var byteString = '';
    for(var i=0; i < byteArray.byteLength; i++) {
        byteString += String.fromCharCode(byteArray[i]);
    }
    var b64 = window.btoa(byteString);

    return b64;
}

function addNewLines(str) {
    var finalString = '';
    while(str.length > 0) {
        finalString += str.substring(0, 64) + '\n';
        str = str.substring(64);
    }

    return finalString;
}

function toPem(privateKey) {
    var b64 = addNewLines(arrayBufferToBase64(privateKey));
    var pem = "-----BEGIN PRIVATE KEY-----\n" + b64 + "-----END PRIVATE KEY-----";
    
    return pem;
}

function spkiToPEM(keydata){
    var keydataS = arrayBufferToString(keydata);
    var keydataB64 = window.btoa(keydataS);
    var keydataB64Pem = formatAsPem(keydataB64);
    return keydataB64Pem;
}

function arrayBufferToString( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return binary;
}


function formatAsPem(str) {
    var finalString = '-----BEGIN PUBLIC KEY-----\n';

    while(str.length > 0) {
        finalString += str.substring(0, 64) + '\n';
        str = str.substring(64);
    }

    finalString = finalString + "-----END PUBLIC KEY-----";

    return finalString;
}