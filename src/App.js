import React, { useEffect } from 'react';

import { Provider } from "react-redux"
import { Router, Route, Switch } from "react-router"

import store from "./store"

import Login from "./components/Login"
import Register from "./components/Register"
import Messages from "./components/Container"

import { createBrowserHistory } from "history"

const history = createBrowserHistory()

function App() {
    useEffect(_ => {
        const storage = localStorage.getItem("token")
        const keys = localStorage.getItem("generatedKeys")

        if(storage && storage.length > 10) {
            history.push("/messages")
        }
    }, [])

    return (
        <Provider store = {store}>
            <Router history = {history}>
                <Switch>
                    <Route exact path = "/" component = {Login} />
                    <Route exact path = "/login" component = {Login} />

                    <Route exact path = "/register" component = {Register} />

                    <Route exact path = "/messages" component = {Messages} />
                </Switch>
            </Router>
        </Provider>
    )
}

export default App
