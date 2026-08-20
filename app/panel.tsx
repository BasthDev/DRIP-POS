import { DripButton } from '@/components/Button';
import { DripContainer } from '@/components/Container';
import { Header } from '@/components/Header';
import { useTheme } from '@/constants/colorTheme';
import { Moon, ShoppingBag, Sun } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CheckoutLayoutScreen() {
  const [showNextScreenMobile, setShowNextScreenMobile] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const { theme, toggleColorMode, colorMode } = useTheme();

  const products = [
    { id: '1', name: 'Caramel Macchiato', price: '$4.50' },
    { id: '2', name: 'Artisanal Croissant', price: '$3.25' },
    { id: '3', name: 'Matcha Latte', price: '$5.00' },
    { id: '4', name: 'Blueberry Muffin', price: '$3.75' },
  ];

  const renderMainContent = () => (
    <View>
      <Text style={[styles.heading, { color: theme.text }]}>Catalog & Cart</Text>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              setSelectedItem(item.name);
              setShowNextScreenMobile(true);
            }}
          >
            <View>
              <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.productPrice, { color: theme.primary }]}>{item.price}</Text>
            </View>
            <ShoppingBag size={20} color={theme.iconSecondary} />
          </TouchableOpacity>
        )}
      />

      <DripButton 
        title="Proceed to Payment ->" 
        onPress={() => setShowNextScreenMobile(true)} 
        style={styles.payButton}
      />
    </View>
  );

  const renderSecondaryContent = () => (
    <View style={[styles.detailContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.heading, { color: theme.text }]}>Payment & Checkout Form</Text>
      <Text style={[styles.subText, { color: theme.textSecondary }]}>
        {selectedItem ? `Selected Item: ${selectedItem}` : 'Complete transaction details here...'}
      </Text>
      
      <View style={styles.detailSpacer} />
      
      <DripButton 
        title="Confirm & Charge" 
        onPress={() => alert('Processed successfully!')} 
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Header
        title="DRIP POS Checkout"
        rightIcon={colorMode === 'dark' ? <Sun size={20} color={theme.icon} /> : <Moon size={20} color={theme.icon} />}
        onRightPress={toggleColorMode}
      />

      <DripContainer
        leftPanel={renderMainContent()}
        rightPanel={renderSecondaryContent()}
        showSecondaryMobile={showNextScreenMobile}
        onMobileBack={() => setShowNextScreenMobile(false)}
        backButtonTitle="Back to Catalog"
        showTabletBackButton={false}
        childrenPadding={8}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subText: {
    fontSize: 16,
    marginTop: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  payButton: {
    marginTop: 12,
  },
  detailContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  detailSpacer: {
    height: 32,
  },
});