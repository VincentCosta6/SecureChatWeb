export function spkiToPEM(keydata){
    var keydataS = arrayBufferToString(keydata)
    var keydataB64 = window.btoa(keydataS)
    var keydataB64Pem = formatAsPem(keydataB64)
    return keydataB64Pem
}

export function arrayBufferToString( buffer ) {
    var binary = ''
    var bytes = new Uint8Array( buffer )
    var len = bytes.byteLength
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] )
    }
    return binary
}


export function formatAsPem(str) {
    var finalString = '-----BEGIN PUBLIC KEY-----'

    while(str.length > 0) {
        finalString += str.substring(0, 64)
        str = str.substring(64)
    }

    finalString = finalString + "-----END PUBLIC KEY-----"

    return finalString
}