import Svg, { Polygon } from 'react-native-svg'
import { View, StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'

export function ArrowOverlay() {
  return (
    <View style={styles.arrowContainer}>
      <Svg width={40} height={40} viewBox="0 0 40 40">
        <Polygon
          points="0,20 30,10 30,16 40,16 40,24 30,24 30,30"
          fill={colors.orange}
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  arrowContainer: {
    position: 'absolute',
    left: -20,
    top: '40%',
    zIndex: 10,
  },
}) 