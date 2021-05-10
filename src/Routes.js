import React from 'react'

import { Router, Route, Switch } from 'react-router'
import { MuiThemeProvider, useTheme, CircularProgress } from '@material-ui/core'

import Header from './components/Header'
import Login from './components/Login'
import Register from './components/Register'
import MessageContainer from './components/MessageContainer'
import Settings from './components/Settings'

import { connect } from 'react-redux'

const Routes = props => {
  return (
    <MuiThemeProvider theme={props.theme.currentTheme}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: props.theme.currentTheme.palette.background.paper }}>
        <Header />
        <div style={{ display: 'flex', flex: 1, height: '90%' }}>
          <Switch>
            {/* <Route exact path = "/login" component = {Login} /> */}
            <Route exact path='/' component={Register} />

            <Route exact path='/register' component={Register} />

            <Route exact path='/messages' component={MessageContainer} />
            <Route exact path='/settings' component={Settings} />
          </Switch>
        </div>
      </div>
    </MuiThemeProvider>
  )
}

const mapStateToProps = state => {
  return {
    theme: state.theme
  }
}

export default connect(mapStateToProps, { })(Routes)
