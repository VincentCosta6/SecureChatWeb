import React, { useEffect, useState } from 'react'

import { withTheme, useTheme, makeStyles, Card } from '@material-ui/core'

import { cutChars, formatMessageTime } from '../../utility/conversions'

const useStyles = makeStyles({
  container: ({ props, theme }) => ({
    cursor: 'pointer',
    padding: 5,
    margin: 2,
    boxShadow: 'none',
    backgroundColor: props.isCurrent ? theme.palette.primary.main : '',
    color: props.isCurrent ? theme.palette.primary.contrastText : theme.palette.text.primary,
    transition: 'backgroundColor 0.4s ease-in-out',
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText
    }
  }),
  title: ({ props, theme }) => ({
    margin: '0 5px'
  }),
  subtitle: ({ props, theme }) => ({
    margin: '0 0px',
    marginLeft: 10
  })
})

const Channel = props => {
  const theme = useTheme()
  const styles = useStyles({ props, theme })

  const [lastMessage, setLastMessage] = useState(false)

  useEffect(() => {
    if (props.data.messages.length > 0) {
      const lastMessage = props.data.messages[props.data.messages.length - 1]

      const encrypted = JSON.parse(lastMessage.Encrypted)
      const cut = cutChars(15, encrypted.content)

      setLastMessage({
        message: cut,
        sender: encrypted.sender === props.myUsername ? encrypted.sender : 'You',
        time: lastMessage.Timestamp
      })
    }
  }, [props.data.messages.length])

  const clickCard = _ => {
    if (props.setDrawer) { props.setDrawer(false) }
    props.setActive(props.data.index)
  }

  const _renderChannelName = _ => {
    if (Object.keys(props.data.privateKeys).length === 2) {
      const otherUsernames = Object.keys(props.data.userMap).filter(userID => props.data.userMap[userID] !== props.myUsername)
      return <h4 className={styles.title}>{props.data.userMap[otherUsernames]}</h4>
    }

    return <h4 className={styles.title}>{props.data.Name}</h4>
  }

  return (
    <Card className={styles.container} onClick={clickCard}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {_renderChannelName()}

        {lastMessage && <p>{formatMessageTime(lastMessage.time)}</p>}
      </div>
      {lastMessage && <p className={styles.subtitle}>{lastMessage.sender}: {lastMessage.message}</p>}
      {!lastMessage && <p className={styles.subtitle} style={{ fontStyle: 'italic' }}>No messages yet</p>}
    </Card>
  )
}

export default withTheme(Channel)
