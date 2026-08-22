import { DripButton } from '@/components/Button';
import { DripContainer } from '@/components/Container';
import { DripDropdown, DropdownOption } from '@/components/Dropdown';
import { Header } from '@/components/Header';
import { DripInput } from '@/components/Input';
import { DripSearchBar } from '@/components/SearchBar';
import { DripSheet } from '@/components/Sheet';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { Category, Product, RecipeDetail, StockSource } from '@/constants/types';
import { formatCurrency } from '@/lib/currency';
import { calculateHPP } from '@/lib/hpp';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Edit, Package, Plus, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function ProductsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [recipes, setRecipes] = useState<RecipeDetail[]>([]);
  const [recipeOptions, setRecipeOptions] = useState<DropdownOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [skuInput, setSkuInput] = useState('');
  const [categoryIdInput, setCategoryIdInput] = useState<string>('');
  const [recipeIdInput, setRecipeIdInput] = useState<string>('');
  const [useHpp, setUseHpp] = useState(false);
  const [buyPriceInput, setBuyPriceInput] = useState('');
  const [sellPriceInput, setSellPriceInput] = useState('');
  const [useStock, setUseStock] = useState(true);
  const [stockQtyInput, setStockQtyInput] = useState('0');
  const [minStockInput, setMinStockInput] = useState('0');
  const [stockSource, setStockSource] = useState<StockSource>('self');
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
      // 1. Fetch Categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (catData) {
        setCategories([
          { label: t('common.uncategorized'), value: '' },
          ...catData.map((c: Category) => ({ label: c.name, value: c.id })),
        ]);
      }

      // 2. Fetch Recipes
      const { data: recData } = await supabase
        .from('recipes')
        .select('*')
        .order('name');

      if (recData) {
        const fullRecipes: RecipeDetail[] = await Promise.all(
          recData.map(async (r: any) => {
            const { data: rIngs } = await supabase
              .from('recipe_ingredients')
              .select('*, ingredients(cost_per_gram)')
              .eq('recipe_id', r.id);

            const { data: rExtras } = await supabase
              .from('recipe_extras')
              .select('*')
              .eq('recipe_id', r.id);

            const hpp = calculateHPP(
              (rIngs || []).map((ri: any) => ({
                cost_per_gram: ri.ingredients?.cost_per_gram || 0,
                qty_used: ri.qty_used,
              })),
              rExtras || []
            );

            return {
              id: r.id,
              name: r.name,
              ingredients: rIngs || [],
              extras: rExtras || [],
              hpp,
            };
          })
        );

        setRecipes(fullRecipes);
        setRecipeOptions([
          { label: `${t('common.none')} (Direct Cost)`, value: '' },
          ...fullRecipes.map((r) => ({
            label: `${r.name} (HPP: ${formatCurrency(r.hpp)})`,
            value: r.id,
          })),
        ]);
      }

      // 3. Fetch Products with joined category & recipe
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name), recipes(name)')
        .order('name');

      if (error) {
        console.log('Error fetching products:', error);
        setProducts([]);
      } else if (data) {
        const formatted: Product[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || `SKU-${p.id.slice(0, 5)}`,
          category_id: p.category_id || null,
          category_name: p.categories?.name || null,
          buy_price: p.buy_price != null ? Number(p.buy_price) : 0,
          use_hpp: p.use_hpp ?? 0,
          sell_price: Number(p.sell_price || p.base_price || 0),
          recipe_id: p.recipe_id || null,
          recipe_name: p.recipes?.name || null,
          image_uri: p.image_uri || p.image_url || null,
          use_stock: p.use_stock ?? 1,
          stock_quantity: Number(p.stock_quantity || 0),
          min_stock_level: Number(p.min_stock_level || 0),
          low_stock_alert: p.low_stock_alert ?? 1,
          stock_source: p.stock_source || 'self',
          last_restocked_at: p.last_restocked_at || null,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));
        setProducts(formatted);
      }
    } catch (e) {
      console.log('Error fetching products:', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.category_name && p.category_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setErrorName(t('validation.required'));
      return;
    }

    let calculatedCost = parseFloat(buyPriceInput) || 0;
    if (useHpp && recipeIdInput) {
      const matchedRec = recipes.find((r) => r.id === recipeIdInput);
      if (matchedRec) {
        calculatedCost = matchedRec.hpp;
      }
    }

    const payload = {
      name: trimmed,
      sku: skuInput.trim() || `SKU-${Date.now().toString().slice(-5)}`,
      category_id: categoryIdInput || null,
      recipe_id: recipeIdInput || null,
      use_hpp: useHpp ? 1 : 0,
      buy_price: calculatedCost,
      sell_price: parseFloat(sellPriceInput) || 0,
      base_price: parseFloat(sellPriceInput) || 0,
      use_stock: useStock ? 1 : 0,
      stock_quantity: parseFloat(stockQtyInput) || 0,
      min_stock_level: parseFloat(minStockInput) || 0,
      stock_source: stockSource,
      updated_at: new Date().toISOString(),
    };

    const catName = categories.find((c) => c.value === categoryIdInput)?.label || null;
    const recName = recipes.find((r) => r.id === recipeIdInput)?.name || null;

    if (isEditing && selectedProduct) {
      setProducts(
        products.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, ...payload, category_name: catName, recipe_name: recName }
            : p
        )
      );
      setSelectedProduct({ ...selectedProduct, ...payload, category_name: catName, recipe_name: recName });

      try {
        await supabase.from('products').update(payload).eq('id', selectedProduct.id);
      } catch (e) {
        console.log('Error updating product in DB:', e);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([{ ...payload, status: 'active' }])
          .select();

        if (!error && data && data[0]) {
          const newProd: Product = {
            id: data[0].id,
            ...payload,
            low_stock_alert: 1,
            last_restocked_at: null,
            category_name: catName,
            recipe_name: recName,
          };
          setProducts([newProd, ...products]);
          setSelectedProduct(newProd);
        } else {
          const fallback: Product = {
            id: Date.now().toString(),
            ...payload,
            low_stock_alert: 1,
            last_restocked_at: null,
            category_name: catName,
            recipe_name: recName,
          };
          setProducts([fallback, ...products]);
          setSelectedProduct(fallback);
        }
      } catch (e) {
        console.log('Error creating product in DB:', e);
      }
    }

    setShowForm(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setNameInput(product.name);
    setSkuInput(product.sku);
    setCategoryIdInput(product.category_id || '');
    setRecipeIdInput(product.recipe_id || '');
    setUseHpp(product.use_hpp !== 0);
    setBuyPriceInput(product.buy_price != null ? String(product.buy_price) : '');
    setSellPriceInput(product.sell_price != null ? String(product.sell_price) : '');
    setUseStock(product.use_stock !== 0);
    setStockQtyInput(String(product.stock_quantity ?? 0));
    setMinStockInput(String(product.min_stock_level ?? 0));
    setStockSource(product.stock_source || 'self');
    setErrorName('');
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.log('Error deleting product from DB:', e);
    }

    setProducts(products.filter((p) => p.id !== id));
    if (selectedProduct?.id === id) {
      setSelectedProduct(null);
    }
  };

  const resetForm = () => {
    setNameInput('');
    setSkuInput('');
    setCategoryIdInput('');
    setRecipeIdInput('');
    setUseHpp(false);
    setBuyPriceInput('');
    setSellPriceInput('');
    setUseStock(true);
    setStockQtyInput('0');
    setMinStockInput('0');
    setStockSource('self');
    setErrorName('');
    setIsEditing(false);
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
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Package size={48} color={theme.textDisabled} />
          <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
            {t('products.noProducts')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filteredProducts.map((p) => {
            const isSelected = selectedProduct?.id === p.id;
            const isLowStock = p.use_stock && p.stock_quantity <= p.min_stock_level;

            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedProduct(p)}
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
                      {p.name}
                    </Text>
                    <Text
                      style={[
                        styles.cardPrice,
                        { color: isSelected ? theme.background + 'EE' : theme.primary },
                      ]}
                    >
                      {formatCurrency(p.sell_price)}
                    </Text>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        { color: isSelected ? theme.background + 'CC' : theme.textSecondary },
                      ]}
                    >
                      {p.category_name || t('common.uncategorized')} • {t('products.sku')}: {p.sku}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    {p.use_stock ? (
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
                          {p.stock_quantity} pcs
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.cardActions}>
                      {canEdit && (
                        <TouchableOpacity
                          style={[
                            styles.actionIconBtn,
                            { backgroundColor: isSelected ? theme.background + '20' : theme.input },
                          ]}
                          onPress={() => openEdit(p)}
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
                          onPress={() => handleDelete(p.id)}
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
          title={t('products.newProduct')}
          onPress={openCreate}
          icon={<Plus size={20} color={theme.background} />}
          style={styles.addButton}
        />
      )}
    </View>
  );

  const rightPanel = selectedProduct ? (
    <View style={styles.detailsContent}>
      <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.detailsTitleContainer}>
          <Package size={28} color={theme.primary} />
          <View>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>
              {selectedProduct.name}
            </Text>
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16, marginTop: 2 }}>
              {formatCurrency(selectedProduct.sell_price)}
            </Text>
          </View>
        </View>

        <View style={styles.headerButtons}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => openEdit(selectedProduct)}
            >
              <Edit size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handleDelete(selectedProduct.id)}
            >
              <Trash2 size={18} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1, marginTop: 16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.infoCardTitle, { color: theme.text }]}>{t('products.productInfo')}</Text>
          <View style={styles.infoRow}>
            <Text style={{ color: theme.textSecondary }}>{t('products.sku')}:</Text>
            <Text style={{ fontWeight: '700', color: theme.text }}>{selectedProduct.sku}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={{ color: theme.textSecondary }}>{t('products.category')}:</Text>
            <Text style={{ fontWeight: '600', color: theme.text }}>
              {selectedProduct.category_name || t('common.none')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={{ color: theme.textSecondary }}>{t('products.costPrice')}:</Text>
            <Text style={{ fontWeight: '700', color: theme.primary }}>
              {formatCurrency(selectedProduct.buy_price)}
            </Text>
          </View>
          {selectedProduct.recipe_name ? (
            <View style={styles.infoRow}>
              <Text style={{ color: theme.textSecondary }}>{t('products.recipe')}:</Text>
              <Text style={{ fontWeight: '600', color: theme.text }}>
                {selectedProduct.recipe_name}
              </Text>
            </View>
          ) : null}
          {selectedProduct.use_stock ? (
            <View style={styles.infoRow}>
              <Text style={{ color: theme.textSecondary }}>{t('products.stockQty')}:</Text>
              <Text style={{ fontWeight: '700', color: theme.text }}>
                {selectedProduct.stock_quantity} pcs (Min: {selectedProduct.min_stock_level})
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  ) : (
    <View style={styles.emptyState}>
      <Package size={64} color={theme.textDisabled} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {t('products.noProducts')}
      </Text>
    </View>
  );

  return (
    <>
      <Header title={t('products.title')} />
      <DripContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        showSecondaryMobile={!!selectedProduct}
        onMobileBack={() => setSelectedProduct(null)}
        backButtonTitle={t('common.back')}
        childrenPadding={16}
      />

      <DripSheet
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={isEditing ? t('products.editProduct') : t('products.newProduct')}
        headerIcon={<Package size={20} color={theme.primary} />}
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
          label={t('products.name')}
          value={nameInput}
          onChangeText={(v) => {
            setNameInput(v);
            if (v.trim()) setErrorName('');
          }}
          error={errorName}
        />

        <DripInput
          label={t('products.sku')}
          value={skuInput}
          onChangeText={setSkuInput}
          placeholder="e.g. COF-001"
        />

        <DripDropdown
          label={t('products.category')}
          options={categories}
          value={categoryIdInput}
          onSelect={(val) => setCategoryIdInput(val)}
        />

        <DripDropdown
          label={t('products.recipe')}
          options={recipeOptions}
          value={recipeIdInput}
          onSelect={(val) => {
            setRecipeIdInput(val);
            if (val) {
              setUseHpp(true);
            }
          }}
        />

        {recipeIdInput ? (
          <View style={[styles.switchRow, { backgroundColor: theme.input }]}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
              {t('products.useHpp')}
            </Text>
            <Switch
              value={useHpp}
              onValueChange={setUseHpp}
              trackColor={{ false: '#D1D5DB', true: theme.primary }}
            />
          </View>
        ) : null}

        {!useHpp ? (
          <DripInput
            label={t('products.buyPrice')}
            value={buyPriceInput}
            onChangeText={setBuyPriceInput}
            keyboardType="numeric"
            placeholder="e.g. 12000"
          />
        ) : null}

        <DripInput
          label={t('products.sellPrice')}
          value={sellPriceInput}
          onChangeText={setSellPriceInput}
          keyboardType="numeric"
          placeholder="e.g. 25000"
        />

        <View style={[styles.switchRow, { backgroundColor: theme.input }]}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
            {t('products.useStock')}
          </Text>
          <Switch
            value={useStock}
            onValueChange={setUseStock}
            trackColor={{ false: '#D1D5DB', true: theme.primary }}
          />
        </View>

        {useStock ? (
          <>
            <DripInput
              label={t('products.stockQty')}
              value={stockQtyInput}
              onChangeText={setStockQtyInput}
              keyboardType="numeric"
            />
            <DripInput
              label={t('products.minStock')}
              value={minStockInput}
              onChangeText={setMinStockInput}
              keyboardType="numeric"
            />
          </>
        ) : null}
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
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
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
