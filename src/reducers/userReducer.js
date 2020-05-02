import { SET_USER, LOAD_USER, LOGOUT } from "../actions/userActions"

const initialState = {
    ...JSON.parse(localStorage.getItem("user")),
    'token': localStorage.getItem("token")
}

export default function(state = initialState, action) {
    switch(action.type) {
        case SET_USER: 
            const { user, password } = action

            const userState = {
                _id: user._id,
                username: user.username,
                password,
                publicKey: user.publicKey,
                token: action.token
            }

            localStorage.setItem("userData", JSON.stringify(userState))
            
            return userState
        case LOAD_USER:
            return { ...action.user }
        case LOGOUT: 
            localStorage.clear()
            return {};
        default: 
            return state;
    }
}