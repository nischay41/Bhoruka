import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'

export function CornerOverlay() {
  return (
    <>
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
    </>
  )
}

const size = 32
const thickness = 4

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: colors.orange,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: thickness,
    borderLeftWidth: thickness,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: thickness,
    borderRightWidth: thickness,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: thickness,
    borderLeftWidth: thickness,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: thickness,
    borderRightWidth: thickness,
  },
}) 