import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { EDITOR_COLORS, EDITOR_ICONS, FinanceCategory } from '../types/models';
import { mapIconName } from '../utils/icons';

interface CategoryManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CategoryManagementModal({ visible, onClose }: CategoryManagementModalProps) {
  const {
    theme,
    visibleCategories,
    hiddenCategories,
    defaultCategoryID,
    setDefaultCategoryID,
    preferredCategoryID,
    addCategory,
    updateCategory,
    hideCategory,
    restoreCategory,
    moveCategory,
    resetBuiltInOverride,
    isCategoryHidden,
    hasBuiltInOverride,
  } = useApp();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingCat, setEditingCat] = useState<FinanceCategory | null>(null);
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('tag.fill');
  const [colorHex, setColorHex] = useState('#007AFF');

  const openNew = () => {
    setEditingCat(null);
    setName('');
    setIconName('tag.fill');
    setColorHex('#007AFF');
    setEditorVisible(true);
  };

  const openEdit = (cat: FinanceCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setIconName(cat.iconName);
    setColorHex(cat.colorHex);
    setEditorVisible(true);
  };

  const saveEditor = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Category name is required.');
      return;
    }
    if (editingCat) {
      updateCategory({ ...editingCat, name: trimmed, iconName, colorHex });
    } else {
      addCategory(trimmed, iconName, colorHex);
    }
    setEditorVisible(false);
  };

  const handleHide = (cat: FinanceCategory) => {
    hideCategory(cat);
    const nextDefault = preferredCategoryID(defaultCategoryID);
    if (nextDefault !== defaultCategoryID) {
      setDefaultCategoryID(nextDefault);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.groupedBackground }]}>
        <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: theme.accent }]}>Done</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Categories</Text>
          <TouchableOpacity onPress={openNew} style={[styles.headerBtn, { alignItems: 'flex-end' }]}>
            <Ionicons name="add" size={24} color={theme.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Visible</Text>
          <View style={styles.grid}>
            {visibleCategories.map((cat, index) => (
              <View key={cat.id} style={[styles.tile, { backgroundColor: theme.cardBackground }]}>
                <TouchableOpacity onPress={() => openEdit(cat)} style={styles.tileMain}>
                  <View style={[styles.circle, { backgroundColor: cat.colorHex }]}>
                    <Ionicons name={mapIconName(cat.iconName)} size={22} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.tileName, { color: theme.text }]} numberOfLines={2}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>

                <View style={styles.reorderRow}>
                  <TouchableOpacity
                    disabled={index === 0}
                    onPress={() => moveCategory(cat.id, 'left')}
                    style={{ opacity: index === 0 ? 0.3 : 1, padding: 4 }}
                  >
                    <Ionicons name="chevron-back" size={14} color={theme.secondaryText} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={index === visibleCategories.length - 1}
                    onPress={() => moveCategory(cat.id, 'right')}
                    style={{ opacity: index === visibleCategories.length - 1 ? 0.3 : 1, padding: 4 }}
                  >
                    <Ionicons name="chevron-forward" size={14} color={theme.secondaryText} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {hiddenCategories.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 12 }]}>Hidden</Text>
              <View style={styles.grid}>
                {hiddenCategories.map((cat) => (
                  <View key={cat.id} style={[styles.tile, { backgroundColor: theme.cardBackground, opacity: 0.7 }]}>
                    <TouchableOpacity onPress={() => openEdit(cat)} style={styles.tileMain}>
                      <View style={[styles.circle, { backgroundColor: cat.colorHex }]}>
                        <Ionicons name={mapIconName(cat.iconName)} size={22} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.tileName, { color: theme.secondaryText }]} numberOfLines={2}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => restoreCategory(cat)} style={styles.restoreBtn}>
                      <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '700' }}>Restore</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Category Editor Modal */}
        <Modal
          visible={editorVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditorVisible(false)}
        >
          <View style={[styles.container, { backgroundColor: theme.groupedBackground }]}>
            <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
              <TouchableOpacity onPress={() => setEditorVisible(false)} style={styles.headerBtn}>
                <Text style={[styles.headerBtnText, { color: theme.accent }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {editingCat ? 'Edit Category' : 'New Category'}
              </Text>
              <TouchableOpacity onPress={saveEditor} style={[styles.headerBtn, { alignItems: 'flex-end' }]}>
                <Text style={[styles.headerBtnText, { color: theme.accent, fontWeight: '700' }]}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.cardLabel, { color: theme.secondaryText }]}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Category name"
                  placeholderTextColor={theme.secondaryText}
                  style={[styles.input, { backgroundColor: theme.tertiaryBackground, color: theme.text }]}
                />
              </View>

              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.cardLabel, { color: theme.secondaryText }]}>Icon</Text>
                <View style={styles.iconGrid}>
                  {EDITOR_ICONS.map((ic) => {
                    const selected = iconName === ic;
                    return (
                      <TouchableOpacity
                        key={ic}
                        onPress={() => setIconName(ic)}
                        style={[
                          styles.iconPickBtn,
                          { backgroundColor: selected ? theme.accent : theme.tertiaryBackground },
                        ]}
                      >
                        <Ionicons name={mapIconName(ic)} size={20} color={selected ? '#FFFFFF' : theme.text} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.cardLabel, { color: theme.secondaryText }]}>Color</Text>
                <View style={styles.colorGrid}>
                  {EDITOR_COLORS.map((c) => {
                    const selected = colorHex === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setColorHex(c)}
                        style={[styles.colorDot, { backgroundColor: c }]}
                      >
                        {selected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {editingCat && (
                <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                  {isCategoryHidden(editingCat.id) ? (
                    <TouchableOpacity
                      onPress={() => {
                        restoreCategory(editingCat);
                        setEditorVisible(false);
                      }}
                      style={styles.actionRow}
                    >
                      <Ionicons name="eye-outline" size={18} color={theme.accent} />
                      <Text style={{ color: theme.accent, fontSize: 15, fontWeight: '600' }}>Restore Category</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        handleHide(editingCat);
                        setEditorVisible(false);
                      }}
                      style={styles.actionRow}
                    >
                      <Ionicons name="eye-off-outline" size={18} color={theme.red} />
                      <Text style={{ color: theme.red, fontSize: 15, fontWeight: '600' }}>Remove from Pickers</Text>
                    </TouchableOpacity>
                  )}

                  {!editingCat.isCustom && hasBuiltInOverride(editingCat.id) && (
                    <TouchableOpacity
                      onPress={() => {
                        resetBuiltInOverride(editingCat.id);
                        setEditorVisible(false);
                      }}
                      style={styles.actionRow}
                    >
                      <Ionicons name="refresh-outline" size={18} color={theme.red} />
                      <Text style={{ color: theme.red, fontSize: 15, fontWeight: '600' }}>Reset to Defaults</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { minWidth: 60 },
  headerBtnText: { fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '31%',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
  },
  tileMain: { alignItems: 'center', gap: 6 },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    minHeight: 30,
  },
  reorderRow: { flexDirection: 'row', gap: 12 },
  restoreBtn: { paddingVertical: 2 },
  card: { borderRadius: 16, padding: 16, gap: 10 },
  cardLabel: { fontSize: 13, fontWeight: '600' },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconPickBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
});
