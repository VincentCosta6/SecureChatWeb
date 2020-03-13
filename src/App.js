import React from 'react';

import { Router, Route, Switch } from "react-router"

import Login from "./components/Login"
import Register from "./components/Register"

import { createBrowserHistory } from "history"

const history = createBrowserHistory()

function App() {
    return (
        <Router history = {history}>
            <Switch>
                <Route exact path = "/" component = {Login} />
                <Route exact path = "/login" component = {Login} />

                <Route exact path = "/register" component = {Register} />
            </Switch>
        </Router>
    )
}

export default App
