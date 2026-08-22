import { DripButton } from '@/components/Button';
import { DripContainer } from '@/components/Container';
import { DripDropdown, DropdownOption } from '@/components/Dropdown';
import { Header } from '@/components/Header';
import { DripInput } from '@/components/Input';
import { DripSearchBar } from '@/components/SearchBar';
import { DripSheet } from '@/components/Sheet';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { CostType, Ingredient, ItemUnit, Supplier } from '@/constants/types';
import { formatCurrency } from '@/lib/currency';
import { supabase } from '@/lib/supabase';
import { computeCostPerGram, formatQtyWithUnit, getCompatibleUnits } from '@/lib/units';
import { AlertTriangle, Edit, Leaf, Plus, Trash2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const COST_TYPES: { id: CostType; labelKey: string }[] = [
  { id: 'per_gram_manual', labelKey: 'ingredients.manualPerGram' },
  { id: 'per_gram_auto', labelKey: 'ingredients.autoCalc' },
  { id: 'per_pcs', labelKey: 'ingredients.perPcs' },
];

export default function IngredientsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<DropdownOption[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [supplierIdInput, setSupplierIdInput] = useState<string>('');
  const [costTypeInput, setCostTypeInput] = useState<CostType>('per_gram_manual');
  const [costPerGramInput, setCostPerGramInput] = useState('');
  const [buyPriceInput, setBuyPriceInput] = useState('');
  const [itemQtyInput, setItemQtyInput] = useState('');
  const [itemUnitInput, setItemUnitInput] = useState<ItemUnit>('g');
  const [minStockInput, setMinStockInput] = useState('0');
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [errorName, setErrorName] = useState('');

  const canCreate = hasPermission('inventory.create');
  const canEdit = hasPermission('inventory.edit');
  const canDelete = hasPermission('inventory.delete');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Suppliers
      const { data: suppData } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');

      if (suppData) {
        setSuppliers([
          { label: t('common.none'), value: '' },
          ...suppData.map((s: Supplier) => ({ label: s.name, value: s.id })),
        ]);
      }

      // Fetch Ingredients with joined supplier
      const { data, error } = await supabase
        .from('ingredients')
        .select('*, suppliers(name)')
        .order('name');

      if (error) {
        console.log('Error fetching ingredients:', error);
        setIngredients([]);
      } else if (data) {
        const formatted: Ingredient[] = data.map((item: any) => ({
          id: item.id,
          supplier_id: item.supplier_id || null,
          supplier_name: item.suppliers?.name || null,
          name: item.name,
          cost_type: item.cost_type || 'per_gram_manual',
          buy_price: item.buy_price != null ? Number(item.buy_price) : null,
          item_qty: item.item_qty != null ? Number(item.item_qty) : null,
          item_unit: item.item_unit || 'g',
          cost_per_gram: item.cost_per_gram != null ? Number(item.cost_per_gram) : null,
          current_stock: Number(item.current_stock || 0),
          min_stock_level: Number(item.min_stock_level || 0),
          reorder_quantity: Number(item.reorder_quantity || 0),
          low_stock_alert: item.low_stock_alert ?? 1,
          last_restocked_at: item.last_restocked_at || null,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
        setIngredients(formatted);
      }
    } catch (e) {
      console.log('Error fetching ingredients:', e);
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  const computedAutoCost = useMemo(() => {
    if (costTypeInput !== 'per_gram_auto') return null;
    const bp = parseFloat(buyPriceInput);
    const iq = parseFloat(itemQtyInput);
    if (isNaN(bp) || isNaN(iq)) return null;
    return computeCostPerGram('per_gram_auto', bp, iq, itemUnitInput);
  }, [costTypeInput, buyPriceInput, itemQtyInput, itemUnitInput]);

  const filteredIngredients = ingredients.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.supplier_name && i.supplier_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setErrorName(t('validation.required'));
      return;
    }

    let finalCostPerGram: number | null = null;
    let finalBuyPrice: number | null = null;
    let finalItemQty: number | null = null;
    let finalItemUnit: ItemUnit | null = itemUnitInput;

    if (costTypeInput === 'per_gram_manual') {
      finalCostPerGram = parseFloat(costPerGramInput) || 0;
    } else if (costTypeInput === 'per_gram_auto') {
      finalBuyPrice = parseFloat(buyPriceInput) || 0;
      finalItemQty = parseFloat(itemQtyInput) || 0;
      finalCostPerGram = computeCostPerGram('per_gram_auto', finalBuyPrice, finalItemQty, itemUnitInput);
    } else if (costTypeInput === 'per_pcs') {
      finalBuyPrice = parseFloat(buyPriceInput) || 0;
      finalCostPerGram = finalBuyPrice;
      finalItemUnit = 'pcs';
    }

    const payload = {
      name: trimmed,
      supplier_id: supplierIdInput || null,
      cost_type: costTypeInput,
      buy_price: finalBuyPrice,
      item_qty: finalItemQty,
      item_unit: finalItemUnit,
      cost_per_gram: finalCostPerGram,
      min_stock_level: parseFloat(minStockInput) || 0,
      low_stock_alert: lowStockAlert ? 1 : 0,
      updated_at: new Date().toISOString(),
    };

    const suppName = suppliers.find((s) => s.value === supplierIdInput)?.label || null;

    if (isEditing && selectedIngredient) {
      setIngredients(
        ingredients.map((i) =>
          i.id === selectedIngredient.id
            ? { ...i, ...payload, supplier_name: suppName }
            : i
        )
      );
      setSelectedIngredient({ ...selectedIngredient, ...payload, supplier_name: suppName });

      try {
        await supabase.from('ingredients').update(payload).eq('id', selectedIngredient.id);
      } catch (e) {
        console.log('Error updating ingredient:', e);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('ingredients')
          .insert([{ ...payload, current_stock: 0 }])
          .select();

        if (!error && data && data[0]) {
          const newIng: Ingredient = {
            id: data[0].id,
            ...payload,
            current_stock: 0,
            reorder_quantity: 0,
            last_restocked_at: null,
            supplier_name: suppName,
          };
          setIngredients([newIng, ...ingredients]);
          setSelectedIngredient(newIng);
        } else {
          const fallback: Ingredient = {
            id: Date.now().toString(),
            ...payload,
            current_stock: 0,
            reorder_quantity: 0,
            last_restocked_at: null,
            supplier_name: suppName,
          };
          setIngredients([fallback, ...ingredients]);
          setSelectedIngredient(fallback);
        }
      } catch (e) {
        console.log('Error creating ingredient:', e);
      }
    }

    setShowForm(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (ing: Ingredient) => {
    setSelectedIngredient(ing);
    setNameInput(ing.name);
    setSupplierIdInput(ing.supplier_id || '');
    setCostTypeInput(ing.cost_type);
    setCostPerGramInput(ing.cost_per_gram != null ? String(ing.cost_per_gram) : '');
    setBuyPriceInput(ing.buy_price != null ? String(ing.buy_price) : '');
    setItemQtyInput(ing.item_qty != null ? String(ing.item_qty) : '');
    setItemUnitInput(ing.item_unit || 'g');
    setMinStockInput(String(ing.min_stock_level ?? 0));
    setLowStockAlert(ing.low_stock_alert !== 0);
    setErrorName('');
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('ingredients').delete().eq('id', id);
    } catch (e) {
      console.log('Error deleting ingredient:', e);
    }

    setIngredients(ingredients.filter((i) => i.id !== id));
    if (selectedIngredient?.id === id) {
      setSelectedIngredient(null);
    }
  };

  const resetForm = () => {
    setNameInput('');
    setSupplierIdInput('');
    setCostTypeInput('per_gram_manual');
    setCostPerGramInput('');
    setBuyPriceInput('');
    setItemQtyInput('');
    setItemUnitInput('g');
    setMinStockInput('0');
    setLowStockAlert(true);
    setErrorName('');
    setIsEditing(false);
  };

  const formatCostDisplay = (ing: Ingredient) => {
    if (ing.cost_type === 'per_pcs') {
      const val = ing.cost_per_gram ?? ing.buy_price ?? 0;
      return `${formatCurrency(val)}/pcs`;
    }
    const val = ing.cost_per_gram ?? 0;
    const unit = ing.item_unit ?? 'g';
    const displayUnit = unit === 'kg' ? 'g' : unit === 'l' ? 'ml' : unit;
    return `${formatCurrency(val)}/${displayUnit}`;
  };

  const leftPanel = (
    <View style={styles.leftPanelContent}>
      <DripSearchBar
        placeholder={t('common.search')}
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch('')}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 30 }} />
      ) : filteredIngredients.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Leaf size={48} color={theme.textDisabled} />
          <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
            {t('ingredients.noIngredients')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filteredIngredients.map((ing) => {
            const isSelected = selectedIngredient?.id === ing.id;
            const isLowStock = ing.low_stock_alert && ing.current_stock <= ing.min_stock_level;

            return (
              <TouchableOpacity
                key={ing.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedIngredient(ing)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text
                      style={[
                        styles.cardName,
                        { color: isSelected ? theme.background : theme.text },
                      ]}
                    >
                      {ing.name}
                    </Text>
                    <Text
                      style={[
                        styles.cardCost,
                        { color: isSelected ? theme.background + 'EE' : theme.primary },
                      ]}
                    >
                      {formatCostDisplay(ing)}
                    </Text>
                    {ing.supplier_name ? (
                      <Text
                        style={[
                          styles.cardSupplier,
                          { color: isSelected ? theme.background + 'CC' : theme.textSecondary },
                        ]}
                      >
                        {ing.supplier_name}
                      </Text>
                    ) : null}
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View
                      style={[
                        styles.stockBadge,
                        {
                          backgroundColor: isSelected
                            ? theme.background + '30'
                            : isLowStock
                            ? '#FEF2F2'
                            : theme.input,
                        },
                      ]}
                    >
                      {isLowStock && (
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
                              : isLowStock
                              ? theme.error
                              : theme.text,
                          },
                        ]}
                      >
                        {formatQtyWithUnit(ing.current_stock, ing.item_unit)}
                      </Text>
                    </View>

                    <View style={styles.cardActions}>
                      {canEdit && (
                        <TouchableOpacity
                          style={[
                            styles.actionIconBtn,
                            { backgroundColor: isSelected ? theme.background + '20' : theme.input },
                          ]}
                          onPress={() => openEdit(ing)}
                        >
                          <Edit size={16} color={isSelected ? theme.background : theme.primary} />
                        </TouchableOpacity>
                      )}
                      {canDelete && (
                        <TouchableOpacity
                          style={[
                            styles.actionIconBtn,
                            { backgroundColor: isSelected ? theme.background + '20' : '#FEE2E2' },
                          ]}
                          onPress={() => handleDelete(ing.id)}
                        >
                          <Trash2 size={16} color={isSelected ? theme.background : theme.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {canCreate && (
        <DripButton
          title={t('ingredients.newIngredient')}
          onPress={openCreate}
          icon={<Plus size={20} color={theme.background} />}
          style={styles.addButton}
        />
      )}
    </View>
  );

  const rightPanel = selectedIngredient ? (
    <View style={styles.detailsContent}>
      <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.detailsTitleContainer}>
          <Leaf size={28} color={theme.primary} />
          <View>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>
              {selectedIngredient.name}
            </Text>
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16, marginTop: 2 }}>
              {formatCostDisplay(selectedIngredient)}
            </Text>
          </View>
        </View>

        <View style={styles.headerButtons}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => openEdit(selectedIngredient)}
            >
              <Edit size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handleDelete(selectedIngredient.id)}
            >
              <Trash2 size={18} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1, marginTop: 16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.infoCardTitle, { color: theme.text }]}>{t('ingredients.stockSummary')}</Text>
          <View style={styles.infoRow}>
            <Text style={{ color: theme.textSecondary }}>{t('ingredients.currentStock')}:</Text>
            <Text style={{ fontWeight: '700', color: theme.text }}>
              {formatQtyWithUnit(selectedIngredient.current_stock, selectedIngredient.item_unit)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={{ color: theme.textSecondary }}>{t('ingredients.minStockAlert')}:</Text>
            <Text style={{ fontWeight: '600', color: theme.textSecondary }}>
              {formatQtyWithUnit(selectedIngredient.min_stock_level, selectedIngredient.item_unit)}
            </Text>
          </View>
          {selectedIngredient.supplier_name ? (
            <View style={styles.infoRow}>
              <Text style={{ color: theme.textSecondary }}>{t('suppliers.title')}:</Text>
              <Text style={{ fontWeight: '600', color: theme.text }}>
                {selectedIngredient.supplier_name}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  ) : (
    <View style={styles.emptyState}>
      <Leaf size={64} color={theme.textDisabled} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {t('ingredients.noIngredients')}
      </Text>
    </View>
  );

  return (
    <>
      <Header title={t('ingredients.title')} />
      <DripContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        showSecondaryMobile={!!selectedIngredient}
        onMobileBack={() => setSelectedIngredient(null)}
        backButtonTitle={t('common.back')}
        childrenPadding={16}
      />

      <DripSheet
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={isEditing ? t('ingredients.editIngredient') : t('ingredients.newIngredient')}
        headerIcon={<Leaf size={20} color={theme.primary} />}
        footer={
          <View style={styles.formFooterActions}>
            <DripButton
              title={t('common.cancel')}
              onPress={() => {
                setShowForm(false);
                resetForm();
              }}
              variant="secondary"
              style={styles.formButton}
            />
            <DripButton
              title={t('common.save')}
              onPress={handleSave}
              style={styles.formButton}
            />
          </View>
        }
      >
        <DripInput
          label={t('ingredients.name')}
          value={nameInput}
          onChangeText={(v) => {
            setNameInput(v);
            if (v.trim()) setErrorName('');
          }}
          error={errorName}
        />

        <DripDropdown
          label={t('ingredients.selectSupplier')}
          options={suppliers}
          value={supplierIdInput}
          onSelect={(val) => setSupplierIdInput(val)}
        />

        {/* Cost Type 3-button Segmented Toggle */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t('ingredients.costType')}
        </Text>
        <View style={[styles.segmentedContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
          {COST_TYPES.map((ct) => {
            const active = costTypeInput === ct.id;
            return (
              <TouchableOpacity
                key={ct.id}
                style={[
                  styles.segmentBtn,
                  active && { backgroundColor: theme.primary },
                ]}
                onPress={() => setCostTypeInput(ct.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: active ? theme.background : theme.textSecondary },
                  ]}
                >
                  {t(ct.labelKey as any)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Conditional Cost Inputs */}
        {costTypeInput === 'per_gram_manual' && (
          <DripInput
            label={t('ingredients.costPerGram')}
            value={costPerGramInput}
            onChangeText={setCostPerGramInput}
            keyboardType="numeric"
            placeholder="e.g. 50"
          />
        )}

        {costTypeInput === 'per_gram_auto' && (
          <>
            <DripInput
              label={t('ingredients.buyPrice')}
              value={buyPriceInput}
              onChangeText={setBuyPriceInput}
              keyboardType="numeric"
              placeholder="e.g. 25000"
            />
            <DripInput
              label={t('ingredients.itemQty')}
              value={itemQtyInput}
              onChangeText={setItemQtyInput}
              keyboardType="numeric"
              placeholder="e.g. 1000"
            />
            <View style={[styles.autoCalcBox, { backgroundColor: theme.primary + '15' }]}>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {t('ingredients.costApprox')} {itemUnitInput === 'kg' ? 'g' : itemUnitInput === 'l' ? 'ml' : itemUnitInput} ≈
              </Text>
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 15 }}>
                {computedAutoCost != null ? formatCurrency(computedAutoCost) : '—'}
              </Text>
            </View>
          </>
        )}

        {costTypeInput === 'per_pcs' && (
          <DripInput
            label={t('ingredients.buyPrice')}
            value={buyPriceInput}
            onChangeText={setBuyPriceInput}
            keyboardType="numeric"
            placeholder="e.g. 1500"
          />
        )}

        {/* Unit Measure Selector */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t('ingredients.unitMeasure')}
        </Text>
        <View style={[styles.unitCategoryContainer, { backgroundColor: theme.input }]}>
          {[
            { id: 'weight', label: t('ingredients.weight'), sub: 'g / kg', isCurrent: itemUnitInput === 'g' || itemUnitInput === 'kg', defaultUnit: 'g' as ItemUnit },
            { id: 'volume', label: t('ingredients.volume'), sub: 'ml / l', isCurrent: itemUnitInput === 'ml' || itemUnitInput === 'l', defaultUnit: 'ml' as ItemUnit },
            { id: 'count', label: t('ingredients.count'), sub: 'pcs', isCurrent: itemUnitInput === 'pcs', defaultUnit: 'pcs' as ItemUnit },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.unitCatBtn,
                cat.isCurrent && { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 },
              ]}
              onPress={() => {
                if (!cat.isCurrent) setItemUnitInput(cat.defaultUnit);
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: cat.isCurrent ? theme.primary : theme.textSecondary }}>
                {cat.label}
              </Text>
              <Text style={{ fontSize: 10, color: cat.isCurrent ? theme.primary : theme.textTertiary }}>
                {cat.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          {getCompatibleUnits(itemUnitInput).map((u) => {
            const active = itemUnitInput === u;
            return (
              <TouchableOpacity
                key={u}
                style={[
                  styles.subUnitPill,
                  { backgroundColor: active ? theme.primary : theme.input },
                ]}
                onPress={() => setItemUnitInput(u)}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: active ? theme.background : theme.text }}>
                  {u}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stock Alert Settings */}
        <DripInput
          label={t('ingredients.minStockAlert')}
          value={minStockInput}
          onChangeText={setMinStockInput}
          keyboardType="numeric"
        />

        <View style={[styles.switchRow, { backgroundColor: theme.input }]}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
            {t('ingredients.lowStockAlert')}
          </Text>
          <Switch
            value={lowStockAlert}
            onValueChange={setLowStockAlert}
            trackColor={{ false: '#D1D5DB', true: theme.primary }}
          />
        </View>
      </DripSheet>
    </>
  );
}

const styles = StyleSheet.create({
  leftPanelContent: {
    flex: 1,
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
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardCost: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  cardSupplier: {
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
    fontSize: 12,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    marginTop: 16,
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 8,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    marginBottom: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  autoCalcBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  unitCategoryContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    gap: 6,
  },
  unitCatBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  subUnitPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 16,
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
