import { DripButton } from '@/components/Button';
import { DripContainer } from '@/components/Container';
import { DripDropdown, DropdownOption } from '@/components/Dropdown';
import { Header } from '@/components/Header';
import { DripInput } from '@/components/Input';
import { DripScannerModal } from '@/components/ScannerModal';
import { DripSearchBar } from '@/components/SearchBar';
import { DripSheet } from '@/components/Sheet';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { InventoryFilter, InventoryFormData, InventoryItem, InventoryValidationErrors } from '@/constants/inventory/types';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Box, DollarSign, Edit, MapPin, Package, Plus, ScanLine, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CATEGORY_OPTIONS: DropdownOption[] = [
  { label: 'Ingredients', value: 'Ingredients' },
  { label: 'Beverages', value: 'Beverages' },
  { label: 'Packaging', value: 'Packaging' },
  { label: 'Retail', value: 'Retail' },
  { label: 'General', value: 'General' },
];

const UNIT_OPTIONS: DropdownOption[] = [
  { label: 'Pieces (pcs)', value: 'pcs' },
  { label: 'Kilograms (kg)', value: 'kg' },
  { label: 'Grams (g)', value: 'g' },
  { label: 'Liters (liters)', value: 'liters' },
  { label: 'Milliliters (ml)', value: 'ml' },
  { label: 'Box (box)', value: 'box' },
  { label: 'Pack (pack)', value: 'pack' },
];

