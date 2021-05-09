export function buf2hex (buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('')
}

export function str2ab (str) {
  const buf = new ArrayBuffer(str.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

export function cutChars (allowedAmount, string) {
  let newString = ''

  for (let i = 0; i < allowedAmount && i < string.length; i++) newString += string[i]

  return newString + (string.length > allowedAmount ? '...' : '')
}

export function formatMessageTime (time) {
  const date = new Date(time)

  let minute = date.getMinutes()

  if (minute === 0) minute = '00'
  else if (minute <= 9) minute = '0' + minute

  const ampm = date.getHours() <= 11 ? 'AM' : 'PM'

  let hour = ampm === 'AM' ? date.getHours() : date.getHours() - 12

  if (hour === 0) hour = '12'

  return hour + ':' + minute + ' ' + ampm
}
