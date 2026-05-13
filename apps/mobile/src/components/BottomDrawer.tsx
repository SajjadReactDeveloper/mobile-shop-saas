import React, { useEffect, useRef, useState, ReactNode } from 'react';
import {
  Modal, View, Animated, StyleSheet, TouchableOpacity,
  Keyboard, Platform, useWindowDimensions,
} from 'react-native';
interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet drawer — works on Android (edgeToEdgeEnabled, small screens,
 * gesture nav). Uses a Keyboard listener instead of KeyboardAvoidingView,
 * which misbehaves inside transparent Modals on Android.
 */
export default function BottomDrawer({ visible, onClose, children }: Props) {
  const { height: screenH } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(800)).current;
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';
    const show = Keyboard.addListener(showEvent, (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (!visible) setKbHeight(0);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
        mass: 0.9,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 800,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const availableH = screenH - kbHeight;
  const maxSheetH = Math.min(availableH * 0.92, screenH * 0.82);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.backdrop}
        onPress={() => { Keyboard.dismiss(); onClose(); }}
        activeOpacity={1}
      />
      <View style={[styles.anchor, { bottom: kbHeight }]}>
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: maxSheetH, transform: [{ translateY }] },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
});
