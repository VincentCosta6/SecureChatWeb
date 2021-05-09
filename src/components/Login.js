import React, { useState, useEffect } from 'react'

import { withRouter } from 'react-router'

import { withTheme, useTheme, TextField, Button, LinearProgress, CircularProgress } from '@material-ui/core'

import { connect } from 'react-redux'
import { setUser } from '../actions/userActions'

import axios from 'axios'
import { format } from 'crypto-js'

let interval = null

const Login = props => {
  const theme = useTheme()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [percentage, setPercentage] = useState(0)

  useEffect(_ => {
    if (props.user && props.user.token && props.user.token.length > 10) {
      props.history.push('/messages')
    }

    return _ => {
      clearInterval(interval)
      interval = null
    }
  }, [props.history, props.user])

  const handleUsernameChange = event => { setUsername(event.target.value.replace(' ', '')) }
  const handlePasswordChange = event => { setPassword(event.target.value.replace(' ', '')) }

  const handleSubmit = event => {
    event.preventDefault()

    setPercentage(0)

    if (format.username === '') {
      setError('Username is empty')
      return
    }

    if (format.password === '') {
      setError('Password is empty')
      return
    }

    setLoading(false)
    const startTime = new Date().getTime()
    let endTime = new Date()

    endTime.setSeconds(endTime.getSeconds() + 7)
    endTime = endTime.getTime()

    interval = setInterval(_ => {
      const newTime = new Date().getTime() - startTime

      const percentage = newTime * 100 / (endTime - startTime)

      setPercentage(percentage)
    }, 20)
    setError('')

    axios.post(`https://${''}/login`, JSON.stringify({ username, password }), {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    })
      .then(res => {
        clearInterval(interval)
        props.setUser(res.data.user, res.data.token, password)
        props.history.push('/messages')
      })
  }

  const _renderProgress = _ => {
    if (loading) {
      return <LinearProgress
        variant='determinate'
        value={Math.min(parseInt(percentage), 100)}
        style={{ marginTop: 5 }}
             />
    }
  }

  return (
    <div style={{ ...mainContainerStyle, backgroundColor: theme.palette.background.default }}>
      <h2 style={{ color: theme.palette.text.primary }}>Login</h2>
      <form style={formStyle} onSubmit={handleSubmit}>
        <TextField type='text' name='username' value={username} onChange={handleUsernameChange} label='Username' />
        <TextField style={{ marginTop: 25, marginBottom: 40 }} type='password' name='password' value={password} onChange={handlePasswordChange} label='Password' />

        <Button variant='contained' color='primary' type='submit' style={{ height: 36 }} disabled={loading}>
          {loading ? <CircularProgress size={17} /> : 'Log in'}
        </Button>

        {_renderProgress()}

        {loading && <h5 style={{ color: theme.palette.text.primary }}>Note: login can take a long time, this is because we are hashing your password with 17 rounds</h5>}

        <span style={{ color: 'red' }}>{error}</span>

        <h5 style={{ color: theme.palette.text.primary }}>Don't have an account? <Button style={{ fontSize: 12 }} variant='text' color='primary' onClick={_ => props.history.push('/register')}>Register</Button></h5>
      </form>
    </div>
  )
}

const mapStateToProps = state => {
  return {
    user: state.user
  }
}

export default connect(mapStateToProps, { setUser })(withRouter(withTheme(Login)))

const mainContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  minHeight: 450,
  backgroundColor: 'white'
}

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  width: '80%',
  maxWidth: 550
}
