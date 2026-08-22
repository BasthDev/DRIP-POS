import { DripButton } from '@/components/Button';
import { DripContainer } from '@/components/Container';
import { Header } from '@/components/Header';
import { DripInput } from '@/components/Input';
import { DripSearchBar } from '@/components/SearchBar';
import { DripSheet } from '@/components/Sheet';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { CategoryParent } from '@/constants/types';
import { supabase } from '@/lib/supabase';
import { Edit, FolderTree, Plus, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CategoryGroupsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [groups, setGroups] = useState<CategoryParent[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CategoryParent | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [errorName, setErrorName] = useState('');
  const [loading, setLoading] = useState(false);

  const canCreate = hasPermission('inventory.create');
  const canEdit = hasPermission('inventory.edit');
  const canDelete = hasPermission('inventory.delete');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('category_parents')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.log('Error fetching category groups:', error);
        setGroups([]);
      } else if (data) {
        setGroups(data);
      }
    } catch (e) {
      console.log('Error fetching category groups:', e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setErrorName(t('validation.required'));
      return;
    }

    if (isEditing && selectedGroup) {
      setGroups(groups.map((g) => (g.id === selectedGroup.id ? { ...g, name: trimmed } : g)));
      setSelectedGroup({ ...selectedGroup, name: trimmed });

      try {
        await supabase.from('category_parents').update({ name: trimmed, updated_at: new Date().toISOString() }).eq('id', selectedGroup.id);
      } catch (e) {
        console.log('Error updating category group:', e);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('category_parents')
          .insert([{ name: trimmed }])
          .select();

        if (!error && data && data[0]) {
          setGroups([...groups, data[0]]);
          setSelectedGroup(data[0]);
        } else {
          const fallback: CategoryParent = { id: Date.now().toString(), name: trimmed };
          setGroups([...groups, fallback]);
          setSelectedGroup(fallback);
        }
      } catch (e) {
        console.log('Error creating category group:', e);
      }
    }

    setShowForm(false);
    setNameInput('');
    setIsEditing(false);
  };

  const openCreate = () => {
    setNameInput('');
    setErrorName('');
    setIsEditing(false);
    setShowForm(true);
  };

  const openEdit = (group: CategoryParent) => {
    setSelectedGroup(group);
    setNameInput(group.name);
    setErrorName('');
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('category_parents').delete().eq('id', id);
    } catch (e) {
      console.log('Error deleting category group:', e);
    }

    setGroups(groups.filter((g) => g.id !== id));
    if (selectedGroup?.id === id) {
      setSelectedGroup(null);
    }
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
      ) : filteredGroups.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <FolderTree size={48} color={theme.textDisabled} />
          <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
            {search ? t('categoryGroups.noGroups') : t('categoryGroups.noGroups')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filteredGroups.map((group) => {
            const isSelected = selectedGroup?.id === group.id;
            return (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedGroup(group)}
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
                      {group.name}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    {canEdit && (
                      <TouchableOpacity
                        style={[
                          styles.actionIconBtn,
                          { backgroundColor: isSelected ? theme.background + '20' : theme.input },
                        ]}
                        onPress={() => openEdit(group)}
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
                        onPress={() => handleDelete(group.id)}
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
          title={t('categoryGroups.newGroup')}
          onPress={openCreate}
          icon={<Plus size={20} color={theme.background} />}
          style={styles.addButton}
        />
      )}
    </View>
  );

  const rightPanel = selectedGroup ? (
    <View style={styles.detailsContent}>
      <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.detailsTitleContainer}>
          <FolderTree size={28} color={theme.primary} />
          <Text style={[styles.detailsTitle, { color: theme.text }]}>
            {selectedGroup.name}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => openEdit(selectedGroup)}
            >
              <Edit size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handleDelete(selectedGroup.id)}
            >
              <Trash2 size={18} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={{ color: theme.textSecondary, marginTop: 16 }}>
        {t('categories.parent')}: {selectedGroup.name}
      </Text>
    </View>
  ) : (
    <View style={styles.emptyState}>
      <FolderTree size={64} color={theme.textDisabled} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {t('categoryGroups.noGroups')}
      </Text>
    </View>
  );

  return (
    <>
      <Header title={t('categoryGroups.title')} />
      <DripContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        showSecondaryMobile={!!selectedGroup}
        onMobileBack={() => setSelectedGroup(null)}
        backButtonTitle={t('common.back')}
        childrenPadding={16}
      />

      <DripSheet
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setIsEditing(false);
        }}
        title={isEditing ? t('categoryGroups.editGroup') : t('categoryGroups.newGroup')}
        headerIcon={<FolderTree size={20} color={theme.primary} />}
        footer={
          <View style={styles.formFooterActions}>
            <DripButton
              title={t('common.cancel')}
              onPress={() => setShowForm(false)}
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
          label={t('categoryGroups.name')}
          value={nameInput}
          onChangeText={(v) => {
            setNameInput(v);
            if (v.trim()) setErrorName('');
          }}
          error={errorName}
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
    fontSize: 16,
    fontWeight: '700',
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
  formFooterActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  formButton: {
    flex: 1,
  },
});
