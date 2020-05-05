import React, { useEffect, useState } from 'react';

import { Provider } from "react-redux"
import { Router, Route, Switch } from "react-router"

import { authReq } from "./axios-auth"

import { MuiThemeProvider, useTheme, CircularProgress } from "@material-ui/core"

import store from "./store"

import Header from "./components/Header"

import Login from "./components/Login"
import Register from "./components/Register"
import Messages from "./components/Container"

import { createBrowserHistory } from "history"

const history = createBrowserHistory()

function App() {
    const theme = useTheme()
    const [checkingExist, setCheckingExist] = useState(true)

    useEffect(_ => {
        const storage = localStorage.getItem("token")

        if(storage && storage.length > 10) {
            checkExist()
        }
        else {
            history.push("/register")
            setCheckingExist(false)
        }
    }, [])

    const checkExist = async _ => {
        let res;

        try {
            res = await authReq(localStorage.getItem("token")).get("https://servicetechlink.com/get/session")

            setCheckingExist(false)
            history.push("/messages")

            console.log("succeed", res)
        }
        catch(e) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")

            setCheckingExist(false)
            
            history.push("/register")
        }
    }

    if(checkingExist) {
        return (
            <div style = {{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
            </div>
        )
    }

    return (
        <Provider store = {store}>
            <Router history = {history}>
                <MuiThemeProvider theme = {theme}>
                    <div style = {{ height: "100vh", display: "flex", flexDirection: "column" }}>
                        { <Header /> }
                        <div style = {{ display: "flex", flex: 1, height: "90%" }}>
                            <Switch>
                                {/*<Route exact path = "/login" component = {Login} />*/}
                                <Route exact path = "/" component = {Register} />

                                <Route exact path = "/register" component = {Register} />

                                <Route exact path = "/messages" component = {Messages} />
                            </Switch>
                        </div>
                    </div>
                </MuiThemeProvider>
            </Router>
        </Provider>
    )
}

export default App
