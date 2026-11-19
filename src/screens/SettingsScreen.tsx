import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useApp } from '../context/AppContext';
import { AppTheme, AVAILABLE_CURRENCIES, Expense } from '../types/models';
import { CategoryManagementModal } from './CategoryManagementModal';

const THEME_OPTIONS: { key: AppTheme; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export function SettingsScreen() {
  const {
    theme,
    selectedTheme,
    setSelectedTheme,
    selectedCurrency,
    setSelectedCurrency,
    defaultCategoryID,
    setDefaultCategoryID,
    visibleCategories,
    getCategoryById,
    expenses,
    replaceAllExpenses,
    resetAllData,
  } = useApp();

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showDefaultCatModal, setShowDefaultCatModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const currentCurrencyObj =
    AVAILABLE_CURRENCIES.find((c) => c.code === selectedCurrency) ?? AVAILABLE_CURRENCIES[0];
  const currentDefaultCat = getCategoryById(defaultCategoryID);

  const handleExport = async () => {
    try {
      const json = JSON.stringify(expenses, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Inpenso_export_${dateStr}.json`;

      if (Platform.OS === 'web') {
        Alert.alert('Export Ready', `Prepared ${expenses.length} transactions in JSON format.`);
        return;
      }

      const file = new FileSystem.File(FileSystem.Paths.cache, filename);
      file.write(json);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Inpenso Data',
        });
      } else {
        Alert.alert('Export Saved', `Saved to ${file.uri}`);
      }
    } catch {
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const file = new FileSystem.File(asset.uri);
      const raw = await file.text();
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        throw new Error('Invalid format');
      }

      replaceAllExpenses(parsed as Expense[]);
      Alert.alert('Import Successful', `Imported ${parsed.length} transactions.`);
    } catch {
      Alert.alert('Import Failed', 'Failed to import data. Please check the JSON file format and try again.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Data Reset',
      'This will delete all your expenses and budgets. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetAllData(),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.groupedBackground }]}>
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Appearance */}
        <Text style={[styles.sectionHeader, { color: theme.secondaryText }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.rowLabel, { color: theme.text, marginBottom: 8 }]}>Theme</Text>
          <View style={[styles.segmented, { backgroundColor: theme.tertiaryBackground }]}>
            {THEME_OPTIONS.map((opt) => {
              const active = selectedTheme === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSelectedTheme(opt.key)}
                  style={[styles.segmentBtn, active && { backgroundColor: theme.cardBackground }]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: active ? theme.accent : theme.secondaryText },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Currency */}
        <Text style={[styles.sectionHeader, { color: theme.secondaryText }]}>CURRENCY</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <TouchableOpacity onPress={() => setShowCurrencyModal(true)} style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Currency</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: theme.secondaryText }]}>
                {currentCurrencyObj.symbol} {currentCurrencyObj.code}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Default Settings & Categories */}
        <Text style={[styles.sectionHeader, { color: theme.secondaryText }]}>CATEGORIES</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <TouchableOpacity onPress={() => setShowDefaultCatModal(true)} style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Default Category</Text>
            <View style={styles.rowRight}>
              <View style={[styles.colorDot, { backgroundColor: currentDefaultCat.colorHex }]} />
              <Text style={[styles.rowValue, { color: theme.secondaryText }]}>{currentDefaultCat.name}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
            </View>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity onPress={() => setShowCategoryManager(true)} style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="grid-outline" size={18} color={theme.accent} />
              <Text style={[styles.rowLabel, { color: theme.text }]}>Manage Categories</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <Text style={[styles.sectionHeader, { color: theme.secondaryText }]}>DATA MANAGEMENT</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <TouchableOpacity onPress={handleExport} style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="share-outline" size={18} color={theme.accent} />
              <Text style={[styles.rowLabel, { color: theme.text }]}>Export Data (JSON)</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity onPress={handleImport} style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="download-outline" size={18} color={theme.accent} />
              <Text style={[styles.rowLabel, { color: theme.text }]}>Import Data (JSON)</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity onPress={handleReset} style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="trash-outline" size={18} color={theme.red} />
              <Text style={[styles.rowLabel, { color: theme.red }]}>Reset All Data</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={[styles.sectionHeader, { color: theme.secondaryText }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>App</Text>
            <Text style={[styles.rowValue, { color: theme.secondaryText }]}>Inpenso for Android</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Version</Text>
            <Text style={[styles.rowValue, { color: theme.secondaryText }]}>1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>License</Text>
            <Text style={[styles.rowValue, { color: theme.secondaryText }]}>MIT (Port of VintusS/Inpenso)</Text>
          </View>
        </View>
      </ScrollView>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyModal(false)}
        >
          <View style={[styles.sheetBox, { backgroundColor: theme.cardBackground, maxHeight: '75%' }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Select Currency</Text>
            <ScrollView>
              {AVAILABLE_CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => {
                    setSelectedCurrency(c.code);
                    setShowCurrencyModal(false);
                  }}
                  style={styles.sheetOption}
                >
                  <Text style={{ color: theme.text, fontSize: 15 }}>
                    {c.symbol} {c.name} ({c.code})
                  </Text>
                  {selectedCurrency === c.code && <Ionicons name="checkmark" size={18} color={theme.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Default Category Picker Modal */}
      <Modal
        visible={showDefaultCatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDefaultCatModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDefaultCatModal(false)}
        >
          <View style={[styles.sheetBox, { backgroundColor: theme.cardBackground, maxHeight: '75%' }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Default Category</Text>
            <ScrollView>
              {visibleCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    setDefaultCategoryID(cat.id);
                    setShowDefaultCatModal(false);
                  }}
                  style={styles.sheetOption}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.colorDot, { backgroundColor: cat.colorHex }]} />
                    <Text style={{ color: theme.text, fontSize: 15 }}>{cat.name}</Text>
                  </View>
                  {defaultCategoryID === cat.id && <Ionicons name="checkmark" size={18} color={theme.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <CategoryManagementModal
        visible={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 6,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 14 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  divider: { height: StyleSheet.hairlineWidth },
  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentText: { fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetBox: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
