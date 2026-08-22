import { DripButton } from '@/components/Button';
import { DripContainer } from '@/components/Container';
import { Header } from '@/components/Header';
import { DripInput } from '@/components/Input';
import { DripScannerModal } from '@/components/ScannerModal';
import { DripSearchBar } from '@/components/SearchBar';
import { DripSheet } from '@/components/Sheet';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { Ingredient, Product } from '@/constants/types';
import { formatCurrency } from '@/lib/currency';
import { supabase } from '@/lib/supabase';
import { formatQtyWithUnit } from '@/lib/units';
import { AlertTriangle, Boxes, Leaf, Package, ScanLine, SlidersHorizontal } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type StockItemRow = {
  id: string;
  item_type: 'ingredient' | 'product';
  name: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  low_stock_alert: boolean;
  cost_display: string;
  category_or_supplier?: string | null;
};

export default function InventoryScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [items, setItems] = useState<StockItemRow[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItemRow | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'ingredient' | 'product'>('all');
  const [search, setSearch] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stock Adjustment Form
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const canManage = hasPermission('inventory.manage') || hasPermission('inventory.edit');

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Ingredients
      const { data: ingData } = await supabase
        .from('ingredients')
        .select('*, suppliers(name)')
        .order('name');

      // 2. Fetch Products
      const { data: prodData } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('name');

      const formattedIngredients: StockItemRow[] = (ingData || []).map((i: Ingredient) => ({
        id: i.id,
        item_type: 'ingredient',
        name: i.name,
        unit: i.item_unit || 'g',
        current_stock: Number(i.current_stock || 0),
        min_stock_level: Number(i.min_stock_level || 0),
        low_stock_alert: i.low_stock_alert !== 0,
        cost_display: `${formatCurrency(i.cost_per_gram || 0)}/${i.item_unit || 'g'}`,
        category_or_supplier: i.supplier_name || (i as any).suppliers?.name || null,
      }));

      const formattedProducts: StockItemRow[] = (prodData || [])
        .filter((p: Product) => p.use_stock !== 0)
        .map((p: Product) => ({
          id: p.id,
          item_type: 'product',
          name: p.name,
          unit: 'pcs',
          current_stock: Number(p.stock_quantity || 0),
          min_stock_level: Number(p.min_stock_level || 0),
          low_stock_alert: p.low_stock_alert !== 0,
          cost_display: formatCurrency(p.buy_price || 0),
          category_or_supplier: p.category_name || (p as any).categories?.name || null,
        }));

      setItems([...formattedIngredients, ...formattedProducts]);
    } catch (e) {
      console.log('Error fetching stock items:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesTab = activeTab === 'all' || item.item_type === activeTab;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category_or_supplier && item.category_or_supplier.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const lowStockCount = items.filter(
    (i) => i.low_stock_alert && i.current_stock <= i.min_stock_level
  ).length;

  const handleApplyAdjustment = async () => {
    if (!selectedItem) return;
    const qtyChange = parseFloat(adjustQty);
    if (isNaN(qtyChange)) return;

    const newStock = Math.max(0, selectedItem.current_stock + qtyChange);

    setItems(
      items.map((i) =>
        i.id === selectedItem.id && i.item_type === selectedItem.item_type
          ? { ...i, current_stock: newStock }
          : i
      )
    );
    setSelectedItem({ ...selectedItem, current_stock: newStock });

    try {
      if (selectedItem.item_type === 'ingredient') {
        await supabase
          .from('ingredients')
          .update({ current_stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', selectedItem.id);
      } else {
        await supabase
          .from('products')
          .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
          .eq('id', selectedItem.id);
      }

      // Log stock transaction
      await supabase.from('stock_transactions').insert([
        {
          item_type: selectedItem.item_type,
          item_id: selectedItem.id,
          transaction_type: qtyChange >= 0 ? 'restock' : 'adjustment',
          quantity: Math.abs(qtyChange),
          quantity_before: selectedItem.current_stock,
          quantity_after: newStock,
          reason: adjustReason.trim() || 'Manual adjustment',
        },
      ]);
    } catch (e) {
      console.log('Error adjusting stock in DB:', e);
    }

    setShowAdjustModal(false);
    setAdjustQty('');
    setAdjustReason('');
  };

  const leftPanel = (
    <View style={styles.leftPanelContent}>
      {/* Low Stock Alert Header */}
      {lowStockCount > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
          <AlertTriangle size={18} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>
            {lowStockCount} {t('inventory.itemsLowAlert')}
          </Text>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
        {[
          { id: 'all', label: t('inventory.allStock') },
          { id: 'ingredient', label: t('inventory.ingredients') },
          { id: 'product', label: t('inventory.products') },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabBtn,
                active && { backgroundColor: theme.primary },
              ]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? theme.background : theme.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <DripSearchBar
        placeholder={t('common.search')}
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch('')}
        rightIcon={<ScanLine size={18} color={theme.primary} />}
        onRightIconPress={() => setShowScanner(true)}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 30 }} />
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Boxes size={48} color={theme.textDisabled} />
          <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
            {t('inventory.noItems')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id && selectedItem?.item_type === item.item_type;
            const isLow = item.low_stock_alert && item.current_stock <= item.min_stock_level;

            return (
              <TouchableOpacity
                key={`${item.item_type}-${item.id}`}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedItem(item)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {item.item_type === 'ingredient' ? (
                        <Leaf size={14} color={isSelected ? theme.background : theme.primary} />
                      ) : (
                        <Package size={14} color={isSelected ? theme.background : theme.primary} />
                      )}
                      <Text
                        style={[
                          styles.cardName,
                          { color: isSelected ? theme.background : theme.text },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.cardSubtitle,
                        { color: isSelected ? theme.background + 'CC' : theme.textSecondary },
                      ]}
                    >
                      {t('inventory.cost')}: {item.cost_display}
                      {item.category_or_supplier ? ` • ${item.category_or_supplier}` : ''}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.stockBadge,
                      {
                        backgroundColor: isSelected
                          ? theme.background + '30'
                          : isLow
                          ? '#FEF2F2'
                          : theme.input,
                      },
                    ]}
                  >
                    {isLow && (
                      <AlertTriangle
                        size={12}
                        color={isSelected ? theme.background : theme.error}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.stockText,
                        {
                          color: isSelected
                            ? theme.background
                            : isLow
                            ? theme.error
                            : theme.text,
                        },
                      ]}
                    >
                      {formatQtyWithUnit(item.current_stock, item.unit)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const rightPanel = selectedItem ? (
    <View style={styles.detailsContent}>
      <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.detailsTitleContainer}>
          {selectedItem.item_type === 'ingredient' ? (
            <Leaf size={28} color={theme.primary} />
          ) : (
            <Package size={28} color={theme.primary} />
          )}
          <View>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>
              {selectedItem.name}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, textTransform: 'capitalize' }}>
              {t('common.type')}: {selectedItem.item_type === 'ingredient' ? t('inventory.ingredients') : t('inventory.products')}
            </Text>
          </View>
        </View>

        {canManage && (
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: theme.primary }]}
            onPress={() => setShowAdjustModal(true)}
          >
            <SlidersHorizontal size={18} color={theme.background} />
            <Text style={{ color: theme.background, fontWeight: '700', fontSize: 13 }}>
              {t('inventory.adjustStock')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1, marginTop: 16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.infoCardTitle, { color: theme.text }]}>{t('inventory.stockOverview')}</Text>
          <View style={styles.infoRow}>
            <Text style={{ color: theme.textSecondary }}>{t('inventory.currentStock')}:</Text>
            <Text style={{ fontWeight: '800', fontSize: 18, color: theme.text }}>
              {formatQtyWithUnit(selectedItem.current_stock, selectedItem.unit)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={{ color: theme.textSecondary }}>{t('ingredients.minStockAlert')}:</Text>
            <Text style={{ fontWeight: '600', color: theme.textSecondary }}>
              {formatQtyWithUnit(selectedItem.min_stock_level, selectedItem.unit)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={{ color: theme.textSecondary }}>{t('inventory.cost')}:</Text>
            <Text style={{ fontWeight: '700', color: theme.primary }}>
              {selectedItem.cost_display}
            </Text>
          </View>
          {selectedItem.category_or_supplier ? (
            <View style={styles.infoRow}>
              <Text style={{ color: theme.textSecondary }}>
                {selectedItem.item_type === 'ingredient' ? `${t('suppliers.title')}:` : `${t('categories.title')}:`}
              </Text>
              <Text style={{ fontWeight: '600', color: theme.text }}>
                {selectedItem.category_or_supplier}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  ) : (
    <View style={styles.emptyState}>
      <Boxes size={64} color={theme.textDisabled} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {t('inventory.noItems')}
      </Text>
    </View>
  );

  return (
    <>
      <Header title={t('inventory.title')} />
      <DripContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        showSecondaryMobile={!!selectedItem}
        onMobileBack={() => setSelectedItem(null)}
        backButtonTitle={t('common.back')}
        childrenPadding={16}
      />

      {/* Stock Adjustment Modal */}
      <DripSheet
        visible={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title={t('inventory.adjustStock')}
        headerIcon={<SlidersHorizontal size={20} color={theme.primary} />}
        footer={
          <View style={styles.formFooterActions}>
            <DripButton
              title={t('common.cancel')}
              onPress={() => setShowAdjustModal(false)}
              variant="secondary"
              style={styles.formButton}
            />
            <DripButton
              title={t('common.confirm')}
              onPress={handleApplyAdjustment}
              style={styles.formButton}
            />
          </View>
        }
      >
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
          {selectedItem?.name} ({t('inventory.currentStock')}: {selectedItem?.current_stock} {selectedItem?.unit})
        </Text>
        <DripInput
          label={t('inventory.adjustQtyLabel')}
          value={adjustQty}
          onChangeText={setAdjustQty}
          keyboardType="numeric"
          placeholder="+50 / -10"
        />
        <DripInput
          label={t('inventory.adjustReasonLabel')}
          value={adjustReason}
          onChangeText={setAdjustReason}
          placeholder={t('inventory.adjustPlaceholder')}
        />
      </DripSheet>

      {/* Barcode Scanner Modal */}
      <DripScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={(code) => {
          setSearch(code);
          setShowScanner(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  leftPanelContent: {
    flex: 1,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailsContent: {
    flex: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  detailsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  formFooterActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  formButton: {
    flex: 1,
  },
});