import React, { useState, useEffect } from 'react'

import { useSelector, useDispatch } from 'react-redux'
import { withTheme, useTheme, makeStyles, CircularProgress } from '@material-ui/core'
import useInterval from '../utility/useInterval'

import { loadChannels } from '../actions/channelActions'
import { openIndexDB } from '../actions/indexDBActions'
import { openWebsocket } from '../actions/socketActions'

import {
  isPushNotificationSupported,
  askNotificationPermission
} from '../push_notifications/pushNotifs'

import SidePanel from './messages/SidePanel'
import ChannelView from './messages/ChannelView'

import CreateChannel from './messages/CreateChannel'

import { authReq } from '../axios-auth'

const useStyles = makeStyles({
  container: {
    height: '100%',
    display: 'flex',
    width: '100%'
  },
  viewContainer: ({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: theme.palette.background.default,
    color: theme.palette.getContrastText(theme.palette.background.default)
  })
})

const public_key = 'BO47up6T_b3tELDFjeBPXNpUZZ45B5wcHgDKnsjI3ykGGW6q2b8qKFDfL4v8XBtDUlqOEKl2pfEcYg8nE9NIUqE'

export const MessageContainer = () => {
  const theme = useTheme()
  const styles = useStyles({ theme })
  const dispatch = useDispatch()

  const { user, channels, connection, websocket, indexdb } = useSelector(state => ({
    user: state.user,
    channels: state.channels,
    connection: state.connection,
    websocket: state.websocket,
    indexdb: state.indexdb
  }))

  const [width, setWidth] = useState(window.innerWidth)

  const [retry, setRetry] = useState(5)

  useEffect(_ => {
    window.addEventListener('resize', updateWindowWidth)

    return _ => {
      window.removeEventListener('resize', updateWindowWidth)
    }
  }, [])

  useEffect(_ => {
    if (isPushNotificationSupported()) {
      askNotificationPermission().then(async consent => {
        console.log(`Notification consent is set to ${consent}`)

        if (consent === 'granted') {
          const reg = await navigator.serviceWorker.register('/serviceWorker.js')

          await navigator.serviceWorker.ready

          console.log('[Service Worker] Registration: ', reg)
          let subscription = await reg.pushManager.getSubscription()

          if (!subscription) {
            console.log('[Web Push] No subscription found generating one...')
            subscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: public_key
            })
          }

          console.log('[Web Push] Subscription: ', subscription)

          const res = await authReq(localStorage.getItem('token'))
            .post('https://securechat-go.herokuapp.com/subscription', { ...(JSON.parse(JSON.stringify(subscription))), type: 'webpush' })

          console.log(res)
        }
      })
        .catch(err => {
          console.error('[Service Worker] Error occured while asking for permissions', err)
        })
    }
  }, [dispatch])

  useInterval(_ => {
    if (retry === 1) {
      dispatch(openWebsocket(user.token))
      setRetry(10)
    } else {
      setRetry(retry - 1)
    }
  }, !websocket.opening && websocket.failed ? 1000 : null)

  useEffect(_ => {
    dispatch(openIndexDB())
  }, [dispatch])

  useEffect(_ => {
    if (user.token && user.token.length > 10 && !websocket.websocket && indexdb.db) {
      dispatch(openWebsocket(user.token))
    }
  }, [connection.websocketConnected, user, user.token, indexdb.db, dispatch, websocket.websocket])

  useEffect(_ => {
    if (connection.websocketConnected && channels.channels.length === 0) {
      dispatch(loadChannels(user))
    }
  }, [connection.serverConnected, connection.websocketConnected, channels.channels.length, dispatch, user])

  const updateWindowWidth = _ => {
    setWidth(window.innerWidth)
  }

  const _renderContent = _ => {
    const loading = channels.LOADING_CHANNELS
    const notIn = !channels.LOADING_CHANNELS && channels.channels.length === 0
    const click = !channels.LOADING_CHANNELS && channels.activeChannel === -1

    if (loading || notIn || click) {
      let message = ''

      if (loading) {
        message = <CircularProgress color='primary' />
      } else if (notIn) {
        return (
          <div className={styles.viewContainer}>
            <div>
              <h1>You are not in any channels!</h1>
              <CreateChannel width={width} />
            </div>
          </div>
        )
      } else if (click && width > 750) {
        message = <h1>Click on a channel</h1>
      } else if (click) {
        return <SidePanel width={width} />
      }
      return (
        <div className={styles.viewContainer}>
          {message}
        </div>
      )
    } else {
      return <ChannelView />
    }
  }

  const _renderPage = _ => {
    if (websocket.opening || channels.LOADING_CHANNELS || websocket.failed || indexdb.opening || indexdb.failed) {
      let message = ''

      if (indexdb.opening) message = 'Connecting IndexDB'
      else if (indexdb.failed) message = 'IndexDB failed, did you deny the permission?'
      else if (websocket.opening) message = 'Connecting'
      else if (channels.LOADING_CHANNELS) {
        if (channels.DECRYPTING) {
          message = 'Decrypting messages'
        } else message = 'Fetching messages'
      } else if (websocket.failed) message = 'Failed to connect'

      return (
        <div className={styles.viewContainer}>
          <div>
            {!websocket.failed && <CircularProgress />}
            <h1>{message}</h1>
            {!websocket.opening && websocket.failed && <h3>Trying again in {retry}</h3>}
          </div>
        </div>
      )
    }
    return (
      <div className={styles.container} style={{ flexDirection: width <= 750 ? 'column' : '' }}>
        {width > 750 && <SidePanel width={width} />}
        {_renderContent()}
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ flexDirection: width <= 750 ? 'column' : '' }}>
      {_renderPage()}
    </div>
  )
}

export default withTheme(MessageContainer)
