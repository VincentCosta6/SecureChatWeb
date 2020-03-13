import React, { useState } from "react"

import { Redirect } from "react-router"

export default props => {
    const [redirect, setRedirect] = useState("")

    const handleRedirect = _ => {
        setRedirect("/register")
    }

    const _renderRedirect = _ => {
        if(redirect !== "") {
            return <Redirect to = "/register" />
        }
        
        return <button onClick = {handleRedirect}>Go to register</button>
    }

    return (
        <>
            <h1>Login</h1>
            { _renderRedirect() }
        </>
    )
}