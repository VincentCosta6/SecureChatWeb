import React, { useState, useEffect } from 'react'
import { Dialog, DialogTitle, Button, Checkbox } from '@material-ui/core'

import { FiX, FiCheck } from 'react-icons/fi'

export const ConfirmComp = props => {
  const [checkMarks, setCheckmarks] = useState(new Array(props.text.length).fill(false))
  const [allTrue, setAllTrue] = useState(false)

  useEffect(_ => {
    setAllTrue(checkMarks.find(x => x === false) === undefined)
  }, [checkMarks])

  const handleChange = event => {
    const copy = checkMarks.slice()
    const index = parseInt(event.target.name)

    copy[index] = !copy[index]

    setCheckmarks(copy)
  }

  return (
    <Dialog open={props.open}>
      <DialogTitle style={{ fontWeight: '800 !important' }}>Warning! Check all boxes</DialogTitle>

      <ul>
        {
          props.text.map((text, i) => {
            return (
              <li
                key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }} onClick={_ => {
                  const copy = checkMarks.slice()

                  copy[i] = !copy[i]

                  setCheckmarks(copy)
                }}
              >
                <Checkbox
                  checked={checkMarks[i]}
                  onChange={handleChange}
                  color='primary'
                  style={{ margin: '15px 0' }}
                  name={i + ''}
                />
                <div>
                  {text}
                </div>
              </li>
            )
          })
        }
      </ul>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 10 }}>
        <Button color='secondary' variant='outlined' onClick={props.onCancel}><FiX color='red' /> Cancel</Button>
        <Button disabled={!allTrue} color='primary' variant='contained' onClick={props.onProceed}><FiCheck color={allTrue ? 'white' : 'gray'} /> Proceed</Button>
      </div>
    </Dialog>
  )
}

export default ConfirmComp