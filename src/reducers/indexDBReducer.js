import { OPEN_INDEXDB, INDEXDB_FAILED, INDEXDB_ATTEMPT } from '../actions/indexDBActions'

const initialState = {
  opening: false,
  failed: false,
  db: null
}

export default function (state = initialState, action) {
  switch (action.type) {
    case INDEXDB_ATTEMPT:
      return { ...state, opening: true, failed: false }
    case OPEN_INDEXDB:
      return { ...state, db: action.db, opening: false, failed: false }
    case INDEXDB_FAILED:
      return { ...state, opening: false, failed: true }
    default:
      return state
  }
}
