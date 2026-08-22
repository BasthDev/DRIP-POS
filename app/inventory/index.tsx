import { DripButton } from '@/components/Button';
import { DripContainer } from '@/components/Container';
import { Header } from '@/components/Header';
import { DripInput } from '@/components/Input';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { InventoryFilter, InventoryFormData, InventoryItem, InventoryValidationErrors } from '@/constants/inventory/types';
import { AlertTriangle, Box, Calendar, DollarSign, Edit, MapPin, Package, Plus, Search, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    name: 'Premium Coffee Beans',
    sku: 'COF-001',
    barcode: '1234567890123',
    category: 'Ingredients',
    description: 'High-quality Arabica coffee beans for espresso',
    unit: 'kg',
    unitCost: 25.00,
    sellingPrice: 45.00,
    currentStock: 45,
    minStock: 20,
    maxStock: 100,
    reorderPoint: 25,
    reorderQuantity: 50,
    supplierId: '1',
    supplierName: 'Fresh Foods Distributors',
    location: 'Warehouse A',
    expiryDate: '2026-12-31',
    lastRestockDate: '2026-08-15',
    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-08-20',
  },
  {
    id: '2',
    name: 'Oat Milk',
    sku: 'BEV-002',
    barcode: '1234567890124',
    category: 'Beverages',
    description: 'Organic oat milk for lattes',
    unit: 'liters',
    unitCost: 3.50,
    sellingPrice: 6.00,
    currentStock: 8,
    minStock: 15,
    maxStock: 50,
    reorderPoint: 20,
    reorderQuantity: 30,
    supplierId: '2',
    supplierName: 'Beverage Co.',
    location: 'Refrigerator B',
    expiryDate: '2026-09-15',
    lastRestockDate: '2026-08-10',
    isActive: true,
    createdAt: '2026-02-01',
    updatedAt: '2026-08-18',
  },
  {
    id: '3',
    name: 'Sugar Packets',
    sku: 'ING-003',
    barcode: '1234567890125',
    category: 'Ingredients',
    description: 'Individual sugar packets',
    unit: 'packs',
    unitCost: 0.10,
    sellingPrice: 0.25,
    currentStock: 500,
    minStock: 100,
    maxStock: 1000,
    reorderPoint: 150,
    reorderQuantity: 500,
    supplierId: '1',
    supplierName: 'Fresh Foods Distributors',
    location: 'Pantry C',
    expiryDate: null,
    lastRestockDate: '2026-08-01',
    isActive: true,
    createdAt: '2026-01-20',
    updatedAt: '2026-08-01',
  },
];

