import React from 'react';

import { Provider } from "react-redux"
import { Router, Route, Switch } from "react-router"

import store from "./store"

import Login from "./components/Login"
import Register from "./components/Register"

import { createBrowserHistory } from "history"

const history = createBrowserHistory()

function App() {
    return (
        <Provider store = {store}>
            <Router history = {history}>
                <Switch>
                    <Route exact path = "/" component = {Login} />
                    <Route exact path = "/login" component = {Login} />

                    <Route exact path = "/register" component = {Register} />
                </Switch>
            </Router>
        </Provider>
    )
}

export default App
