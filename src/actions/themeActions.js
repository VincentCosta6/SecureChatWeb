import store from '../store'

import { dbQueryPromise } from '../utility/indexDBWrappers'

export const GET_THEMES = 'GET_THEMES'
export const CHANGE_THEME = 'CHANGE_THEME'

export const getThemes = _ => dispatch => {
  /* storage.get("theme", (_err, data) => {
        if(Object.entries(data).length === 0 && data.constructor === Object)
            dispatch({
                type: GET_THEMES,
                theme: createMuiTheme()
            })
        else
            dispatch({
                type: GET_THEMES,
                theme: createMuiTheme(data)
            })
    }) */
}

export const changeTheme = (theme, save = true) => async dispatch => {
  const saveState = async _ => {
    console.log(theme)
    const themeDataStore = store.getState().indexdb.db.transaction(['themes'], 'readwrite').objectStore('themes')
    const request = themeDataStore.put({ username: localStorage.getItem('user'), theme: theme.palette })
  }

  if (save)
    await saveState()

    console.log(theme)

  dispatch({
    type: CHANGE_THEME,
    theme
  })
}
