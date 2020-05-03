/* eslint-disable no-restricted-globals */
// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

// To learn more about the benefits of this model and instructions on how to
// opt-in, read https://bit.ly/CRA-PWA

/*const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

function register(config) {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
        // The URL constructor is available in all browsers that support SW.
        const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
        if (publicUrl.origin !== window.location.origin) {
            // Our service worker won't work if PUBLIC_URL is on a different origin
            // from what our page is served on. This might happen if a CDN is used to
            // serve assets; see https://github.com/facebook/create-react-app/issues/2374
            return;
        }

        window.addEventListener('load', () => {
            const swUrl = `${process.env.PUBLIC_URL}/serviceWorker.js`;

            if (isLocalhost) {
                // This is running on localhost. Let's check if a service worker still exists or not.
                checkValidServiceWorker(swUrl, config);

                // Add some additional logging to localhost, pointing developers to the
                // service worker/PWA documentation.
                navigator.serviceWorker.ready.then(() => {
                    console.log(
                        'This web app is being served cache-first by a service ' +
                        'worker. To learn more, visit https://bit.ly/CRA-PWA'
                    );
                });
            } else {
                // Is not localhost. Just register service worker
                registerValidSW(swUrl, config);
            }
        });
    }
}

function registerValidSW(swUrl, config) {
    navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker == null) {
                    return;
                }
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // At this point, the updated precached content has been fetched,
                            // but the previous service worker will still serve the older
                            // content until all client tabs are closed.
                            console.log(
                                'New content is available and will be used when all ' +
                                'tabs for this page are closed. See https://bit.ly/CRA-PWA.'
                            );

                            // Execute callback
                            if (config && config.onUpdate) {
                                config.onUpdate(registration);
                            }
                        } else {
                            // At this point, everything has been precached.
                            // It's the perfect time to display a
                            // "Content is cached for offline use." message.
                            console.log('Content is cached for offline use.');

                            // Execute callback
                            if (config && config.onSuccess) {
                                config.onSuccess(registration);
                            }
                        }
                    }
                };
            };
        })
        .catch(error => {
            console.error('Error during service worker registration:', error);
        });
}

function checkValidServiceWorker(swUrl, config) {
    // Check if the service worker can be found. If it can't reload the page.
    fetch(swUrl)
        .then(response => {
            // Ensure service worker exists, and that we really are getting a JS file.
            const contentType = response.headers.get('content-type');
            if (
                response.status === 404 ||
                (contentType != null && contentType.indexOf('javascript') === -1)
            ) {
                // No service worker found. Probably a different app. Reload the page.
                navigator.serviceWorker.ready.then(registration => {
                    registration.unregister().then(() => {
                        window.location.reload();
                    });
                });
            } else {
                // Service worker found. Proceed as normal.
                registerValidSW(swUrl, config);
            }
        })
        .catch(() => {
            console.log(
                'No internet connection found. App is running in offline mode.'
            );
        });
}

function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.unregister();
        });
    }
}*/

async function getIndexedDB() {
    return new Promise(function(resolve, reject) {
        const request = indexedDB.open("securechat", 4)

        request.onsuccess = event => {
            resolve(event.target.result)
        }

        request.onupgradeneeded = event => {
            const db = event.target.result

            const channels = db.createObjectStore("channels", { keyPath: "channel_id" })
            channels.createIndex("channel_name", "channel_name", { unique: false })

            const keystore = db.createObjectStore("keystore", { keyPath: "username" })

            const channel_keystore = db.createObjectStore("channel_keystore", { keyPath: "channel_id" })

            const user_data = db.createObjectStore("user_data", { keyPath: "_id" })
        }

        request.onerror = event => {
            reject()
        }
    })
}

const dbQueryPromise = (indexedDBObj) => {
    return new Promise(function(resolve, reject) {
        indexedDBObj.onerror = reject
        indexedDBObj.onsuccess = resolve
    })
}

self.addEventListener('push', function (e) {
    console.log(e)

    e.waitUntil(
        async _ => {
            const data = await e.data.json()

            let message = ""

            if (data) {
                const db = await getIndexedDB()

                if(data.ChannelID && data.Encrypted) {
                    const channelKeyStore = db.transaction(["channel_keystore"]).objectStore("channel_keystore")
                    const requestChannel = channelKeyStore.get(data.ChannelID)

                    const channel_key = (await dbQueryPromise(requestChannel)).target.result.key

                    message = { ...data, Encrypted: await decrypt(data.Encrypted, channel_key) }

                    message = message.Encrypted

                    message = JSON.parse(message).content
                }
            } else {
                return
            }

            var options = {
                body: message,

                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: 1
                }
            };

            return self.registration.showNotification('SecureChat', options)
        }
    )
});

function _base64ToArrayBuffer(base64) {
    var binary_string = atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

async function decrypt(message, AESKey) {
    const decoder = new TextDecoder()

    const bData = _base64ToArrayBuffer(message)
    // convert data to buffers
    const iv = bData.slice(0, 16)
    const salt = bData.slice(16, 80)
    const text = bData.slice(80)

    const keyMaterial = await getKeyMaterial(AESKey)
    const key = await deriveKeyWithSalt(keyMaterial, salt)

    const unique = Math.random()

    console.time("decrypt" + unique)

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        text
    )

    console.timeEnd("decrypt" + unique)

    return decoder.decode(decrypted)
}

async function getKeyMaterial(AESKey) {
    let enc = new TextEncoder()

    const keyString = await crypto.subtle.exportKey("raw", AESKey)

    return crypto.subtle.importKey(
        "raw",
        enc.encode(keyString),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    )
}

function deriveKeyWithSalt(keyMaterial, salt) {
    return crypto.subtle.deriveKey(
        {
            "name": "PBKDF2",
            salt: salt,
            "iterations": 2000,
            "hash": "SHA-512"
        },
        keyMaterial,
        { "name": "AES-GCM", "length": 256 },
        true,
        ["encrypt", "decrypt"]
    )
}