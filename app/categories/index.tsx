import { DripButton } from '@/components/Button';
import { DripContainer } from '@/components/Container';
import { DripDropdown, DropdownOption } from '@/components/Dropdown';
import { Header } from '@/components/Header';
import { DripInput } from '@/components/Input';
import { DripSearchBar } from '@/components/SearchBar';
import { DripSheet } from '@/components/Sheet';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { Category, CategoryParent } from '@/constants/types';
import { supabase } from '@/lib/supabase';
import { Check, Edit, Layers, Plus, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRESET_COLORS = [
  '#065F46',
  '#059669',
  '#10B981',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#64748B',
];

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [parentOptions, setParentOptions] = useState<DropdownOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [nameInput, setNameInput] = useState('');
  const [parentIdInput, setParentIdInput] = useState<string>('');
  const [colorInput, setColorInput] = useState(PRESET_COLORS[0]);
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
      // Fetch parents
      const { data: parentData } = await supabase
        .from('category_parents')
        .select('*')
        .order('name');

      if (parentData) {
        setParentOptions([
          { label: 'None (select parent)', value: '' },
          ...parentData.map((p: CategoryParent) => ({ label: p.name, value: p.id })),
        ]);
      }

      // Fetch categories with joined parent
      const { data, error } = await supabase
        .from('categories')
        .select('*, category_parents(name)')
        .order('name');

      if (error) {
        console.log('Error fetching categories:', error);
        setCategories([]);
      } else if (data) {
        const formatted: Category[] = data.map((item: any) => ({
          id: item.id,
          parent_id: item.parent_id || null,
          name: item.name,
          color: item.color || '#065F46',
          parent_name: item.category_parents?.name,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
        setCategories(formatted);
      }
    } catch (e) {
      console.log('Error fetching categories:', e);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.parent_name && c.parent_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setErrorName(t('validation.required'));
      return;
    }

    const payload = {
      name: trimmed,
      parent_id: parentIdInput || null,
      color: colorInput,
      updated_at: new Date().toISOString(),
    };

    const parentName = parentOptions.find((p) => p.value === parentIdInput)?.label;

    if (isEditing && selectedCategory) {
      setCategories(
        categories.map((c) =>
          c.id === selectedCategory.id
            ? { ...c, ...payload, parent_name: parentName }
            : c
        )
      );
      setSelectedCategory({ ...selectedCategory, ...payload, parent_name: parentName });

      try {
        await supabase.from('categories').update(payload).eq('id', selectedCategory.id);
      } catch (e) {
        console.log('Error updating category:', e);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert([{ ...payload }])
          .select();

        if (!error && data && data[0]) {
          const newCat: Category = {
            id: data[0].id,
            ...payload,
            parent_name: parentName,
          };
          setCategories([newCat, ...categories]);
          setSelectedCategory(newCat);
        } else {
          const fallback: Category = {
            id: Date.now().toString(),
            ...payload,
            parent_name: parentName,
          };
          setCategories([fallback, ...categories]);
          setSelectedCategory(fallback);
        }
      } catch (e) {
        console.log('Error inserting category:', e);
      }
    }

    setShowForm(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setNameInput(cat.name);
    setParentIdInput(cat.parent_id || '');
    setColorInput(cat.color || PRESET_COLORS[0]);
    setErrorName('');
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('categories').delete().eq('id', id);
    } catch (e) {
      console.log('Error deleting category:', e);
    }

    setCategories(categories.filter((c) => c.id !== id));
    if (selectedCategory?.id === id) {
      setSelectedCategory(null);
    }
  };

  const resetForm = () => {
    setNameInput('');
    setParentIdInput('');
    setColorInput(PRESET_COLORS[0]);
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
      ) : filteredCategories.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Layers size={48} color={theme.textDisabled} />
          <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
            {t('categories.noCategories')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filteredCategories.map((cat) => {
            const isSelected = selectedCategory?.id === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                    <View style={styles.cardInfo}>
                      <Text
                        style={[
                          styles.cardName,
                          { color: isSelected ? theme.background : theme.text },
                        ]}
                      >
                        {cat.name}
                      </Text>
                      {cat.parent_name ? (
                        <Text
                          style={[
                            styles.cardSubtitle,
                            { color: isSelected ? theme.background + 'CC' : theme.textSecondary },
                          ]}
                        >
                          {cat.parent_name}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    {canEdit && (
                      <TouchableOpacity
                        style={[
                          styles.actionIconBtn,
                          { backgroundColor: isSelected ? theme.background + '20' : theme.input },
                        ]}
                        onPress={() => openEdit(cat)}
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
                        onPress={() => handleDelete(cat.id)}
                      >
                        <Trash2 size={16} color={isSelected ? theme.background : theme.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {canCreate && (
        <DripButton
          title={t('categories.newCategory')}
          onPress={openCreate}
          icon={<Plus size={20} color={theme.background} />}
          style={styles.addButton}
        />
      )}
    </View>
  );

  const rightPanel = selectedCategory ? (
    <View style={styles.detailsContent}>
      <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.detailsTitleContainer}>
          <View style={[styles.colorBadge, { backgroundColor: selectedCategory.color }]} />
          <View>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>
              {selectedCategory.name}
            </Text>
            {selectedCategory.parent_name ? (
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
                {t('categories.parent')}: {selectedCategory.parent_name}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.headerButtons}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => openEdit(selectedCategory)}
            >
              <Edit size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handleDelete(selectedCategory.id)}
            >
              <Trash2 size={18} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  ) : (
    <View style={styles.emptyState}>
      <Layers size={64} color={theme.textDisabled} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {t('categories.noCategories')}
      </Text>
    </View>
  );

  return (
    <>
      <Header title={t('categories.title')} />
      <DripContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        showSecondaryMobile={!!selectedCategory}
        onMobileBack={() => setSelectedCategory(null)}
        backButtonTitle={t('common.back')}
        childrenPadding={16}
      />

      <DripSheet
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={isEditing ? t('categories.editCategory') : t('categories.newCategory')}
        headerIcon={<Layers size={20} color={theme.primary} />}
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
          label={t('categories.name')}
          value={nameInput}
          onChangeText={(v) => {
            setNameInput(v);
            if (v.trim()) setErrorName('');
          }}
          error={errorName}
        />

        <DripDropdown
          label={t('categories.parent')}
          options={parentOptions}
          value={parentIdInput}
          onSelect={(val) => setParentIdInput(val)}
        />

        {/* Color Palette Selector */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t('categories.color')}
        </Text>
        <View style={styles.colorPalette}>
          {PRESET_COLORS.map((c) => {
            const isSelected = colorInput === c;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  isSelected && styles.colorOptionSelected,
                ]}
                onPress={() => setColorInput(c)}
                activeOpacity={0.8}
              >
                {isSelected && <Check size={16} color="#FFF" />}
              </TouchableOpacity>
            );
          })}
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
    alignItems: 'center',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colorBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
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
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  colorOption: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
    elevation: 4,
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
