import { GET_THEMES, CHANGE_THEME } from '../actions/themeActions'

import { createMuiTheme } from '@material-ui/core/styles'

const defaultTheme = createMuiTheme()

const initialState = {
  currentTheme: defaultTheme
}

export default function (state = initialState, action) {
  switch (action.type) {
    case GET_THEMES:
      return { ...state, currentTheme: action.theme }
    case CHANGE_THEME: {
      const newTheme = createMuiTheme(action.theme)

      return { ...state, currentTheme: { ...state.currentTheme, ...newTheme } }
    }
    default:
      return state
  }
}
