import { Platform, StatusBar } from 'react-native'

/**
 * Top padding to use in screen headers so content clears the status bar.
 *
 * On Android the app runs edge-to-edge (status bar is always translucent /
 * content draws behind it).  StatusBar.currentHeight gives the bar height in
 * logical pixels, but can be 0 on some emulators or early render cycles, so
 * we enforce a floor of 28 dp and add 20 dp of breathing room so the header
 * title always clears the status-bar icons on every modern device.
 */
export const STATUS_TOP = Platform.OS === 'ios'
  ? 56
  : Math.max(StatusBar.currentHeight ?? 0, 28) + 20
