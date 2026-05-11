import { Platform, StatusBar } from 'react-native'

/** Height of the OS status bar — use as paddingTop in violet header views */
export const STATUS_TOP = Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight ?? 24) + 12
