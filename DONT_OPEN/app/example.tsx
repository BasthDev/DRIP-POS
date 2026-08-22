import { DripBackButton } from '@/components/BackButton';
import { DripButton } from '@/components/Button';
import { DripChip } from '@/components/Chip';
import { DripDatePicker } from '@/components/DatePicker';
import { DripDropdown } from '@/components/Dropdown';
import { Header } from '@/components/Header';
import { DripInput } from '@/components/Input';
import { DripItemCard } from '@/components/ItemCard';
import { DripNumpad } from '@/components/Numpad';
import { DripProgressBar } from '@/components/Progressbar';
import { DripScannerModal } from '@/components/ScannerModal';
import { DripSearchBar } from '@/components/SearchBar';
import { DripSheet } from '@/components/Sheet';
import { DripSwitch } from '@/components/Switch';
import { DripToast, ToastType } from '@/components/Toast';
import { useTheme } from '@/constants/colorTheme';
import { router } from 'expo-router';
import { Barcode, Coffee, Eye, EyeOff, Lock, Moon, Package, ShoppingBag, Sun } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const { theme, toggleColorMode, colorMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  // States for DatePickers, Switches, and Toasts
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isTaxEnabled, setIsTaxEnabled] = useState(true);
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(false);

  // Numpad Custom Amount Entry State (Starting from 0)
  const [customAmount, setCustomAmount] = useState('0');

  // Separate Inventory Stock Items for Individual Progress Cards
  const [inventoryStock, setInventoryStock] = useState([
    { id: '1', name: 'Caramel Macchiato', current: 4, max: 20 },   // 20% -> Red
    { id: '2', name: 'Butter Croissant', current: 9, max: 20 },    // 45% -> Yellow
    { id: '3', name: 'Blueberry Muffin', current: 18, max: 20 },   // 90% -> Green
  ]);

  // Cart Items State with Notes Support
  const [cartItems, setCartItems] = useState([
    { id: '1', title: 'Caramel Macchiato', subtitle: 'Large • Oat Milk', note: 'Extra hot, less ice', price: 5.50, quantity: 2 },
    { id: '2', title: 'Butter Croissant', subtitle: 'Freshly Baked', note: 'Warm it up please', price: 3.75, quantity: 1 },
    { id: '3', title: 'Blueberry Muffin', subtitle: 'Gluten-Free', note: '', price: 4.25, quantity: 3 },
  ]);

  // Toast State with Title & Message Support
  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    title?: string;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  // Sheet Form States
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');

  const categories = ['All', 'Coffee', 'Pastries', 'Merchandise'];
  const [selectedDropdownCategory, setSelectedDropdownCategory] = useState('');

  const dropdownCategories = [
    { label: 'Coffee', value: 'coffee' },
    { label: 'Tea', value: 'tea' },
    { label: 'Pastries', value: 'pastries' },
  ];

  const triggerToast = (message: string, type: ToastType = 'success', title?: string) => {
    setToastConfig({ visible: true, title, message, type });
  };

  const handleQuantityChange = (id: string, newQty: number) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = isTaxEnabled ? subtotal * 0.1 : 0;
    return (subtotal + tax).toFixed(2);
  };

  const handleCheckout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      triggerToast('Transaction processed successfully!', 'success', 'Payment Complete');
    }, 1500);
  };

  const handleSaveItem = () => {
    if (!itemName) {
      triggerToast('Please enter a valid item name', 'error', 'Validation Error');
      return;
    }
    triggerToast(`Saved: ${itemName} (${itemCategory || 'Uncategorized'})`, 'success', 'Item Created');
    setIsSheetOpen(false);
  };

  // Numpad Actions
  const handleNumpadPress = (value: string) => {
    setCustomAmount((prev) => (prev === '0' && value !== '.' ? value : prev + value));
  };

  const handleNumpadDelete = () => {
    setCustomAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Toast Notification Component */}
        <DripToast
          visible={toastConfig.visible}
          title={toastConfig.title}
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
        />

        {/* Camera / Barcode Scanner Modal Component */}
        <DripScannerModal
          visible={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(scannedData) => {
            setSearchQuery(scannedData);
            triggerToast(`Successfully scanned: ${scannedData}`, 'success', 'Code Detected');
          }}
        />

        {/* Header with theme toggle */}
        <Header
          title="DRIP POS Cashier"
          rightIcon={colorMode === 'dark' ? <Sun size={20} color={theme.icon} /> : <Moon size={20} color={theme.icon} />}
          onRightPress={toggleColorMode}
        />

        <DripBackButton />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* 1. Dedicated Search Bar Component with Camera Trigger */}
          <DripSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search items or scan..."
            rightIcon={<Barcode size={20} color={theme.primary} />}
            onRightIconPress={() => setIsScannerOpen(true)}
          />

          {/* 2. Separate Live Inventory Stock Cards */}
          <View style={styles.sectionHeader}>
            <Package size={18} color={theme.text} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Inventory Status</Text>
          </View>

          {Array.isArray(inventoryStock) && inventoryStock.map((stock) => (
            <View
              key={stock.id}
              style={[
                styles.stockRowCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={[styles.stockIconBox, { backgroundColor: theme.input }]}>
                <Package size={18} color={theme.primary} />
              </View>
              <View style={styles.stockBarWrapper}>
                <DripProgressBar
                  label={stock.name}
                  current={stock.current}
                  max={stock.max}
                />
              </View>
            </View>
          ))}

          {/* 3. Cart Items Section using DripItemCard with Notes and Stepper */}
          <View style={styles.sectionHeader}>
            <ShoppingBag size={18} color={theme.text} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Order Items</Text>
          </View>

          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <DripItemCard
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                note={item.note}
                price={item.price}
                quantity={item.quantity}
                onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
                leftIcon={
                  <View style={[styles.itemIconBox, { backgroundColor: theme.input }]}>
                    <Coffee size={20} color={theme.primary} />
                  </View>
                }
              />
            ))
          ) : (
            <Text style={[styles.emptyCartText, { color: theme.textTertiary }]}>No items in current order</Text>
          )}

          {/* 4. Pure Numpad Component Demo */}
          <View style={styles.keypadSection}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 8 }]}>Quick Numeric Entry</Text>
            <View style={[styles.displayBox, { backgroundColor: theme.input, borderColor: theme.border }]}>
              <Text style={[styles.displayText, { color: theme.primary }]}>${customAmount}</Text>
            </View>
            <DripNumpad
              onPress={handleNumpadPress}
              onDelete={handleNumpadDelete}
            />
          </View>

          <DripDropdown
            label="Select Category"
            options={dropdownCategories}
            value={selectedDropdownCategory}
            onSelect={setSelectedDropdownCategory}
          />

          <DripDatePicker
            label="Start Date"
            value={startDate}
            onSelect={setStartDate}
            dateFormat="long"
          />

          <DripDatePicker
            label="End Date"
            value={endDate}
            onSelect={setEndDate}
            dateFormat="short"
          />

          {/* 5. Secure PIN Input with Left and Toggleable Right Icon */}
          <DripInput
            label="Manager PIN Override"
            value={managerPin}
            onChangeText={setManagerPin}
            secureTextEntry={!showPin}
            leftIcon={<Lock size={20} color={theme.iconSecondary} />}
            rightIcon={
              showPin ? (
                <EyeOff size={20} color={theme.iconSecondary} />
              ) : (
                <Eye size={20} color={theme.iconSecondary} />
              )
            }
            onRightIconPress={() => setShowPin(!showPin)}
          />

          {/* 6. Toggle Switch Components */}
          <View style={styles.switchesContainer}>
            <DripSwitch
              label="Apply VAT Tax (10%)"
              description="Automatically calculate tax at checkout"
              value={isTaxEnabled}
              onValueChange={setIsTaxEnabled}
            />
            <DripSwitch
              label="Enable Delivery Mode"
              description="Switch POS to fulfillment workflow"
              value={isDeliveryEnabled}
              onValueChange={setIsDeliveryEnabled}
            />
          </View>

          <DripButton title="Open Sheet Form" onPress={() => setIsSheetOpen(true)} />  

          {/* Sheet Modal Component with working form states and bottom-right save button */}
          <DripSheet
            visible={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            title="Create New Item"
            maxWidth={500}
            footer={
              <DripButton
                title="Save"
                onPress={handleSaveItem}
                variant="primary"
                style={styles.saveButton}
              />
            }
          >
            <DripInput
              label="Name"
              value={itemName}
              onChangeText={setItemName}
            />
            <DripDropdown
              label="Category"
              options={dropdownCategories}
              value={itemCategory}
              onSelect={setItemCategory}
            />
          </DripSheet>

          {/* Chip / Badge Chip Components */}
          <View style={styles.chipContainer}>
            {categories.map((cat) => (
              <DripChip
                key={cat}
                label={cat}
                selected={selectedCategory === cat}
                onPress={() => setSelectedCategory(cat)}
                style={styles.chip}
              />
            ))}
          </View>

          {/* Spacer to push button down */}
          <View style={styles.spacer} />

          {/* Action Button Component */}
          <DripButton
            title={`Charge $${calculateTotal()}`}
            onPress={handleCheckout}
            loading={loading}
            variant="primary"
          />
          <DripButton
            title="Go to Panel"
            onPress={() => router.push('/panel')}
            variant="secondary"
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  stockRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  stockIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stockBarWrapper: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 12,
    textAlign: 'center',
  },
  keypadSection: {
    marginVertical: 16,
  },
  displayBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  displayText: {
    fontSize: 24,
    fontWeight: '700',
  },
  switchesContainer: {
    marginVertical: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 12,
  },
  chip: {
    marginRight: 4,
    marginBottom: 8,
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  saveButton: {
    minWidth: 100,
    marginBottom: 0,
  },
});