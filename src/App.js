import React, { useEffect, useState } from 'react';

import { Provider } from "react-redux"
import { Router, Route, Switch } from "react-router"

import { MuiThemeProvider } from "@material-ui/core"

import store from "./store"

import Header from "./components/Header"

import Login from "./components/Login"
import Register from "./components/Register"
import Messages from "./components/Container"

import { createBrowserHistory } from "history"

const history = createBrowserHistory()

function App() {

    useEffect(_ => {
        const storage = localStorage.getItem("token")

        if(storage && storage.length > 10) {
            history.push("/messages")
        }
        else {
            history.push("/")
        }
    }, [])

    return (
        <Provider store = {store}>
            <Router history = {history}>
                <MuiThemeProvider>
                    <div style = {{ height: "100vh", display: "flex", flexDirection: "column" }}>
                        { <Header /> }
                        <div style = {{ display: "flex", flex: 1, height: "100%" }}>
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
