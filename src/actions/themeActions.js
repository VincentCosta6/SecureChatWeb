import store from '../store'

export const GET_THEMES = 'GET_THEMES'
export const CHANGE_THEME = 'CHANGE_THEME'

export const getThemes = _ => () => {
  
}

export const changeTheme = theme => dispatch => {
  const saveState = async _ => {
    const themeDataStore = store.getState().indexdb.db.transaction(['themes'], 'readwrite').objectStore('themes')
    themeDataStore.put({ username: localStorage.getItem('user'), theme })
  }

  saveState()

  dispatch({
    type: CHANGE_THEME,
    theme
  })
}
