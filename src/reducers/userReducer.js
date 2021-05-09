import { SET_USER, LOAD_USER, LOGOUT } from '../actions/userActions'

const initialState = {
  token: localStorage.getItem('token')
}

export default function userReducer(state = initialState, action) {
  switch (action.type) {
    case SET_USER:
      const { user } = action

      const userState = {
        _id: user._id,
        username: user.username,
        token: action.token
      }

      return userState
    case LOAD_USER:
      return { ...action.user }
    case LOGOUT:
      localStorage.clear()
      return {}
    default:
      return state
  }
}
