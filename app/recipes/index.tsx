import { DripButton } from '@/components/Button';
import { DripContainer } from '@/components/Container';
import { DripDropdown, DropdownOption } from '@/components/Dropdown';
import { Header } from '@/components/Header';
import { DripInput } from '@/components/Input';
import { DripSearchBar } from '@/components/SearchBar';
import { DripSheet } from '@/components/Sheet';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { Ingredient, RecipeDetail, RecipeExtra, RecipeIngredient, ValueType } from '@/constants/types';
import { formatCurrency } from '@/lib/currency';
import { calculateHPP } from '@/lib/hpp';
import { supabase } from '@/lib/supabase';
import { formatQtyWithUnit } from '@/lib/units';
import { Edit, Plus, Trash2, Utensils, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RecipesScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [recipes, setRecipes] = useState<RecipeDetail[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<DropdownOption[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [recipeName, setRecipeName] = useState('');
  const [draftIngredients, setDraftIngredients] = useState<RecipeIngredient[]>([]);
  const [draftExtras, setDraftExtras] = useState<RecipeExtra[]>([]);
  const [errorName, setErrorName] = useState('');

  // Add Ingredient Subform State
  const [selectedIngId, setSelectedIngId] = useState<string>('');
  const [ingQtyInput, setIngQtyInput] = useState<string>('');

  // Add Extra Subform State
  const [extraNameInput, setExtraNameInput] = useState('');
  const [extraTypeInput, setExtraTypeInput] = useState<ValueType>('flat');
  const [extraValueInput, setExtraValueInput] = useState('');

  const canCreate = hasPermission('inventory.create');
  const canEdit = hasPermission('inventory.edit');
  const canDelete = hasPermission('inventory.delete');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Ingredients for options
      const { data: ingData } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');

      if (ingData) {
        setAllIngredients(ingData);
        setIngredientOptions(
          ingData.map((i: any) => ({
            label: `${i.name} (${formatCurrency(i.cost_per_gram || 0)}/${i.item_unit || 'g'})`,
            value: i.id,
          }))
        );
      }

      // 2. Fetch Recipes with ingredients and extras
      const { data: recData, error } = await supabase
        .from('recipes')
        .select('*')
        .order('name');

      if (error) {
        console.log('Error fetching recipes:', error);
        setRecipes([]);
      } else if (recData) {
        const fullRecipes: RecipeDetail[] = await Promise.all(
          recData.map(async (r: any) => {
            const { data: rIngs } = await supabase
              .from('recipe_ingredients')
              .select('*, ingredients(name, cost_per_gram, item_unit, buy_price)')
              .eq('recipe_id', r.id);

            const { data: rExtras } = await supabase
              .from('recipe_extras')
              .select('*')
              .eq('recipe_id', r.id);

            const formattedIngs: RecipeIngredient[] = (rIngs || []).map((ri: any) => ({
              id: ri.id,
              recipe_id: ri.recipe_id,
              ingredient_id: ri.ingredient_id,
              qty_used: Number(ri.qty_used || 0),
              ingredient_name: ri.ingredients?.name || 'Unknown',
              cost_per_gram: Number(ri.ingredients?.cost_per_gram || 0),
              item_unit: ri.ingredients?.item_unit || 'g',
            }));

            const formattedExtras: RecipeExtra[] = (rExtras || []).map((re: any) => ({
              id: re.id,
              recipe_id: re.recipe_id,
              extra_name: re.extra_name,
              value_type: re.value_type || 'flat',
              value: Number(re.value || 0),
            }));

            const hpp = calculateHPP(formattedIngs, formattedExtras);

            return {
              id: r.id,
              name: r.name,
              ingredients: formattedIngs,
              extras: formattedExtras,
              hpp,
            };
          })
        );

        setRecipes(fullRecipes);
      }
    } catch (e) {
      console.log('Error fetching recipe details:', e);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const liveCalculatedHPP = useMemo(() => {
    return calculateHPP(draftIngredients, draftExtras);
  }, [draftIngredients, draftExtras]);

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddIngredientRow = () => {
    if (!selectedIngId) return;
    const qty = parseFloat(ingQtyInput);
    if (isNaN(qty) || qty <= 0) return;

    const matchedIng = allIngredients.find((i) => i.id === selectedIngId);
    if (!matchedIng) return;

    setDraftIngredients([
      ...draftIngredients,
      {
        recipe_id: isEditing && selectedRecipe ? selectedRecipe.id : '',
        ingredient_id: matchedIng.id,
        ingredient_name: matchedIng.name,
        cost_per_gram: matchedIng.cost_per_gram || 0,
        item_unit: matchedIng.item_unit || 'g',
        qty_used: qty,
      },
    ]);

    setSelectedIngId('');
    setIngQtyInput('');
  };

  const handleRemoveIngredientRow = (index: number) => {
    setDraftIngredients(draftIngredients.filter((_, i) => i !== index));
  };

  const handleAddExtraRow = () => {
    const trimmed = extraNameInput.trim();
    if (!trimmed) return;
    const val = parseFloat(extraValueInput);
    if (isNaN(val) || val < 0) return;

    setDraftExtras([
      ...draftExtras,
      {
        recipe_id: isEditing && selectedRecipe ? selectedRecipe.id : '',
        extra_name: trimmed,
        value_type: extraTypeInput,
        value: val,
      },
    ]);

    setExtraNameInput('');
    setExtraValueInput('');
  };

  const handleRemoveExtraRow = (index: number) => {
    setDraftExtras(draftExtras.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const trimmed = recipeName.trim();
    if (!trimmed) {
      setErrorName(t('validation.required'));
      return;
    }

    if (isEditing && selectedRecipe) {
      const updated: RecipeDetail = {
        ...selectedRecipe,
        name: trimmed,
        ingredients: draftIngredients,
        extras: draftExtras,
        hpp: liveCalculatedHPP,
      };

      setRecipes(recipes.map((r) => (r.id === selectedRecipe.id ? updated : r)));
      setSelectedRecipe(updated);

      try {
        await supabase.from('recipes').update({ name: trimmed, updated_at: new Date().toISOString() }).eq('id', selectedRecipe.id);
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', selectedRecipe.id);
        await supabase.from('recipe_extras').delete().eq('recipe_id', selectedRecipe.id);

        if (draftIngredients.length > 0) {
          await supabase.from('recipe_ingredients').insert(
            draftIngredients.map((di) => ({
              recipe_id: selectedRecipe.id,
              ingredient_id: di.ingredient_id,
              qty_used: di.qty_used,
            }))
          );
        }

        if (draftExtras.length > 0) {
          await supabase.from('recipe_extras').insert(
            draftExtras.map((de) => ({
              recipe_id: selectedRecipe.id,
              extra_name: de.extra_name,
              value_type: de.value_type,
              value: de.value,
            }))
          );
        }
      } catch (e) {
        console.log('Error updating recipe in DB:', e);
      }
    } else {
      try {
        const { data: recData, error } = await supabase
          .from('recipes')
          .insert([{ name: trimmed }])
          .select();

        if (!error && recData && recData[0]) {
          const recId = recData[0].id;

          if (draftIngredients.length > 0) {
            await supabase.from('recipe_ingredients').insert(
              draftIngredients.map((di) => ({
                recipe_id: recId,
                ingredient_id: di.ingredient_id,
                qty_used: di.qty_used,
              }))
            );
          }

          if (draftExtras.length > 0) {
            await supabase.from('recipe_extras').insert(
              draftExtras.map((de) => ({
                recipe_id: recId,
                extra_name: de.extra_name,
                value_type: de.value_type,
                value: de.value,
              }))
            );
          }

          const created: RecipeDetail = {
            id: recId,
            name: trimmed,
            ingredients: draftIngredients,
            extras: draftExtras,
            hpp: liveCalculatedHPP,
          };

          setRecipes([created, ...recipes]);
          setSelectedRecipe(created);
        }
      } catch (e) {
        console.log('Error creating recipe in DB:', e);
      }
    }

    setShowForm(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (recipe: RecipeDetail) => {
    setSelectedRecipe(recipe);
    setRecipeName(recipe.name);
    setDraftIngredients(recipe.ingredients || []);
    setDraftExtras(recipe.extras || []);
    setErrorName('');
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('recipes').delete().eq('id', id);
    } catch (e) {
      console.log('Error deleting recipe from DB:', e);
    }

    setRecipes(recipes.filter((r) => r.id !== id));
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null);
    }
  };

  const resetForm = () => {
    setRecipeName('');
    setDraftIngredients([]);
    setDraftExtras([]);
    setSelectedIngId('');
    setIngQtyInput('');
    setExtraNameInput('');
    setExtraValueInput('');
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
      ) : filteredRecipes.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Utensils size={48} color={theme.textDisabled} />
          <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
            {t('recipes.noRecipes')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filteredRecipes.map((recipe) => {
            const isSelected = selectedRecipe?.id === recipe.id;
            return (
              <TouchableOpacity
                key={recipe.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedRecipe(recipe)}
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
                      {recipe.name}
                    </Text>
                    <Text
                      style={[
                        styles.cardCost,
                        { color: isSelected ? theme.background + 'EE' : theme.primary },
                      ]}
                    >
                      HPP: {formatCurrency(recipe.hpp)}
                    </Text>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        { color: isSelected ? theme.background + 'CC' : theme.textSecondary },
                      ]}
                    >
                      {recipe.ingredients.length} {t('ingredients.title')} • {recipe.extras.length} {t('recipes.extras')}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    {canEdit && (
                      <TouchableOpacity
                        style={[
                          styles.actionIconBtn,
                          { backgroundColor: isSelected ? theme.background + '20' : theme.input },
                        ]}
                        onPress={() => openEdit(recipe)}
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
                        onPress={() => handleDelete(recipe.id)}
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
          title={t('recipes.newRecipe')}
          onPress={openCreate}
          icon={<Plus size={20} color={theme.background} />}
          style={styles.addButton}
        />
      )}
    </View>
  );

  const rightPanel = selectedRecipe ? (
    <View style={styles.detailsContent}>
      <View style={[styles.detailsHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.detailsTitleContainer}>
          <Utensils size={28} color={theme.primary} />
          <View>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>
              {selectedRecipe.name}
            </Text>
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16, marginTop: 2 }}>
              HPP: {formatCurrency(selectedRecipe.hpp)}
            </Text>
          </View>
        </View>

        <View style={styles.headerButtons}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => openEdit(selectedRecipe)}
            >
              <Edit size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handleDelete(selectedRecipe.id)}
            >
              <Trash2 size={18} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1, marginTop: 16 }} showsVerticalScrollIndicator={false}>
        {/* Ingredients breakdown */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t('recipes.ingredientsList')} ({selectedRecipe.ingredients.length})
        </Text>
        {selectedRecipe.ingredients.map((ing, idx) => (
          <View key={idx} style={[styles.ingredientRowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: theme.text, fontSize: 14 }}>
                {ing.ingredient_name}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                {formatQtyWithUnit(ing.qty_used, ing.item_unit)} @ {formatCurrency(ing.cost_per_gram || 0)}/{ing.item_unit || 'g'}
              </Text>
            </View>
            <Text style={{ fontWeight: '700', color: theme.primary, fontSize: 14 }}>
              {formatCurrency((ing.cost_per_gram || 0) * ing.qty_used)}
            </Text>
          </View>
        ))}

        {/* Extras breakdown */}
        {selectedRecipe.extras.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
              {t('recipes.extras')} ({selectedRecipe.extras.length})
            </Text>
            {selectedRecipe.extras.map((extra, idx) => (
              <View key={idx} style={[styles.ingredientRowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={{ fontWeight: '600', color: theme.text, flex: 1 }}>
                  {extra.extra_name}
                </Text>
                <Text style={{ fontWeight: '700', color: theme.text }}>
                  {extra.value_type === 'percentage' ? `${extra.value}%` : formatCurrency(extra.value)}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  ) : (
    <View style={styles.emptyState}>
      <Utensils size={64} color={theme.textDisabled} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {t('recipes.noRecipes')}
      </Text>
    </View>
  );

  return (
    <>
      <Header title={t('recipes.title')} />
      <DripContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        showSecondaryMobile={!!selectedRecipe}
        onMobileBack={() => setSelectedRecipe(null)}
        backButtonTitle={t('common.back')}
        childrenPadding={16}
      />

      <DripSheet
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={isEditing ? t('recipes.editRecipe') : t('recipes.newRecipe')}
        headerIcon={<Utensils size={20} color={theme.primary} />}
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
          label={t('recipes.name')}
          value={recipeName}
          onChangeText={(v) => {
            setRecipeName(v);
            if (v.trim()) setErrorName('');
          }}
          error={errorName}
        />

        {/* Live Total HPP Box */}
        <View style={[styles.hppBanner, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>
            {t('recipes.hppTotal')}
          </Text>
          <Text style={{ color: theme.primary, fontSize: 18, fontWeight: '800' }}>
            {formatCurrency(liveCalculatedHPP)}
          </Text>
        </View>

        {/* Ingredients in Recipe List */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 14 }]}>
          {t('recipes.ingredientsList')}
        </Text>

        {draftIngredients.map((item, index) => (
          <View key={index} style={[styles.draftItemRow, { backgroundColor: theme.input, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: theme.text, fontSize: 14 }}>
                {item.ingredient_name}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {item.qty_used} {item.item_unit || 'g'} ≈ {formatCurrency((item.cost_per_gram || 0) * item.qty_used)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveIngredientRow(index)} style={styles.deleteDraftBtn}>
              <X size={16} color={theme.error} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Ingredient Subform */}
        <View style={[styles.subformBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <DripDropdown
            label={t('ingredients.title')}
            options={ingredientOptions}
            value={selectedIngId}
            onSelect={(val) => setSelectedIngId(val)}
          />
          <DripInput
            label={t('recipes.qtyUsed')}
            value={ingQtyInput}
            onChangeText={setIngQtyInput}
            keyboardType="numeric"
            placeholder="e.g. 50"
          />
          <DripButton
            title={t('recipes.addIngredient')}
            onPress={handleAddIngredientRow}
            variant="secondary"
            icon={<Plus size={16} color={theme.primary} />}
            style={{ marginTop: 8 }}
          />
        </View>

        {/* Recipe Extras */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
          {t('recipes.extras')}
        </Text>

        {draftExtras.map((extra, index) => (
          <View key={index} style={[styles.draftItemRow, { backgroundColor: theme.input, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: theme.text, fontSize: 14 }}>
                {extra.extra_name}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {extra.value_type === 'percentage' ? `${extra.value}%` : formatCurrency(extra.value)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveExtraRow(index)} style={styles.deleteDraftBtn}>
              <X size={16} color={theme.error} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Extra Subform */}
        <View style={[styles.subformBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <DripInput
            label={t('recipes.extraName')}
            value={extraNameInput}
            onChangeText={setExtraNameInput}
            placeholder={t('recipes.extraName')}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity
              style={[
                styles.extraTypeBtn,
                { backgroundColor: extraTypeInput === 'flat' ? theme.primary : theme.input },
              ]}
              onPress={() => setExtraTypeInput('flat')}
            >
              <Text style={{ color: extraTypeInput === 'flat' ? theme.background : theme.text, fontWeight: '700' }}>
                {t('recipes.flat')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.extraTypeBtn,
                { backgroundColor: extraTypeInput === 'percentage' ? theme.primary : theme.input },
              ]}
              onPress={() => setExtraTypeInput('percentage')}
            >
              <Text style={{ color: extraTypeInput === 'percentage' ? theme.background : theme.text, fontWeight: '700' }}>
                {t('recipes.percentage')}
              </Text>
            </TouchableOpacity>
          </View>
          <DripInput
            label={t('recipes.extraValue')}
            value={extraValueInput}
            onChangeText={setExtraValueInput}
            keyboardType="numeric"
            placeholder={extraTypeInput === 'percentage' ? 'e.g. 10' : 'e.g. 1500'}
          />
          <DripButton
            title={t('recipes.addExtra')}
            onPress={handleAddExtraRow}
            variant="secondary"
            icon={<Plus size={16} color={theme.primary} />}
            style={{ marginTop: 8 }}
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
  cardSubtitle: {
    fontSize: 12,
    marginTop: 3,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  ingredientRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
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
  hppBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  draftItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  deleteDraftBtn: {
    padding: 6,
    borderRadius: 6,
  },
  subformBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  extraTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
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
