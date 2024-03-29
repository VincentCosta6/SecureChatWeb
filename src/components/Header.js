import React, { useEffect, useState } from 'react'

import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import {
  withTheme, useTheme,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles
} from '@material-ui/core'

import { logout } from '../actions/userActions'
import { setServerStatus } from '../actions/connectionActions'
import { closeWebsocket } from '../actions/socketActions'
import { clearData } from '../actions/channelActions'

import axios from 'axios'

import SidePanel from './messages/SidePanel'
import CallView from './CallView'

import {
  FaServer,
  FaBolt,
  FaComments,
  FaLock,
  FaFileAlt,
  FaCog,
  FaSignOutAlt,
  FaBars
} from 'react-icons/fa'

const interval = null

const useStyles = makeStyles({
  list: {
    width: 250
  },
  fullList: {
    width: 'auto'
  }
})

const Header = props => {
  const theme = useTheme()
  const classes = useStyles()

  const [drawerOpen, setDrawer] = useState(false)

  const [width, setWidth] = useState(window.innerWidth)

  useEffect(_ => {
    window.addEventListener('resize', updateWindowWidth)

    return _ => {
      window.removeEventListener('resize', updateWindowWidth)
    }
  }, [])

  const updateWindowWidth = _ => {
    setWidth(window.innerWidth)
  }

  const sidePanel = _ => {
    const isActiveMessages = props.history.location.pathname === '/messages'
    const isActiveSettings = props.history.location.pathname === '/settings'

    const getActiveBackground = isActive => {
      return isActive ? theme.palette.primary.main : ''
    }

    const getActiveColor = isActive => {
      return isActive ? theme.palette.primary.contrastText : ''
    }

    const _renderChannelList = _ => {
      if (width <= 750 && isActiveMessages) {
        return (
          <>
            <h3 style={{ marginLeft: 15, marginBottom: 10 }}>Channels</h3>
            <SidePanel width={width} setDrawer={setDrawer} />

            <Divider />
            <Divider />

            <h3 style={{ marginLeft: 15 }}>Menu</h3>
          </>
        )
      }
    }

    const _renderMenu = _ => {
      return (
        <>
          {_renderChannelList()}
          <List>
            <ListItem
              button={!isActiveMessages}
              style={{ backgroundColor: getActiveBackground(isActiveMessages) }}
              onClick={_ => props.history.push('/messages')}
              disabled={props.user.privateKey === 'IMPORT'}
            >
              <ListItemIcon><FaComments size={23} color={getActiveColor(isActiveMessages)} /></ListItemIcon>
              <ListItemText primary='Messages' style={{ color: getActiveColor(isActiveMessages), fontSize: '1.0rem' }} />
            </ListItem>
            <ListItem button disabled>
              <ListItemIcon><FaLock size={23} /></ListItemIcon>
              <ListItemText primary='Passwords' />
            </ListItem>
            <ListItem button disabled>
              <ListItemIcon><FaFileAlt size={23} /></ListItemIcon>
              <ListItemText primary='Notes' />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem
              button={!isActiveSettings}
              style={{ backgroundColor: getActiveBackground(isActiveSettings) }}
              onClick={_ => props.history.push('/settings')}
              disabled={props.user.privateKey === 'IMPORT'}
            >
              <ListItemIcon><FaCog size={23} color={getActiveColor(isActiveSettings)} /></ListItemIcon>
              <ListItemText primary='Settings' style={{ color: getActiveColor(isActiveSettings) }} />
            </ListItem>

            <ListItem button onClick={_ => handleLogout()}>
              <ListItemIcon><FaSignOutAlt size={23} /></ListItemIcon>
              <ListItemText primary='Delete Account' />
            </ListItem>
          </List>
        </>
      )
    }

    return (
      <div
        className={classes.list}
        role='presentation'
      >
        <h2 style={{ paddingLeft: 16 }}>{props.user.username}</h2>
        {_renderMenu()}
      </div>
    )
  }

  const handleLogout = _ => {
    setDrawer(false)
    props.logout()
    props.closeWebsocket()
    props.clearData()
    localStorage.clear()
    props.history.push('/')
  }

  const _renderMenu = _ => {
    if (props.user.token && props.user.token.length > 10) {
      return <FaBars size={23} onClick={_ => setDrawer(true)} style={{ cursor: 'pointer', marginLeft: 15, color: theme.palette.text.primary }} />
    }
  }

  if (!props.connection.websocketConnected || !props.channels.CHANNELS_LOADED) {
    return <></>
  }

  const _renderChannelName = _ => {
    const currentChannel = props.channels.channels[props.channels.activeChannel]

    if (currentChannel && Object.keys(currentChannel.privateKeys).length === 2) {
      const otherUsernames = Object.keys(currentChannel.userMap).filter(userID => currentChannel.userMap[userID] !== props.user.username)
      return <h1 style={{ margin: '0 15px', color: theme.palette.text.primary, fontSize: '1.5rem' }}>{currentChannel.userMap[otherUsernames]}</h1>
    }
    return <h1 style={{ margin: '0 15px', color: theme.palette.text.primary, fontSize: '1.5rem' }}>{props.channelName || 'Channels'}</h1>
  }

  return (
    <div style={{ ...containerStyle, backgroundColor: theme.palette.background.paper, boxShadow: `0px 0px 6px 1px ${theme.palette.background.default}`, position: 'sticky', top: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', width: 200, minWidth: 200 }}>
        {_renderMenu()}
        {_renderChannelName()}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Drawer open={drawerOpen} onClose={_ => setDrawer(false)}>
          {sidePanel()}
        </Drawer>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CallView />
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = state => {
  let channelName = ''

  if (state.channels.activeChannel !== -1) {
    channelName = state.channels.channels[state.channels.activeChannel].Name
  }

  return {
    user: state.user,
    connection: state.connection,
    channelName: channelName,
    channels: state.channels,
    websocket: state.websocket,
    theme: state.theme
  }
}

export default connect(mapStateToProps, { logout, setServerStatus, closeWebsocket, clearData })(withRouter(withTheme(Header)))

const containerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  top: 0,
  padding: '5px 5px 5px 0px'
}
