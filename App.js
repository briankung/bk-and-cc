import {
  Constants,
  Camera,
  FileSystem,
  Permissions
} from 'expo'

import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Vibration, CameraRoll } from 'react-native'
import isIPhoneX from 'react-native-is-iphonex'
import firebase from 'firebase'

const apiUrl = 'https://us-central1-brian-and-cici.cloudfunctions.net/api/picture'

export default class CameraScreen extends React.Component {
  state = {
    flash: 'off',
    zoom: 0,
    autoFocus: 'on',
    depth: 0,
    type: 'back',
    whiteBalance: 'auto',
    ratio: '16:9',
    ratios: [],
    photoId: 1,
    photos: [],
    permissionsGranted: false
  }

  async componentWillMount () {
    await this.requestPermissions()
    await this.initializeCloudStorage()
  }

  async requestPermissions () {
    const { status: cameraPermissions } = await Permissions.askAsync(Permissions.CAMERA)
    const { status: audioPermissions } = await Permissions.askAsync(Permissions.AUDIO_RECORDING)
    const { status: rollPermissions } = await Permissions.askAsync(Permissions.CAMERA_ROLL)

    this.setState({ permissionsGranted: cameraPermissions == 'granted' })
  }

  async initializeCloudStorage () {
    firebase.initializeApp({
      apiKey: "AIzaSyC-hBpFUahDINGzgRyHU3Q4MOoVo_WXcEE",
      authDomain: "brian-and-cici.firebaseapp.com",
      databaseURL: "https://brian-and-cici.firebaseio.com",
      projectId: "brian-and-cici",
      storageBucket: "brian-and-cici.appspot.com",
      messagingSenderId: "181334179101"
    })

    firebase.auth().signInAnonymously()
  }

  toggleFacing () {
    this.setState({
      type: this.state.type === 'back' ? 'front' : 'back',
    })
  }

  async takePicture () {
    if (this.camera) {
      Vibration.vibrate()

      const picture = await this.camera.takePictureAsync({ quality: 1, base64: true, exif: true })

      CameraRoll.saveToCameraRoll(picture.uri)

      await this.uploadPicture(picture)
    }
  }

  async uploadPicture (picture) {
    const { DateTimeOriginal, SubSecTimeOriginal } = picture.exif
    const name = `${DateTime.replace(/\D/g, '_')}_${SubSecTime}`
    const body = new FormData()

    body.append("picture", {
      uri: picture.uri,
      name,
      type: "image/jpg"
    })

    const res = await fetch(apiUrl, {
      method: "POST",
      body,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data"
      }
    })
  }

  renderNoPermissions() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 }}>
        <Text style={{ color: 'white' }}>
          Camera permissions not granted - cannot open camera preview.
        </Text>
      </View>
    )
  }

  renderCamera() {
    return (
      <Camera
        ref={ref => this.camera = ref}
        style={{
          flex: 1,
        }}
        type={this.state.type}
        flashMode={this.state.flash}
        autoFocus={this.state.autoFocus}
        zoom={this.state.zoom}
        whiteBalance={this.state.whiteBalance}
        ratio={this.state.ratio}
        focusDepth={this.state.depth}>
        <View
          style={{
            flex: 1,
            paddingBottom: isIPhoneX ? 20 : 0,
            backgroundColor: 'transparent',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end'
          }}>
          <TouchableOpacity style={styles.flipButton} onPress={this.toggleFacing.bind(this)}>
            <Text style={styles.flipText}> FLIP </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.flipButton, styles.picButton]}
            onPress={this.takePicture.bind(this)}>
            <Text style={styles.flipText}> SNAP </Text>
          </TouchableOpacity>
        </View>
      </Camera>
    )
  }

  render() {
    const cameraScreenContent = this.state.permissionsGranted
      ? this.renderCamera()
      : this.renderNoPermissions()
    return <View style={styles.container}>{cameraScreenContent}</View>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  flipButton: {
    flex: 0.3,
    height: 40,
    marginHorizontal: 2,
    marginBottom: 10,
    marginTop: 20,
    borderRadius: 8,
    borderColor: 'white',
    borderWidth: 1,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  flipText: {
    color: 'white',
    fontSize: 15
  },
  picButton: {
    backgroundColor: 'darkseagreen'
  }
})
