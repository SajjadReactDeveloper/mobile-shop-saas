import React, { useEffect, useRef } from 'react'
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'

interface Props {
  visible: boolean
  onScan: (value: string) => void
  onClose: () => void
  hint?: string
}

export function BarcodeScannerModal({ visible, onScan, onClose, hint }: Props) {
  const [permission, requestPermission] = useCameraPermissions()
  const scanned = useRef(false)

  // Reset scanned flag each time modal opens
  useEffect(() => {
    if (visible) {
      scanned.current = false
      if (!permission?.granted) void requestPermission()
    }
  }, [visible, permission, requestPermission])

  const handleScan = ({ data }: { data: string }) => {
    if (scanned.current) return
    scanned.current = true
    onScan(data)
  }

  if (!visible) return null

  if (!permission?.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={s.permWrap}>
          <Text style={s.permIcon}>ðŸ“·</Text>
          <Text style={s.permTitle}>Camera Access Required</Text>
          <Text style={s.permSub}>
            Grant camera permission to scan barcodes and IMEI numbers.
          </Text>
          <TouchableOpacity style={s.permBtn} onPress={() => void requestPermission()}>
            <Text style={s.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={s.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['code128', 'code39', 'ean13', 'ean8', 'qr', 'datamatrix'],
          }}
          onBarcodeScanned={handleScan}
        />

        {/* Dark overlay with cutout */}
        <View style={s.overlay}>
          {/* Top dark bar */}
          <View style={[s.darkBar, { flex: 1 }]}>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeBtnText}>âœ•</Text>
            </TouchableOpacity>
            <Text style={s.title}>Scan Barcode</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Middle row: dark | clear window | dark */}
          <View style={s.middleRow}>
            <View style={s.darkSide} />
            <View style={s.scanWindow}>
              {/* Corner decorations */}
              <View style={[s.corner, s.cornerTL]} />
              <View style={[s.corner, s.cornerTR]} />
              <View style={[s.corner, s.cornerBL]} />
              <View style={[s.corner, s.cornerBR]} />
              {/* Scanning line */}
              <View style={s.scanLine} />
            </View>
            <View style={s.darkSide} />
          </View>

          {/* Bottom dark bar */}
          <View style={[s.darkBar, { flex: 1.5, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24 }]}>
            <Text style={s.hintText}>
              {hint ?? 'Point the camera at a barcode or IMEI number'}
            </Text>
            <TouchableOpacity style={s.manualBtn} onPress={onClose}>
              <Text style={s.manualBtnText}>Enter Manually Instead</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const WINDOW = 260
const CORNER = 22
const BORDER = 3.5

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
  overlay:      { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  darkBar:      { backgroundColor: 'rgba(0,0,0,0.72)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52 },
  middleRow:    { flexDirection: 'row', height: WINDOW },
  darkSide:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' },
  scanWindow:   { width: WINDOW, height: WINDOW },

  // Animated scan line
  scanLine:     { position: 'absolute', left: 12, right: 12, top: '50%', height: 2, backgroundColor: '#2563eb', opacity: 0.85, borderRadius: 2 },

  // Corner brackets
  corner:       { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#2563eb', borderWidth: BORDER, borderRadius: 2 },
  cornerTL:     { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR:     { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL:     { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR:     { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  title:        { fontSize: 17, fontWeight: '700', color: '#fff' },
  hintText:     { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  closeBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  manualBtn:    { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  manualBtnText:{ color: '#fff', fontSize: 14, fontWeight: '600' },

  // Permission screen
  permWrap:     { flex: 1, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center', padding: 32 },
  permIcon:     { fontSize: 64, marginBottom: 20 },
  permTitle:    { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10 },
  permSub:      { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permBtn:      { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 36, marginBottom: 12 },
  permBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn:    { paddingVertical: 12, paddingHorizontal: 24 },
  cancelBtnText:{ color: 'rgba(255,255,255,0.5)', fontSize: 14 },
})
