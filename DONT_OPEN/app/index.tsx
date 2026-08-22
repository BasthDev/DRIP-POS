import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useTheme } from '@/constants/colorTheme';
import { Header } from '@/components/Header';
import { DripSearchBar } from '@/components/SearchBar';
import { DripChip } from '@/components/Chip';
import { DripButton } from '@/components/Button';
import { DripItemCard } from '@/components/ItemCard';
import { DripSheet } from '@/components/Sheet';
import { DripToast } from '@/components/Toast';
import { DripScannerModal } from '@/components/ScannerModal';
import { DripInput } from '@/components/Input';
import {
  ShoppingBag,
  ScanLine,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Package,
} from 'lucide-react-native';
import { useCatalog, Product } from '@/contexts/catalogContext';
import { useCart, CartItem } from '@/contexts/cartContext';

export default function POSTerminalScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { theme } = useTheme();

  const { products, categories } = useCatalog();
  const {
    items,
    subtotal,
    discount,
    tax,
    grandTotal,
    itemCount,
    addItem,
    updateQuantity,
    updateItemNotes,
    removeItem,
    clearCart,
    processCheckout,
  } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);

  // Mobile navigation between Catalog and Cart view
  const [mobileCartView, setMobileCartView] = useState(false);

  // Payment Checkout Sheet State
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'card' | 'bank'>('cash');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Completed Receipt Modal State
  const [receiptResult, setReceiptResult] = useState<any>(null);

  // Edit Note State
  const [noteItem, setNoteItem] = useState<CartItem | null>(null);
  const [noteText, setNoteText] = useState('');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCat = !selectedCategoryId || p.category_id === selectedCategoryId;
    return matchesSearch && matchesCat;
  });

  const handleBarcodeScanned = (barcodeData: string) => {
    const found = products.find((p) => p.barcode === barcodeData || p.sku === barcodeData);
    if (found) {
      addItem(found);
      setToastMessage(`Added "${found.name}" to cart`);
      setToastType('success');
      setToastVisible(true);
    } else {
      setSearchQuery(barcodeData);
    }
  };

  const handleOpenPayment = () => {
    if (items.length === 0) {
      setToastMessage('Cart is empty. Add products to proceed.');
      setToastType('error');
      setToastVisible(true);
      return;
    }
    setTenderedAmount(grandTotal.toString());
    setPaymentSheetVisible(true);
  };

  const handleExecutePayment = async () => {
    const tenderedNum = paymentMethod === 'cash' ? parseFloat(tenderedAmount) || grandTotal : grandTotal;

    if (paymentMethod === 'cash' && tenderedNum < grandTotal) {
      setToastMessage('Tendered amount cannot be less than Grand Total.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    try {
      setCheckoutLoading(true);
      const { data, error } = await processCheckout(paymentMethod, tenderedNum);

      if (error) {
        if (error.message?.includes('Insufficient stock') || error.message?.includes('stock')) {
          Alert.alert('Stock Validation Failed', error.message);
        } else {
          setToastMessage(error.message || 'Payment failed.');
          setToastType('error');
          setToastVisible(true);
        }
        return;
      }

      setReceiptResult(data);
      setPaymentSheetVisible(false);
      setMobileCartView(false);
    } catch (err: any) {
      if (err.message?.includes('Insufficient stock') || err.message?.includes('stock')) {
        Alert.alert('Stock Validation Failed', err.message);
      } else {
        setToastMessage(err.message || 'Transaction error.');
        setToastType('error');
        setToastVisible(true);
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Render Product Tile in Catalog Grid
  const renderProductTile = ({ item }: { item: Product }) => {
    const price = item.store_price ?? item.selling_price;

    return (
      <TouchableOpacity
        style={[styles.productTile, { backgroundColor: theme.card, borderColor: theme.border }]}
        activeOpacity={0.7}
        onPress={() => addItem(item)}
      >
        <View style={[styles.productTileIcon, { backgroundColor: theme.input }]}>
          <Package size={22} color={theme.primary} />
        </View>
        <Text style={[styles.productTileName, { color: theme.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.productTilePrice, { color: theme.primary }]}>
          Rp {Number(price).toLocaleString('id-ID')}
        </Text>
      </TouchableOpacity>
    );
  };

  // --- CATALOG PANEL ---
  const CatalogPanel = (
    <View style={styles.catalogContainer}>
      <View style={styles.catalogHeader}>
        <DripSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products or scan barcode..."
          rightIcon={<ScanLine size={18} color={theme.primary} />}
          onRightIconPress={() => setScannerVisible(true)}
        />

        <View style={styles.categoryChips}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: 'all', name: 'All Items' }, ...categories]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = item.id === 'all' ? selectedCategoryId === null : selectedCategoryId === item.id;
              return (
                <DripChip
                  label={item.name}
                  selected={isSelected}
                  onPress={() => setSelectedCategoryId(item.id === 'all' ? null : item.id)}
                  style={styles.chip}
                />
              );
            }}
          />
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductTile}
        numColumns={isTablet ? 3 : 2}
        key={`grid-${isTablet ? 3 : 2}`}
        contentContainerStyle={styles.catalogGrid}
        ListEmptyComponent={
          <View style={styles.emptyCatalog}>
            <ShoppingBag size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyCatalogTitle, { color: theme.text }]}>No products found</Text>
            <Text style={[styles.emptyCatalogSubtitle, { color: theme.textSecondary }]}>
              {searchQuery ? 'Try another search query' : 'Add products in the Products menu'}
            </Text>
          </View>
        }
      />

      {/* Mobile Floating Cart Summary Button */}
      {!isTablet && itemCount > 0 && !mobileCartView && (
        <View style={styles.mobileCartBar}>
          <DripButton
            title={`View Order (${itemCount} items) • Rp ${grandTotal.toLocaleString('id-ID')}`}
            icon={<ShoppingBag size={18} color="#FFF" />}
            onPress={() => setMobileCartView(true)}
          />
        </View>
      )}
    </View>
  );

  // --- CART PANEL ---
  const CartPanel = (
    <View style={[styles.cartContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.cartHeader, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.cartTitle, { color: theme.text }]}>Current Order</Text>
          <Text style={[styles.cartSubtitle, { color: theme.textSecondary }]}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
          </Text>
        </View>

        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Trash2 size={18} color={theme.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Items List */}
      <ScrollView style={styles.cartItemsScroll} contentContainerStyle={styles.cartItemsContent}>
        {items.map((cartItem) => (
          <DripItemCard
            key={cartItem.product.id}
            title={cartItem.product.name}
            price={cartItem.unitPrice * cartItem.quantity}
            quantity={cartItem.quantity}
            note={cartItem.notes}
            onQuantityChange={(qty) => updateQuantity(cartItem.product.id, qty)}
            onPress={() => {
              setNoteItem(cartItem);
              setNoteText(cartItem.notes || '');
            }}
            style={styles.cartItemCard}
          />
        ))}

        {items.length === 0 && (
          <View style={styles.emptyCart}>
            <ShoppingBag size={42} color={theme.textTertiary} />
            <Text style={[styles.emptyCartText, { color: theme.textSecondary }]}>
              Your cart is empty. Tap products to add.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Order Summary & Checkout Button */}
      <View style={[styles.cartFooter, { borderTopColor: theme.border }]}>
        <View style={styles.summaryLine}>
          <Text style={[styles.sumLineText, { color: theme.textSecondary }]}>Subtotal</Text>
          <Text style={[styles.sumLineText, { color: theme.text }]}>
            Rp {subtotal.toLocaleString('id-ID')}
          </Text>
        </View>

        {discount > 0 && (
          <View style={styles.summaryLine}>
            <Text style={[styles.sumLineText, { color: theme.error }]}>Discount</Text>
            <Text style={[styles.sumLineText, { color: theme.error }]}>
              -Rp {discount.toLocaleString('id-ID')}
            </Text>
          </View>
        )}

        <View style={styles.totalLine}>
          <Text style={[styles.totalText, { color: theme.text }]}>Total Due</Text>
          <Text style={[styles.totalPrice, { color: theme.primary }]}>
            Rp {grandTotal.toLocaleString('id-ID')}
          </Text>
        </View>

        <DripButton
          title={isTablet ? 'Charge Order' : 'Proceed to Payment'}
          onPress={handleOpenPayment}
          disabled={items.length === 0}
          style={styles.chargeButton}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="DRIP POS" subtitle="Terminal #01" />

      {isTablet ? (
        <View style={styles.tabletSplit}>
          <View style={styles.tabletLeft}>{CatalogPanel}</View>
          <View style={styles.tabletRight}>{CartPanel}</View>
        </View>
      ) : (
        <View style={styles.mobileView}>
          {mobileCartView ? (
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={styles.mobileBackBtn}
                onPress={() => setMobileCartView(false)}
              >
                <Text style={{ color: theme.primary, fontWeight: '600' }}>← Back to Catalog</Text>
              </TouchableOpacity>
              {CartPanel}
            </View>
          ) : (
            CatalogPanel
          )}
        </View>
      )}

      {/* PAYMENT SHEET */}
      <DripSheet
        visible={paymentSheetVisible}
        onClose={() => setPaymentSheetVisible(false)}
        title="Complete Payment"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.paymentSheetForm}
        >
          <View style={[styles.paymentDueBox, { backgroundColor: theme.input }]}>
            <Text style={[styles.dueLabel, { color: theme.textSecondary }]}>Grand Total</Text>
            <Text style={[styles.dueAmount, { color: theme.primary }]}>
              Rp {grandTotal.toLocaleString('id-ID')}
            </Text>
          </View>

          {/* Payment Method Selector */}
          <Text style={[styles.methodTitle, { color: theme.text }]}>Payment Method</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[
                styles.methodCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                paymentMethod === 'cash' && [styles.methodCardActive, { borderColor: theme.primary }],
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Banknote size={20} color={paymentMethod === 'cash' ? theme.primary : theme.textSecondary} />
              <Text
                style={[
                  styles.methodText,
                  { color: paymentMethod === 'cash' ? theme.primary : theme.text },
                ]}
              >
                Cash
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                paymentMethod === 'qris' && [styles.methodCardActive, { borderColor: theme.primary }],
              ]}
              onPress={() => setPaymentMethod('qris')}
            >
              <QrCode size={20} color={paymentMethod === 'qris' ? theme.primary : theme.textSecondary} />
              <Text
                style={[
                  styles.methodText,
                  { color: paymentMethod === 'qris' ? theme.primary : theme.text },
                ]}
              >
                QRIS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                paymentMethod === 'card' && [styles.methodCardActive, { borderColor: theme.primary }],
              ]}
              onPress={() => setPaymentMethod('card')}
            >
              <CreditCard size={20} color={paymentMethod === 'card' ? theme.primary : theme.textSecondary} />
              <Text
                style={[
                  styles.methodText,
                  { color: paymentMethod === 'card' ? theme.primary : theme.text },
                ]}
              >
                Card
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cash Tendered Input */}
          {paymentMethod === 'cash' && (
            <View style={styles.cashTenderedSection}>
              <DripInput
                label="Cash Tendered (IDR)"
                value={tenderedAmount}
                onChangeText={setTenderedAmount}
                keyboardType="numeric"
              />

              {/* Quick Cash Buttons */}
              <View style={styles.quickCashRow}>
                {[grandTotal, 50000, 100000, 200000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.quickCashBtn, { backgroundColor: theme.input }]}
                    onPress={() => setTenderedAmount(amt.toString())}
                  >
                    <Text style={[styles.quickCashText, { color: theme.text }]}>
                      {amt === grandTotal ? 'Exact' : `${amt / 1000}k`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {parseFloat(tenderedAmount) >= grandTotal && (
                <View style={styles.changeRow}>
                  <Text style={[styles.changeLabel, { color: theme.textSecondary }]}>Change Due:</Text>
                  <Text style={[styles.changeValue, { color: theme.success }]}>
                    Rp {(parseFloat(tenderedAmount) - grandTotal).toLocaleString('id-ID')}
                  </Text>
                </View>
              )}
            </View>
          )}

          <DripButton
            title="Complete Transaction"
            onPress={handleExecutePayment}
            loading={checkoutLoading}
            style={styles.completeBtn}
          />
        </KeyboardAvoidingView>
      </DripSheet>

      {/* RECEIPT SUCCESS MODAL */}
      <DripSheet
        visible={!!receiptResult}
        onClose={() => setReceiptResult(null)}
        title="Transaction Completed"
      >
        {receiptResult && (
          <View style={styles.receiptBody}>
            <View style={[styles.successIconBox, { backgroundColor: theme.primary + '15' }]}>
              <CheckCircle2 size={48} color={theme.primary} />
            </View>

            <Text style={[styles.receiptNumber, { color: theme.text }]}>
              Receipt #{receiptResult.receiptNumber}
            </Text>

            <View style={[styles.receiptSummaryCard, { backgroundColor: theme.input }]}>
              <View style={styles.receiptLine}>
                <Text style={{ color: theme.textSecondary }}>Paid Amount</Text>
                <Text style={{ color: theme.text, fontWeight: '700' }}>
                  Rp {Number(receiptResult.grandTotal).toLocaleString('id-ID')}
                </Text>
              </View>

              {receiptResult.change > 0 && (
                <View style={styles.receiptLine}>
                  <Text style={{ color: theme.textSecondary }}>Change Returned</Text>
                  <Text style={{ color: theme.success, fontWeight: '700' }}>
                    Rp {Number(receiptResult.change).toLocaleString('id-ID')}
                  </Text>
                </View>
              )}

              <View style={styles.receiptLine}>
                <Text style={{ color: theme.textSecondary }}>Gross Profit</Text>
                <Text style={{ color: theme.text, fontWeight: '600' }}>
                  Rp {Number(receiptResult.grossProfit).toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            <DripButton
              title="New Order"
              onPress={() => setReceiptResult(null)}
              style={styles.newOrderBtn}
            />
          </View>
        )}
      </DripSheet>

      {/* ITEM NOTE EDIT SHEET */}
      <DripSheet
        visible={!!noteItem}
        onClose={() => setNoteItem(null)}
        title={`Barista Note - ${noteItem?.product.name || ''}`}
      >
        <View style={{ gap: 16 }}>
          <DripInput
            label="Special Instructions / Allergies"
            value={noteText}
            onChangeText={setNoteText}
            placeholder="e.g. Less sugar, oat milk, extra hot"
            multiline
            numberOfLines={3}
          />
          <DripButton
            title="Save Note"
            onPress={() => {
              if (noteItem) {
                updateItemNotes(noteItem.product.id, noteText);
              }
              setNoteItem(null);
            }}
          />
        </View>
      </DripSheet>

      <DripScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanSuccess={handleBarcodeScanned}
      />

      <DripToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabletSplit: {
    flex: 1,
    flexDirection: 'row',
  },
  tabletLeft: {
    flex: 1.6,
  },
  tabletRight: {
    flex: 1.1,
    borderLeftWidth: 1,
  },
  mobileView: {
    flex: 1,
  },
  mobileBackBtn: {
    padding: 12,
  },
  catalogContainer: {
    flex: 1,
  },
  catalogHeader: {
    padding: 12,
    gap: 10,
  },
  categoryChips: {
    paddingBottom: 4,
  },
  chip: {
    marginRight: 8,
  },
  catalogGrid: {
    padding: 10,
    paddingBottom: 80,
  },
  productTile: {
    flex: 1,
    margin: 6,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  productTileIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTileName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  productTilePrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCatalog: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyCatalogTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyCatalogSubtitle: {
    fontSize: 13,
  },
  mobileCartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  cartContainer: {
    flex: 1,
    display: 'flex',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cartSubtitle: {
    fontSize: 12,
  },
  clearBtn: {
    padding: 6,
  },
  cartItemsScroll: {
    flex: 1,
  },
  cartItemsContent: {
    padding: 12,
    gap: 10,
  },
  cartItemCard: {
    marginBottom: 6,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyCartText: {
    fontSize: 13,
    marginTop: 10,
  },
  cartFooter: {
    padding: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sumLineText: {
    fontSize: 13,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginBottom: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  chargeButton: {
    marginTop: 4,
  },
  paymentSheetForm: {
    gap: 16,
    paddingTop: 8,
  },
  paymentDueBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dueLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dueAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodCard: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  methodCardActive: {
    borderWidth: 2,
  },
  methodText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cashTenderedSection: {
    gap: 10,
  },
  quickCashRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickCashBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickCashText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  changeLabel: {
    fontSize: 14,
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  completeBtn: {
    marginTop: 8,
  },
  receiptBody: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  receiptSummaryCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newOrderBtn: {
    width: '100%',
    marginTop: 8,
  },
});
