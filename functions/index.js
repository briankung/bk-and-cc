const functions = require('firebase-functions')
const admin = require('firebase-admin')
const Storage = require('@google-cloud/storage')()
const firebaseBucket = functions.config().firebase.storageBucket
const stream = require('stream')

admin.initializeApp(functions.config().firebase)

exports.addMessage = functions.https.onRequest((req, res) => {
  const original = req.query.text
  admin.database().ref('/messages').push({original: original}).then(snapshot => {
    res.redirect(303, snapshot.ref)
  })
})

exports.convertPhoto = functions.https.onRequest((request) => {
  const encodedImage = request.body.base64

  let fileKey = request.body.uri.split('/')
  fileKey = fileKey[fileKey.length - 1]
  const firebaseFile = Storage.bucket(firebaseBucket).file(fileKey)

  const bufferStream = new stream.PassThrough()

  bufferStream.end(global.Buffer(encodedImage, 'base64'))
  bufferStream.pipe(firebaseFile.createWriteStream({
    metadata: {
      contentType: 'image/jpeg',
      metadata: {
        custom: 'metadata'
      }
    },
    public: true,
    validation: 'md5'
  }))
})
