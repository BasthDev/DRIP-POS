import { DripButton } from '@/components/Button';
import { DripContainer } from '@/components/Container';
import { Header } from '@/components/Header';
import { DripInput } from '@/components/Input';
import { DripSearchBar } from '@/components/SearchBar';
import { DripSheet } from '@/components/Sheet';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { Supplier, SupplierFilter, SupplierFormData, SupplierValidationErrors } from '@/constants/supplier/types';
import { supabase } from '@/lib/supabase';
import { Building2, Calendar, DollarSign, Edit, Mail, MapPin, Package, Phone, Plus, Star, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SuppliersScreen() {
  const { theme } = useTheme();
  const { hasPermission } = useAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<SupplierFilter>({
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    taxId: '',
    paymentTerms: '',
    notes: '',
  });
  const [errors, setErrors] = useState<SupplierValidationErrors>({});

  const canCreate = hasPermission('inventory.create');
  const canEdit = hasPermission('inventory.edit');
  const canDelete = hasPermission('inventory.delete');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error fetching suppliers:', error);
        setSuppliers([]);
      } else if (data) {
        const formatted: Supplier[] = data.map(item => ({
          id: item.id,
          name: item.name,
          contactPerson: item.contact_person || item.contactPerson || '',
          email: item.email || '',
          phone: item.phone || '',
          address: item.address || '',
          city: item.city || '',
          state: item.state || '',
          postalCode: item.postal_code || item.postalCode || '',
          country: item.country || '',
          taxId: item.tax_id || item.taxId || '',
          paymentTerms: item.payment_terms || item.paymentTerms || '',
          notes: item.notes || '',
          isActive: item.is_active ?? true,
          rating: item.rating ?? 5,
          totalOrders: item.total_orders ?? 0,
          totalSpent: item.total_spent ?? 0,
          lastOrderDate: item.last_order_date || null,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
        }));
        setSuppliers(formatted);
      }
    } catch (e) {
      console.log('Error fetching suppliers:', e);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers
    .filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        supplier.contactPerson.toLowerCase().includes(filter.search.toLowerCase()) ||
        supplier.email.toLowerCase().includes(filter.search.toLowerCase());
      const matchesStatus = filter.status === 'all' || 
        (filter.status === 'active' && supplier.isActive) ||
        (filter.status === 'inactive' && !supplier.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const modifier = filter.sortOrder === 'asc' ? 1 : -1;
      switch (filter.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * modifier;
        case 'rating':
          return (a.rating - b.rating) * modifier;
        case 'totalOrders':
          return (a.totalOrders - b.totalOrders) * modifier;
        case 'totalSpent':
          return (a.totalSpent - b.totalSpent) * modifier;
        default:
          return 0;
      }
    });

  const validateForm = (): boolean => {
    const newErrors: SupplierValidationErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const payload = {
      name: formData.name,
      contact_person: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      postal_code: formData.postalCode,
      country: formData.country,
      tax_id: formData.taxId,
      payment_terms: formData.paymentTerms,
      notes: formData.notes,
      updated_at: new Date().toISOString(),
    };

    if (isEditing && selectedSupplier) {
      setSuppliers(suppliers.map(s => 
        s.id === selectedSupplier.id 
          ? { ...s, ...formData, updatedAt: new Date().toISOString() }
          : s
      ));
      setSelectedSupplier({ ...selectedSupplier, ...formData, updatedAt: new Date().toISOString() });

      try {
        await supabase.from('suppliers').update(payload).eq('id', selectedSupplier.id);
      } catch (e) {
        console.log('Error updating supplier in DB:', e);
      }
    } else {
      try {
        const { data, error } = await supabase.from('suppliers').insert([{
          ...payload,
          is_active: true,
          rating: 5,
          total_orders: 0,
          total_spent: 0,
          created_at: new Date().toISOString(),
        }]).select();

        if (!error && data && data[0]) {
          const created: Supplier = {
            id: data[0].id,
            ...formData,
            isActive: true,
            rating: 5,
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null,
            createdAt: data[0].created_at || new Date().toISOString(),
            updatedAt: data[0].updated_at || new Date().toISOString(),
          };
          setSuppliers([created, ...suppliers]);
          setSelectedSupplier(created);
        } else {
          // Fallback if local only
          const fallback: Supplier = {
            id: Date.now().toString(),
            ...formData,
            isActive: true,
            rating: 5,
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setSuppliers([fallback, ...suppliers]);
          setSelectedSupplier(fallback);
        }
      } catch (e) {
        console.log('Error creating supplier in DB:', e);
      }
    }

    setShowForm(false);
    resetForm();
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      postalCode: supplier.postalCode,
      country: supplier.country,
      taxId: supplier.taxId,
      paymentTerms: supplier.paymentTerms,
      notes: supplier.notes,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (supplierId: string) => {
    // Delete from Supabase DB explicitly
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
      if (error) console.log('Error deleting supplier from DB:', error);
    } catch (e) {
      console.log('Error deleting supplier from DB:', e);
    }

    setSuppliers(suppliers.filter(s => s.id !== supplierId));
    if (selectedSupplier?.id === supplierId) {
      setSelectedSupplier(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      taxId: '',
      paymentTerms: '',
      notes: '',
    });
    setErrors({});
    setIsEditing(false);
  };

  // Left Panel Content: SearchBar + Supplier List
  const leftPanel = (
    <View style={styles.leftPanelContent}>
      <DripSearchBar
        placeholder="Search suppliers by name, contact, email..."
        value={filter.search}
        onChangeText={(text) => setFilter({ ...filter, search: text })}
        onClear={() => setFilter({ ...filter, search: '' })}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 30 }} />
      ) : filteredSuppliers.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Building2 size={48} color={theme.textDisabled} />
          <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
            {filter.search ? 'No suppliers found matching search.' : 'No suppliers registered in database.'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.suppliersList} showsVerticalScrollIndicator={false}>
          {filteredSuppliers.map((supplier) => {
            const isSelected = selectedSupplier?.id === supplier.id;
            return (
              <TouchableOpacity
                key={supplier.id}
                style={[
                  styles.supplierCard,
                  { 
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border
                  }
                ]}
                onPress={() => setSelectedSupplier(supplier)}
                activeOpacity={0.7}
              >
                <View style={styles.supplierCardHeader}>
                  <View style={styles.supplierInfo}>
                    <Text style={[
                      styles.supplierName,
                      { color: isSelected ? theme.background : theme.text }
                    ]}>
                      {supplier.name}
                    </Text>
                    <Text style={[styles.supplierContact, { color: isSelected ? theme.background + 'D0' : theme.textSecondary }]}>
                      {supplier.contactPerson}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: supplier.isActive ? theme.success : theme.textDisabled }
                  ]}>
                    <Text style={[styles.statusText, { color: theme.background }]}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.supplierStats}>
                  <View style={styles.statItem}>
                    <Star size={16} color={isSelected ? theme.background : theme.warning} fill={isSelected ? theme.background : theme.warning} />
                    <Text style={[styles.statText, { color: isSelected ? theme.background : theme.textSecondary }]}>
                      {supplier.rating}/5
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Package size={16} color={isSelected ? theme.background : theme.textSecondary} />
                    <Text style={[styles.statText, { color: isSelected ? theme.background : theme.textSecondary }]}>
                      {supplier.totalOrders} orders
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {canCreate && (
        <DripButton
          title="Add Supplier"
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

  // Right Panel Content: Details of Selected Supplier
  const rightPanel = selectedSupplier ? (
    <View style={styles.supplierDetails}>
      <View style={styles.detailsHeader}>
        <View style={styles.detailsHeaderLeft}>
          <Building2 size={32} color={theme.primary} />
          <View style={styles.detailsTitle}>
            <Text style={[styles.detailsName, { color: theme.text }]}>
              {selectedSupplier.name}
            </Text>
            <Text style={[styles.detailsContact, { color: theme.textSecondary }]}>
              {selectedSupplier.contactPerson}
            </Text>
          </View>
        </View>
        <View style={styles.detailsActions}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.card }]}
              onPress={() => handleEdit(selectedSupplier)}
              activeOpacity={0.7}
            >
              <Edit size={20} color={theme.primary} />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.card }]}
              onPress={() => handleDelete(selectedSupplier.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>
          <View style={styles.detailRow}>
            <Mail size={18} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {selectedSupplier.email}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Phone size={18} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {selectedSupplier.phone}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={18} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {selectedSupplier.address}, {selectedSupplier.city}, {selectedSupplier.state} {selectedSupplier.postalCode}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Business Details</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Tax ID:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>{selectedSupplier.taxId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Payment Terms:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>{selectedSupplier.paymentTerms}</Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance</Text>
          <View style={styles.detailRow}>
            <Star size={18} color={theme.warning} fill={theme.warning} />
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Rating:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>{selectedSupplier.rating}/5</Text>
          </View>
          <View style={styles.detailRow}>
            <Package size={18} color={theme.textSecondary} />
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Total Orders:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>{selectedSupplier.totalOrders}</Text>
          </View>
          <View style={styles.detailRow}>
            <DollarSign size={18} color={theme.success} />
            <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Total Spent:</Text>
            <Text style={[styles.detailText, { color: theme.text }]}>
              ${selectedSupplier.totalSpent.toLocaleString()}
            </Text>
          </View>
          {selectedSupplier.lastOrderDate && (
            <View style={styles.detailRow}>
              <Calendar size={18} color={theme.textSecondary} />
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Last Order:</Text>
              <Text style={[styles.detailText, { color: theme.text }]}>
                {new Date(selectedSupplier.lastOrderDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {selectedSupplier.notes ? (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>
              {selectedSupplier.notes}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  ) : (
    <View style={styles.emptyState}>
      <Building2 size={64} color={theme.textDisabled} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        Select a supplier to view details
      </Text>
    </View>
  );

  return (
    <>
      <Header title="Suppliers" />
      <DripContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        showSecondaryMobile={!!selectedSupplier}
        onMobileBack={() => setSelectedSupplier(null)}
        backButtonTitle="Back to Suppliers"
        childrenPadding={16}
      />

      {/* Responsive Form Sheet */}
      <DripSheet
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={isEditing ? 'Edit Supplier' : 'Add New Supplier'}
        headerIcon={<Building2 size={20} color={theme.primary} />}
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
          label="Company Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          error={errors.name}
        />
        <DripInput
          label="Contact Person"
          value={formData.contactPerson}
          onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
          error={errors.contactPerson}
        />
        <DripInput
          label="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          error={errors.email}
          keyboardType="email-address"
        />
        <DripInput
          label="Phone"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          error={errors.phone}
          keyboardType="phone-pad"
        />
        <DripInput
          label="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          error={errors.address}
        />
        <DripInput
          label="City"
          value={formData.city}
          onChangeText={(text) => setFormData({ ...formData, city: text })}
        />
        <DripInput
          label="State"
          value={formData.state}
          onChangeText={(text) => setFormData({ ...formData, state: text })}
        />
        <DripInput
          label="Postal Code"
          value={formData.postalCode}
          onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
        />
        <DripInput
          label="Country"
          value={formData.country}
          onChangeText={(text) => setFormData({ ...formData, country: text })}
        />
        <DripInput
          label="Tax ID"
          value={formData.taxId}
          onChangeText={(text) => setFormData({ ...formData, taxId: text })}
        />
        <DripInput
          label="Payment Terms"
          value={formData.paymentTerms}
          onChangeText={(text) => setFormData({ ...formData, paymentTerms: text })}
          placeholder="e.g., Net 30, Net 15"
        />
        <DripInput
          label="Notes"
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          multiline
          numberOfLines={4}
        />
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
  suppliersList: {
    flex: 1,
  },
  supplierCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  supplierCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  supplierContact: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  supplierStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  addButton: {
    marginTop: 16,
  },
  supplierDetails: {
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
  detailsContact: {
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
    minWidth: 100,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
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