export default function InventoryScreen() {
  const { theme } = useTheme();
  const { hasPermission } = useAuth();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<DropdownOption[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [filter, setFilter] = useState<InventoryFilter>({
    search: '',
    category: '',
    status: 'all',
    supplier: '',
    location: '',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    sku: '',
    barcode: '',
    category: 'General',
    description: '',
    unit: 'pcs',
    unitCost: 0,
    sellingPrice: 0,
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    supplierId: '',
    location: '',
    expiryDate: null,
  });
  
  const [errors, setErrors] = useState<InventoryValidationErrors>({});
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    reason: '',
  });

  const canCreate = hasPermission('inventory.create');
  const canEdit = hasPermission('inventory.edit');
  const canDelete = hasPermission('inventory.delete');
  const canManage = hasPermission('inventory.manage');

  useEffect(() => {
    fetchInventory();
    fetchSuppliersList();
  }, []);

  const fetchSuppliersList = async () => {
    try {
      const { data } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name', { ascending: true });

      if (data && data.length > 0) {
        setSupplierOptions(data.map(s => ({ label: s.name, value: s.id })));
      } else {
        setSupplierOptions([]);
      }
    } catch (e) {
      console.log('Error fetching supplier options for dropdown:', e);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*, suppliers(name)')
        .order('updated_at', { ascending: false });

      if (error) {
        console.log('Error fetching inventory items from DB:', error);
        setInventory([]);
      } else if (data) {
        const formatted: InventoryItem[] = data.map(item => ({
          id: item.id,
          name: item.name || 'Item',
          sku: item.sku || `SKU-${item.id.slice(0, 5)}`,
          barcode: item.barcode || '',
          category: item.category || 'General',
          description: item.description || '',
          unit: item.unit || 'pcs',
          unitCost: Number(item.unit_cost || item.unitCost || 0),
          sellingPrice: Number(item.selling_price || item.sellingPrice || 0),
          currentStock: Number(item.quantity ?? item.currentStock ?? 0),
          minStock: Number(item.min_stock || item.minStock || 0),
          maxStock: Number(item.max_stock || item.maxStock || 100),
          reorderPoint: Number(item.reorder_point || item.reorderPoint || 0),
          reorderQuantity: Number(item.reorder_quantity || item.reorderQuantity || 0),
          supplierId: item.supplier_id || item.supplierId || '',
          supplierName: item.suppliers?.name || item.supplier_name || item.supplierName || 'General Supplier',
          location: item.location || 'Main Storage',
          expiryDate: item.expiry_date || item.expiryDate || null,
          lastRestockDate: item.last_restock_date || item.lastRestockDate || null,
          isActive: item.is_active ?? true,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
        }));
        setInventory(formatted);
      }
    } catch (e) {
      console.log('Error fetching inventory:', e);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'out-of-stock';
    if (item.currentStock <= item.minStock) return 'low-stock';
    return 'in-stock';
  };

  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        item.sku.toLowerCase().includes(filter.search.toLowerCase()) ||
        item.barcode.includes(filter.search);
      const matchesCategory = !filter.category || item.category === filter.category;
      const matchesStatus = filter.status === 'all' || getStockStatus(item) === filter.status;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      const modifier = filter.sortOrder === 'asc' ? 1 : -1;
      switch (filter.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * modifier;
        case 'stock':
          return (a.currentStock - b.currentStock) * modifier;
        case 'cost':
          return (a.unitCost - b.unitCost) * modifier;
        default:
          return 0;
      }
    });

  const stockAlerts = inventory.filter(item => {
    const status = getStockStatus(item);
    return status === 'low-stock' || status === 'out-of-stock';
  });

  const validateForm = (): boolean => {
    const newErrors: InventoryValidationErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Get selected supplier name
    const matchedSupplier = supplierOptions.find(s => s.value === formData.supplierId);
    const suppName = matchedSupplier ? matchedSupplier.label : 'General Supplier';

    const payload = {
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode,
      category: formData.category,
      description: formData.description,
      unit: formData.unit,
      unit_cost: formData.unitCost,
      selling_price: formData.sellingPrice,
      quantity: formData.currentStock,
      min_stock: formData.minStock,
      max_stock: formData.maxStock,
      reorder_point: formData.reorderPoint,
      reorder_quantity: formData.reorderQuantity,
      supplier_id: formData.supplierId || null,
      location: formData.location,
      expiry_date: formData.expiryDate,
      updated_at: new Date().toISOString(),
    };

    if (isEditing && selectedItem) {
      setInventory(inventory.map(item => 
        item.id === selectedItem.id 
          ? { ...item, ...formData, supplierName: suppName, updatedAt: new Date().toISOString() }
          : item
      ));
      setSelectedItem({ ...selectedItem, ...formData, supplierName: suppName, updatedAt: new Date().toISOString() });

      try {
        await supabase.from('inventory_items').update(payload).eq('id', selectedItem.id);
      } catch (e) {
        console.log('DB update error:', e);
      }
    } else {
      try {
        const { data, error } = await supabase.from('inventory_items').insert([{
          ...payload,
          is_active: true,
          created_at: new Date().toISOString(),
        }]).select();

        if (!error && data && data[0]) {
          const newItem: InventoryItem = {
            id: data[0].id,
            ...formData,
            supplierName: suppName,
            lastRestockDate: new Date().toISOString(),
            isActive: true,
            createdAt: data[0].created_at || new Date().toISOString(),
            updatedAt: data[0].updated_at || new Date().toISOString(),
          };
          setInventory([newItem, ...inventory]);
          setSelectedItem(newItem);
        } else {
          const newItem: InventoryItem = {
            id: Date.now().toString(),
            ...formData,
            supplierName: suppName,
            lastRestockDate: new Date().toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setInventory([newItem, ...inventory]);
          setSelectedItem(newItem);
        }
      } catch (e) {
        console.log('DB insert error:', e);
      }
    }

    setShowForm(false);
    resetForm();
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      category: item.category,
      description: item.description,
      unit: item.unit,
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice,
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      reorderPoint: item.reorderPoint,
      reorderQuantity: item.reorderQuantity,
      supplierId: item.supplierId,
      location: item.location,
      expiryDate: item.expiryDate,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
      if (error) console.log('Error deleting inventory item from DB:', error);
    } catch (e) {
      console.log('DB delete error:', e);
    }

    setInventory(inventory.filter(item => item.id !== itemId));
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }
  };

  const handleStockAdjustment = async () => {
    if (!selectedItem) return;

    const newStock = Math.max(0, selectedItem.currentStock + Number(stockAdjustment.quantity));
    
    setInventory(inventory.map(item => 
      item.id === selectedItem.id 
        ? { 
            ...item, 
            currentStock: newStock,
            lastRestockDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : item
    ));

    setSelectedItem({
      ...selectedItem,
      currentStock: newStock,
      lastRestockDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      await supabase.from('inventory_items').update({
        quantity: newStock,
        updated_at: new Date().toISOString(),
      }).eq('id', selectedItem.id);
    } catch (e) {
      console.log('DB stock adjustment error:', e);
    }

    setShowStockModal(false);
    setStockAdjustment({ quantity: 0, reason: '' });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: 'General',
      description: '',
      unit: 'pcs',
      unitCost: 0,
      sellingPrice: 0,
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      reorderPoint: 0,
      reorderQuantity: 0,
      supplierId: '',
      location: '',
      expiryDate: null,
    });
    setErrors({});
    setIsEditing(false);
  };

  // Left Panel Content: Stock Alerts + SearchBar + Item List
  const leftPanel = (
    <View style={styles.leftPanelContent}>
      {stockAlerts.length > 0 && (
        <View style={[styles.alertsContainer, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}>
          <View style={styles.alertsHeader}>
            <AlertTriangle size={20} color={theme.warning} />
            <Text style={[styles.alertsTitle, { color: theme.warning }]}>
              Stock Alerts ({stockAlerts.length})
            </Text>
          </View>
        </View>
      )}

      <DripSearchBar
        placeholder="Search item name, SKU, or barcode..."
        value={filter.search}
        onChangeText={(text) => setFilter({ ...filter, search: text })}
        onClear={() => setFilter({ ...filter, search: '' })}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 30 }} />
      ) : filteredInventory.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Package size={48} color={theme.textDisabled} />
          <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
            {filter.search ? 'No items found matching search query.' : 'No inventory items saved in database.'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.inventoryList} showsVerticalScrollIndicator={false}>
          {filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item);
            const statusColor = stockStatus === 'out-of-stock' ? theme.error : 
                              stockStatus === 'low-stock' ? theme.warning : theme.success;
            const isSelected = selectedItem?.id === item.id;
            
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.inventoryCard,
                  { 
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border
                  }
                ]}
                onPress={() => setSelectedItem(item)}
                activeOpacity={0.7}
              >
                <View style={styles.inventoryCardHeader}>
                  <View style={styles.inventoryInfo}>
                    <Text style={[
                      styles.inventoryName,
                      { color: isSelected ? theme.background : theme.text }
                    ]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.inventorySku, { color: isSelected ? theme.background + 'D0' : theme.textSecondary }]}>
                      {item.sku}
                    </Text>
                  </View>
                  <View style={[
                    styles.stockBadge,
                    { backgroundColor: isSelected ? theme.background + '30' : statusColor + '20' }
                  ]}>
                    <Text style={[styles.stockText, { color: isSelected ? theme.background : statusColor }]}>
                      {item.currentStock} {item.unit}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.inventoryDetails}>
                  <View style={styles.detailItem}>
                    <Box size={14} color={isSelected ? theme.background : theme.textSecondary} />
                    <Text style={[styles.detailText, { color: isSelected ? theme.background : theme.textSecondary }]}>
                      {item.category}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <DollarSign size={14} color={isSelected ? theme.background : theme.textSecondary} />
                    <Text style={[styles.detailText, { color: isSelected ? theme.background : theme.textSecondary }]}>
                      ${item.unitCost.toFixed(2)}/{item.unit}
                    </Text>
                  </View>
                </View>

                {stockStatus !== 'in-stock' && (
                  <View style={styles.alertRow}>
                    <AlertTriangle size={14} color={isSelected ? theme.background : statusColor} />
                    <Text style={[styles.alertText, { color: isSelected ? theme.background : statusColor }]}>
                      {stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Low Stock'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {canCreate && (
        <DripButton
          title="Add Item"
          onPress={() => {
            resetForm();
            setShowForm(true);
          }}
          icon={<Plus size={20} color={theme.background} />}
          style={styles.addButton}
        />
      )}
    </View>
  );

  // Right Panel Content: Details of Selected Inventory Item
  const rightPanel = selectedItem ? (
    <View style={styles.itemDetails}>
      <View style={styles.detailsHeader}>
        <View style={styles.detailsHeaderLeft}>
          <Package size={32} color={theme.primary} />
          <View style={styles.detailsTitle}>
            <Text style={[styles.detailsName, { color: theme.text }]}>
              {selectedItem.name}
            </Text>
            <Text style={[styles.detailsSku, { color: theme.textSecondary }]}>
              {selectedItem.sku}
            </Text>
          </View>
        </View>
        <View style={styles.detailsActions}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.card }]}
              onPress={() => handleEdit(selectedItem)}
              activeOpacity={0.7}
            >
              <Edit size={20} color={theme.primary} />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.card }]}
              onPress={() => handleDelete(selectedItem.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
        {/* Stock Status Card */}
        <View style={[styles.stockStatusCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.stockStatusHeader}>
            <Text style={[styles.stockStatusTitle, { color: theme.text }]}>Current Stock</Text>
            <View style={[
              styles.stockStatusBadge,
              { backgroundColor: getStockStatus(selectedItem) === 'in-stock' ? theme.success + '20' : 
                              getStockStatus(selectedItem) === 'low-stock' ? theme.warning + '20' : theme.error + '20' }
            ]}>
              <Text style={[
                styles.stockStatusText,
                { color: getStockStatus(selectedItem) === 'in-stock' ? theme.success : 
                        getStockStatus(selectedItem) === 'low-stock' ? theme.warning : theme.error }
              ]}>
                {getStockStatus(selectedItem) === 'in-stock' ? 'In Stock' : 
                 getStockStatus(selectedItem) === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>
          
          <View style={styles.stockLevels}>
            <View style={styles.stockLevel}>
              <Text style={[styles.stockLevelLabel, { color: theme.textTertiary }]}>Current</Text>
              <Text style={[styles.stockLevelValue, { color: theme.text }]}>
                {selectedItem.currentStock} {selectedItem.unit}
              </Text>
            </View>
            <View style={styles.stockLevel}>
              <Text style={[styles.stockLevelLabel, { color: theme.textTertiary }]}>Min Alert</Text>
              <Text style={[styles.stockLevelValue, { color: theme.textSecondary }]}>
                {selectedItem.minStock} {selectedItem.unit}
              </Text>
            </View>
            <View style={styles.stockLevel}>
              <Text style={[styles.stockLevelLabel, { color: theme.textTertiary }]}>Max Limit</Text>
              <Text style={[styles.stockLevelValue, { color: theme.textSecondary }]}>
                {selectedItem.maxStock} {selectedItem.unit}
              </Text>
            </View>
          </View>

          {canManage && (
            <DripButton
              title="Adjust Stock"
              onPress={() => setShowStockModal(true)}
              variant="secondary"
              style={styles.adjustStockButton}
            />
          )}
        </View>

        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Item Information</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Category:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>{selectedItem.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Description:</Text>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>{selectedItem.description || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Barcode:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>{selectedItem.barcode || '-'}</Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Pricing</Text>
          <View style={styles.detailRow}>
            <DollarSign size={18} color={theme.success} />
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Unit Cost:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>${selectedItem.unitCost.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <DollarSign size={18} color={theme.primary} />
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Selling Price:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>${selectedItem.sellingPrice.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Supplier & Location</Text>
          <View style={styles.detailRow}>
            <Package size={18} color={theme.textSecondary} />
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Supplier:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>{selectedItem.supplierName}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={18} color={theme.textSecondary} />
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Location:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>{selectedItem.location}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  ) : (
    <View style={styles.emptyState}>
      <Package size={64} color={theme.textDisabled} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        Select an item to view details
      </Text>
    </View>
  );

  return (
    <>
      <Header title="Warehouse & Stock" />
      <DripContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        showSecondaryMobile={!!selectedItem}
        onMobileBack={() => setSelectedItem(null)}
        backButtonTitle="Back to Inventory"
        childrenPadding={16}
      />

      {/* DripSheet: Add / Edit Item Form */}
      <DripSheet
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={isEditing ? 'Edit Item' : 'Add New Item'}
        headerIcon={<Package size={20} color={theme.primary} />}
        footer={
          <View style={styles.formFooterActions}>
            <DripButton
              title="Cancel"
              onPress={() => {
                setShowForm(false);
                resetForm();
              }}
              variant="secondary"
              style={styles.formButton}
            />
            <DripButton
              title={isEditing ? 'Update' : 'Create'}
              onPress={handleSave}
              style={styles.formButton}
            />
          </View>
        }
      >
        <DripInput
          label="Item Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          error={errors.name}
        />
        <DripInput
          label="SKU Code"
          value={formData.sku}
          onChangeText={(text) => setFormData({ ...formData, sku: text })}
          error={errors.sku}
        />
        
        {/* Barcode input: Hides sheet temporarily without resetting form data, opens scanner */}
        <DripInput
          label="Barcode / EAN"
          value={formData.barcode}
          onChangeText={(text) => setFormData({ ...formData, barcode: text })}
          rightIcon={<ScanLine size={20} color={theme.primary} />}
          onRightIconPress={() => {
            setShowForm(false);
            setTimeout(() => {
              setShowScanner(true);
            }, 150);
          }}
        />

        {/* Dropdown for Supplier selection */}
        <DripDropdown
          label="Supplier"
          options={supplierOptions.length > 0 ? supplierOptions : [{ label: 'No Suppliers (Add in Suppliers page)', value: '' }]}
          value={formData.supplierId}
          onSelect={(val) => setFormData({ ...formData, supplierId: val })}
        />

        {/* Dropdown for Category selection */}
        <DripDropdown
          label="Category"
          options={CATEGORY_OPTIONS}
          value={formData.category}
          onSelect={(val) => setFormData({ ...formData, category: val })}
          error={errors.category}
        />

        {/* Dropdown for Unit selection */}
        <DripDropdown
          label="Unit of Measurement"
          options={UNIT_OPTIONS}
          value={formData.unit}
          onSelect={(val) => setFormData({ ...formData, unit: val })}
        />

        <DripInput
          label="Description"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={3}
        />

        <DripInput
          label="Unit Cost ($)"
          value={formData.unitCost.toString()}
          onChangeText={(text) => setFormData({ ...formData, unitCost: parseFloat(text) || 0 })}
          keyboardType="decimal-pad"
        />
        <DripInput
          label="Selling Price ($)"
          value={formData.sellingPrice.toString()}
          onChangeText={(text) => setFormData({ ...formData, sellingPrice: parseFloat(text) || 0 })}
          keyboardType="decimal-pad"
        />
        <DripInput
          label="Current Stock Quantity"
          value={formData.currentStock.toString()}
          onChangeText={(text) => setFormData({ ...formData, currentStock: parseInt(text) || 0 })}
          keyboardType="number-pad"
        />
        <DripInput
          label="Minimum Stock Alert Level"
          value={formData.minStock.toString()}
          onChangeText={(text) => setFormData({ ...formData, minStock: parseInt(text) || 0 })}
          keyboardType="number-pad"
        />
        <DripInput
          label="Storage Location"
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
          placeholder="e.g. Warehouse A, Fridge B"
        />
      </DripSheet>

      {/* DripScannerModal for Barcode / QR scanning: Re-opens form sheet after scan */}
      <DripScannerModal
        visible={showScanner}
        onClose={() => {
          setShowScanner(false);
          setTimeout(() => {
            setShowForm(true);
          }, 150);
        }}
        onScanSuccess={(scannedCode) => {
          setFormData((prev) => ({ ...prev, barcode: scannedCode }));
          setShowScanner(false);
          setTimeout(() => {
            setShowForm(true);
          }, 150);
        }}
      />

      {/* DripSheet: Adjust Stock Modal */}
      <DripSheet
        visible={showStockModal}
        onClose={() => setShowStockModal(false)}
        title="Adjust Stock Quantity"
        headerIcon={<Box size={20} color={theme.warning} />}
        footer={
          <View style={styles.formFooterActions}>
            <DripButton
              title="Cancel"
              onPress={() => setShowStockModal(false)}
              variant="secondary"
              style={styles.formButton}
            />
            <DripButton
              title="Confirm Adjustment"
              onPress={handleStockAdjustment}
              style={styles.formButton}
            />
          </View>
        }
      >
        <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 12 }}>
          Target: {selectedItem?.name} ({selectedItem?.currentStock} {selectedItem?.unit})
        </Text>
        <DripInput
          label="Adjustment Quantity (+ to add, - to reduce)"
          value={stockAdjustment.quantity.toString()}
          onChangeText={(text) => setStockAdjustment({ ...stockAdjustment, quantity: parseInt(text) || 0 })}
          keyboardType="number-pad"
        />
        <DripInput
          label="Reason for Adjustment"
          value={stockAdjustment.reason}
          onChangeText={(text) => setStockAdjustment({ ...stockAdjustment, reason: text })}
          placeholder="e.g. Intake, Damage, Stock Opname Correction"
        />
      </DripSheet>
    </>
  );
}

const styles = StyleSheet.create({
  leftPanelContent: {
    flex: 1,
  },
  alertsContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '600',
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
  inventoryList: {
    flex: 1,
  },
  inventoryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  inventoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  inventorySku: {
    fontSize: 12,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inventoryDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    marginTop: 16,
  },
  itemDetails: {
    flex: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  detailsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailsTitle: {
    flex: 1,
  },
  detailsName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailsSku: {
    fontSize: 14,
  },
  detailsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContent: {
    flex: 1,
  },
  stockStatusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  stockStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  stockStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockLevels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stockLevel: {
    alignItems: 'center',
  },
  stockLevelLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  stockLevelValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  adjustStockButton: {
    marginTop: 8,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 120,
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