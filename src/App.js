import React, { useEffect, useState } from 'react'

import { Provider } from 'react-redux'
import { Router } from 'react-router'

import { authReq } from './axios-auth'

import { CircularProgress } from '@material-ui/core'

import store from './store'

import { createBrowserHistory } from 'history'

import Routes from './Routes'

const history = createBrowserHistory()

function App (props) {
  const [checkingExist, setCheckingExist] = useState(true)

  useEffect(_ => {
    const storage = localStorage.getItem('token')

    if (storage && storage.length > 10) {
      checkExist()
    } else {
      history.push('/register')
      setCheckingExist(false)
    }
  }, [])

  const checkExist = async _ => {
    let res

    try {
      res = await authReq(localStorage.getItem('token')).get('https://securechat-go.herokuapp.com/get/session')

      setCheckingExist(false)
      history.push('/messages')

      console.log('succeed', res)
    } catch (e) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      setCheckingExist(false)

      history.push('/register')
    }
  }

  if (checkingExist) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </div>
    )
  }

  return (
    <Provider store={store}>
      <Router history={history}>
        <Routes />
      </Router>
    </Provider>
  )
}

export default App