export default function InventoryScreen() {
  const { theme } = useTheme();
  const { hasPermission } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
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
    category: '',
    description: '',
    unit: 'pieces',
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
      const matchesSupplier = !filter.supplier || item.supplierName === filter.supplier;
      const matchesLocation = !filter.location || item.location === filter.location;
      return matchesSearch && matchesCategory && matchesStatus && matchesSupplier && matchesLocation;
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
        case 'expiry':
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime() * modifier;
        case 'lastRestock':
          if (!a.lastRestockDate) return 1;
          if (!b.lastRestockDate) return -1;
          return new Date(a.lastRestockDate).getTime() - new Date(b.lastRestockDate).getTime() * modifier;
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
    if (formData.unitCost <= 0) newErrors.unitCost = 'Unit cost must be greater than 0';
    if (formData.sellingPrice <= 0) newErrors.sellingPrice = 'Selling price must be greater than 0';
    if (formData.currentStock < 0) newErrors.currentStock = 'Stock cannot be negative';
    if (formData.minStock < 0) newErrors.minStock = 'Minimum stock cannot be negative';
    if (formData.maxStock < formData.minStock) newErrors.maxStock = 'Maximum stock must be greater than minimum stock';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (isEditing && selectedItem) {
      setInventory(inventory.map(item => 
        item.id === selectedItem.id 
          ? { ...item, ...formData, updatedAt: new Date().toISOString() }
          : item
      ));
    } else {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        ...formData,
        barcode: formData.barcode || '',
        supplierName: 'Unknown Supplier',
        lastRestockDate: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setInventory([...inventory, newItem]);
    }

    setShowForm(false);
    setIsEditing(false);
    setSelectedItem(null);
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

  const handleDelete = (itemId: string) => {
    setInventory(inventory.filter(item => item.id !== itemId));
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }
  };

  const handleStockAdjustment = () => {
    if (!selectedItem || !stockAdjustment.reason) return;

    const newStock = selectedItem.currentStock + stockAdjustment.quantity;
    if (newStock < 0) return;

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

    setShowStockModal(false);
    setStockAdjustment({ quantity: 0, reason: '' });
  };

  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: '',
      description: '',
      unit: 'pieces',
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
    setSelectedItem(null);
  };

  const leftPanel = (
    <View style={styles.leftPanelContent}>
      {/* Stock Alerts */}
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

      <View style={styles.searchContainer}>
        <DripInput
          label="Search inventory..."
          value={filter.search}
          onChangeText={(text) => setFilter({ ...filter, search: text })}
          leftIcon={<Search size={20} color={theme.iconSecondary} />}
        />
      </View>

      <ScrollView style={styles.inventoryList} showsVerticalScrollIndicator={false}>
        {filteredInventory.map((item) => {
          const stockStatus = getStockStatus(item);
          const statusColor = stockStatus === 'out-of-stock' ? theme.error : 
                            stockStatus === 'low-stock' ? theme.warning : theme.success;
          
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.inventoryCard,
                { 
                  backgroundColor: selectedItem?.id === item.id ? theme.primary : theme.card,
                  borderColor: selectedItem?.id === item.id ? theme.primary : theme.border
                }
              ]}
              onPress={() => handleItemSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.inventoryCardHeader}>
                <View style={styles.inventoryInfo}>
                  <Text style={[
                    styles.inventoryName,
                    { color: selectedItem?.id === item.id ? theme.background : theme.text }
                  ]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.inventorySku, { color: theme.textSecondary }]}>
                    {item.sku}
                  </Text>
                </View>
                <View style={[
                  styles.stockBadge,
                  { backgroundColor: statusColor + '20' }
                ]}>
                  <Text style={[styles.stockText, { color: statusColor }]}>
                    {item.currentStock} {item.unit}
                  </Text>
                </View>
              </View>
              
              <View style={styles.inventoryDetails}>
                <View style={styles.detailItem}>
                  <Box size={14} color={theme.textSecondary} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                    {item.category}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <DollarSign size={14} color={theme.textSecondary} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                    ${item.unitCost.toFixed(2)}/{item.unit}
                  </Text>
                </View>
              </View>

              {stockStatus !== 'in-stock' && (
                <View style={styles.alertRow}>
                  <AlertTriangle size={14} color={statusColor} />
                  <Text style={[styles.alertText, { color: statusColor }]}>
                    {stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Low Stock'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
              <Text style={[styles.stockLevelLabel, { color: theme.textTertiary }]}>Min</Text>
              <Text style={[styles.stockLevelValue, { color: theme.textSecondary }]}>
                {selectedItem.minStock} {selectedItem.unit}
              </Text>
            </View>
            <View style={styles.stockLevel}>
              <Text style={[styles.stockLevelLabel, { color: theme.textTertiary }]}>Max</Text>
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
            <Text style={[styles.detailText, { color: theme.text }]}>
              {selectedItem.category}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Description:</Text>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {selectedItem.description}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Barcode:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>
              {selectedItem.barcode}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Pricing</Text>
          
          <View style={styles.detailRow}>
            <DollarSign size={18} color={theme.success} />
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Unit Cost:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>
              ${selectedItem.unitCost.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <DollarSign size={18} color={theme.primary} />
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Selling Price:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>
              ${selectedItem.sellingPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Supplier & Location</Text>
          
          <View style={styles.detailRow}>
            <Package size={18} color={theme.textSecondary} />
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Supplier:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>
              {selectedItem.supplierName}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MapPin size={18} color={theme.textSecondary} />
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Location:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>
              {selectedItem.location}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Reorder Settings</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Reorder Point:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>
              {selectedItem.reorderPoint} {selectedItem.unit}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Reorder Quantity:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>
              {selectedItem.reorderQuantity} {selectedItem.unit}
            </Text>
          </View>
        </View>

        {selectedItem.expiryDate && (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Expiry Information</Text>
            
            <View style={styles.detailRow}>
              <Calendar size={18} color={theme.textSecondary} />
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Expiry Date:</Text>
              <Text style={[styles.detailText, { color: theme.text }]}>
                {new Date(selectedItem.expiryDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        {selectedItem.lastRestockDate && (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Last Restock</Text>
            
            <View style={styles.detailRow}>
              <Calendar size={18} color={theme.textSecondary} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                {new Date(selectedItem.lastRestockDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
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

  const formPanel = (
    <View style={styles.formContainer}>
      <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.formTitle, { color: theme.text }]}>
          {isEditing ? 'Edit Item' : 'Add New Item'}
        </Text>

        <DripInput
          label="Item Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          error={errors.name}
        />

        <DripInput
          label="SKU"
          value={formData.sku}
          onChangeText={(text) => setFormData({ ...formData, sku: text })}
          error={errors.sku}
        />

        <DripInput
          label="Barcode"
          value={formData.barcode}
          onChangeText={(text) => setFormData({ ...formData, barcode: text })}
        />

        <DripInput
          label="Category"
          value={formData.category}
          onChangeText={(text) => setFormData({ ...formData, category: text })}
          error={errors.category}
        />

        <DripInput
          label="Description"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={3}
        />

        <DripInput
          label="Unit"
          value={formData.unit}
          onChangeText={(text) => setFormData({ ...formData, unit: text })}
        />

        <DripInput
          label="Unit Cost ($)"
          value={formData.unitCost.toString()}
          onChangeText={(text) => setFormData({ ...formData, unitCost: parseFloat(text) || 0 })}
          error={errors.unitCost}
          keyboardType="decimal-pad"
        />

        <DripInput
          label="Selling Price ($)"
          value={formData.sellingPrice.toString()}
          onChangeText={(text) => setFormData({ ...formData, sellingPrice: parseFloat(text) || 0 })}
          error={errors.sellingPrice}
          keyboardType="decimal-pad"
        />

        <DripInput
          label="Current Stock"
          value={formData.currentStock.toString()}
          onChangeText={(text) => setFormData({ ...formData, currentStock: parseInt(text) || 0 })}
          error={errors.currentStock}
          keyboardType="number-pad"
        />

        <DripInput
          label="Minimum Stock"
          value={formData.minStock.toString()}
          onChangeText={(text) => setFormData({ ...formData, minStock: parseInt(text) || 0 })}
          error={errors.minStock}
          keyboardType="number-pad"
        />

        <DripInput
          label="Maximum Stock"
          value={formData.maxStock.toString()}
          onChangeText={(text) => setFormData({ ...formData, maxStock: parseInt(text) || 0 })}
          error={errors.maxStock}
          keyboardType="number-pad"
        />

        <DripInput
          label="Reorder Point"
          value={formData.reorderPoint.toString()}
          onChangeText={(text) => setFormData({ ...formData, reorderPoint: parseInt(text) || 0 })}
          keyboardType="number-pad"
        />

        <DripInput
          label="Reorder Quantity"
          value={formData.reorderQuantity.toString()}
          onChangeText={(text) => setFormData({ ...formData, reorderQuantity: parseInt(text) || 0 })}
          keyboardType="number-pad"
        />

        <DripInput
          label="Supplier ID"
          value={formData.supplierId}
          onChangeText={(text) => setFormData({ ...formData, supplierId: text })}
        />

        <DripInput
          label="Location"
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
        />

        <DripInput
          label="Expiry Date"
          value={formData.expiryDate || ''}
          onChangeText={(text) => setFormData({ ...formData, expiryDate: text || null })}
          placeholder="YYYY-MM-DD"
        />

        <View style={styles.formActions}>
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
      </ScrollView>
    </View>
  );

  return (
    <>
      <Header title="Warehouse & Stock" />
      <DripContainer
        leftPanel={leftPanel}
        rightPanel={showForm ? formPanel : rightPanel}
        showSecondaryMobile={showForm}
        onMobileBack={() => {
          setShowForm(false);
          resetForm();
        }}
        backButtonTitle="Back to Inventory"
      />
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
    marginBottom: 16,
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
  searchContainer: {
    marginBottom: 16,
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
  formContainer: {
    flex: 1,
  },
  formContent: {
    flex: 1,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  formButton: {
    flex: 1,
  },
});