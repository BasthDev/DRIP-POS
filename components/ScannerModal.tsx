import { useTheme } from '@/constants/colorTheme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QrCode, ScanLine, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface DripScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (data: string) => void;
}

export const DripScannerModal: React.FC<DripScannerModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<'barcode' | 'qr'>('barcode');
  const [scanned, setScanned] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const isSquare = scanMode === 'qr';

  // Frame dimensions matching UI styles
  const frameHeight = isSquare ? 250 : 160;

  // Calculate exact screen boundaries of the viewfinder target box
  const frameX = (screenWidth - (isSquare ? 250 : screenWidth * 0.85)) / 2;
  const frameY = (screenHeight - (isSquare ? 250 : 160)) / 2;

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={[styles.permissionContainer, { backgroundColor: theme.background, zIndex: 999999, elevation: 999999 }]}>
          <Text style={[styles.permissionText, { color: theme.text }]}>
            Camera permission is required to scan codes.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.primary }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: theme.background }]}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeTextButton}>
            <Text style={{ color: theme.textTertiary }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const handleBarCodeScanned = (scanningResult: { type: string; data: string; cornerPoints?: { x: number; y: number }[] }) => {
    if (scanned) return;

    const { data, cornerPoints } = scanningResult;

    // Strict boundary validation: Ensure all code corner points fall inside the box
    if (cornerPoints && cornerPoints.length > 0) {
      const isInsideBox = cornerPoints.every(
        (point) =>
          point.x >= frameX &&
          point.x <= frameX + (isSquare ? 250 : screenWidth * 0.85) &&
          point.y >= frameY &&
          point.y <= frameY + frameHeight
      );

      if (!isInsideBox) {
        return; // Ignore if scanned outside the box
      }
    }

    setScanned(true);
    onScanSuccess(data);
    setTimeout(() => {
      setScanned(false);
      onClose();
    }, 500);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: scanMode === 'qr' ? ['qr'] : ['code128', 'code39', 'ean13', 'upc_a', 'upc_e'],
          }}
        >
          {/* Top Header Overlay */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              onPress={onClose}
            >
              <X size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {scanMode === 'barcode' ? 'Scan Barcode / SKU' : 'Scan QR Code'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Viewfinder Target Area */}
          <View style={styles.viewfinderContainer}>
            <View
              style={[
                styles.targetFrame,
                scanMode === 'qr' ? styles.squareFrame : styles.rectFrame,
                { borderColor: theme.primary },
              ]}
            >
              <View style={[styles.cornerTL, { borderColor: theme.primary }]} />
              <View style={[styles.cornerTR, { borderColor: theme.primary }]} />
              <View style={[styles.cornerBL, { borderColor: theme.primary }]} />
              <View style={[styles.cornerBR, { borderColor: theme.primary }]} />
            </View>
            <Text style={styles.instructionText}>
              Align {scanMode === 'barcode' ? 'barcode inside the rectangle' : 'QR code inside the box'}
            </Text>
          </View>

          {/* Mode Switcher Footer */}
          <View style={styles.footer}>
            <View style={[styles.modeSwitcher, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  scanMode === 'barcode' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setScanMode('barcode')}
              >
                <ScanLine size={18} color={scanMode === 'barcode' ? theme.background : '#fff'} />
                <Text style={[styles.modeText, { color: scanMode === 'barcode' ? theme.background : '#fff' }]}>
                  Barcode
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  scanMode === 'qr' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setScanMode('qr')}
              >
                <QrCode size={18} color={scanMode === 'qr' ? theme.background : '#fff'} />
                <Text style={[styles.modeText, { color: scanMode === 'qr' ? theme.background : '#fff' }]}>
                  QR Code
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    zIndex: 999999,
    elevation: 999999,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  rectFrame: {
    width: '85%',
    height: 160,
  },
  squareFrame: {
    width: 250,
    height: 250,
  },
  instructionText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
  },
  modeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  closeTextButton: {
    marginTop: 16,
  },
  cornerTL: { position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  cornerTR: { position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  cornerBL: { position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  cornerBR: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
});