import React, { useState, useEffect } from 'react'

import { connect } from 'react-redux'
import { setUser } from '../actions/userActions'
import { openIndexDB } from '../actions/indexDBActions'

import { withRouter } from 'react-router'

import { withTheme, useTheme, makeStyles, styled, TextField, Button, CircularProgress, LinearProgress } from '@material-ui/core'

import ConfirmComp from './ConfirmComp'

import { dbPromise } from '../utility/indexDBWrappers'
import { spkiToPEM } from '../utility/pemConversion'

import axios from 'axios'

let interval = null

const useStyles = makeStyles({
  container: ({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minHeight: 450,

    backgroundColor: theme.palette.background.default
  }),
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '80%',
    maxWidth: 550
  },
  input: {
    margin: '10px 0'
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
  const [form, setForm] = useState({ username: '', password: '', confirm: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [percentage, setPercentage] = useState(0)

  useEffect(_ => {
    props.openIndexDB()
  }, [props])

  useEffect(_ => {
    return _ => {
      clearInterval(interval)
      interval = null
    }
  }, [])

  const handleChange = event => {
    const { name, value } = event.target
    setForm({ ...form, [name]: value.replace(' ', '') })
  }

  const handleClick = event => {
    event.preventDefault()

    setError('')

    if (form.username === '') {
      setError("Username can't be blank")
      return
    }

    if (form.password === '') {
      setError("Password can't be blank")
      return
    }

    if (form.confirm !== form.password) {
      setError('Passwords dont match')
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
    setStatus('Generating RSA keypair locally...')
    setGenerating(true)

    crypto.subtle.generateKey({
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    }, true, ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'])
      .then(keypair => {
        console.log(props)

        const transaction = props.indexdb.db.transaction(['keystore'], 'readwrite')

        dbPromise(transaction)
          .then(event => {
            console.log(event)
          })
          .catch(err => {
            console.error(err)
          })

        const keystoreObjectStore = transaction.objectStore('keystore')
        keystoreObjectStore.put({ username: form.username, keys: keypair })

        setGenerating(false)

        crypto.subtle.exportKey('spki', keypair.publicKey)
          .then(keydata => {
            handleSignup(JSON.stringify(spkiToPEM(keydata)))
          })
          .catch(err => {
            console.error(err)
          })
      })
      .catch(err => {
        console.error(err)
      })
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

  const sendSignup = publicKey => {
    axios.post('https://securechat-go.herokuapp.com/register', JSON.stringify({
      username: form.username,
      password: form.password,
      publicKey
    }), {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    })
      .then(data => handleSuccess(data))
      .catch(handleError)
  }

  const handleSignup = publicKey => {
    setLoading(true)
    setError('')
    setStatus('')

    initLoadingInterval()

    sendSignup(publicKey)
  }

  const handleSuccess = data => {
    clearInterval(interval)
    props.setUser(data.data.user, data.data.token)

    localStorage.setItem('token', data.data.token)
    localStorage.setItem('user', data.data.user._id)

    setTimeout(_ => props.history.push('/messages'), 50)
  }

  const handleError = err => {
    console.error(err)
    setLoading(false)
    clearInterval(interval)
    setOpen(false)
    if (err.response) {
      setError(err.response.data.message)
    } else if ((err + '').includes('ECONNREFUSED')) {
      setError('You dont have an internet connection or the server is down')
    }
  }

  const _renderGeneratingBar = _ => {
    return generatingKeys && <LinearProgress color='primary' />
  }

  const _renderProgress = _ => {
    return loading && <LinearProgress variant='determinate' value={Math.min(parseInt(percentage), 100)} style={{ marginTop: 5 }} />
  }

  const _renderStatusText = _ => {
    return status && !loading && <h5 className={styles.primaryText}>{status}</h5>
  }

  const _renderSubmittingText = _ => {
    return loading && <h5 className={styles.primaryText}>Note: Registering and login can take a long time</h5>
  }

  const _renderErrorText = _ => {
    return <span style={{ color: 'red' }}>{error}</span>
  }

  return (
    <>
      <ConfirmComp
        title='Warning!'
        text={['This only creates a temporary account',
          'This app needs permissions in order to work']}
        open={isOpen}
        onCancel={handleCancel}
        onProceed={handleProceed}
      />
      <div className={styles.container}>
        <h1 className={styles.primaryText}>SecureChat</h1>
        <h2 className={styles.primaryText}>Temporary Account</h2>
        <form className={styles.form} onSubmit={handleClick}>
          <TextField className={styles.input} type='text' name='username' value={form.username} onChange={handleChange} label='Username' />
          <TextField className={styles.input} type='password' name='password' value={form.password} onChange={handleChange} label='Password' />
          <TextField className={styles.input} type='password' name='confirm' value={form.confirm} onChange={handleChange} label='Confirm Password' />

          <RegisterButton variant='contained' color='primary' type='submit' disabled={loading || generatingKeys}>
            {loading ? <CircularProgress size={17} /> : 'Sign up'}
          </RegisterButton>

          {_renderGeneratingBar()}
          {_renderProgress()}
          {_renderStatusText()}
          {_renderSubmittingText()}
          {_renderErrorText()}

          <h5 className={styles.primaryText}>
                        Want a permanent account? Download the app
            <LoginLink variant='text' color='primary' onClick={_ => window.location = 'https://github.com/Mastermind-Group/SecureChat/releases'}>
                            Desktop
            </LoginLink>
          </h5>
        </form>
      </div>
    </>
  )
}

const mapStateToProps = state => {
  return {
    indexdb: state.indexdb
  }
}

export default connect(mapStateToProps, { setUser, openIndexDB })(withRouter(withTheme(Register)))

const RegisterButton = styled(Button)({
  height: 36,
  marginTop: 30
})

const LoginLink = styled(Button)({
  fontSize: 12
})
