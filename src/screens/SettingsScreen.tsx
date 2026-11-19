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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useApp } from '../context/AppContext';
import { AppTheme, AVAILABLE_CURRENCIES, Expense } from '../types/models';
import { CategoryManagementModal } from './CategoryManagementModal';

const THEME_OPTIONS: { key: AppTheme; label: string }[] = [
  { key: 'dark', label: 'Obsidian' },
  { key: 'light', label: 'Porcelain' },
  { key: 'system', label: 'System' },
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
      const filename = `TrackMorph_export_${dateStr}.json`;

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
          dialogTitle: 'Export TrackMorph Data',
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TrackMorph Premium Brand Banner */}
        <LinearGradient
          colors={theme.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandBanner}
        >
          <LinearGradient
            colors={theme.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerIcon}
          >
            <Ionicons name="pulse" size={24} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>TrackMorph</Text>
            <Text style={styles.bannerSub}>Private On-Device Finance · v1.1.0</Text>
          </View>
          <View style={styles.proPill}>
            <Text style={styles.proPillText}>LOCAL</Text>
          </View>
        </LinearGradient>

        {/* Appearance */}
        <Text style={[styles.sectionHeader, { color: theme.secondaryText }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.rowLabel, { color: theme.text, marginBottom: 10 }]}>Theme</Text>
          <View style={[styles.segmented, { backgroundColor: theme.tertiaryBackground }]}>
            {THEME_OPTIONS.map((opt) => {
              const active = selectedTheme === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSelectedTheme(opt.key)}
                  style={[styles.segmentBtn, active && { backgroundColor: theme.accent }]}
                >
                  <Text style={[styles.segmentText, { color: active ? '#FFFFFF' : theme.secondaryText }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Currency */}
        <Text style={[styles.sectionHeader, { color: theme.secondaryText }]}>CURRENCY</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={() => setShowCurrencyModal(true)} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="cash-outline" size={16} color={theme.accent} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Primary Currency</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: theme.secondaryText }]}>
                {currentCurrencyObj.symbol} {currentCurrencyObj.code}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <Text style={[styles.sectionHeader, { color: theme.secondaryText }]}>CATEGORIES</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={() => setShowDefaultCatModal(true)} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: `${currentDefaultCat.colorHex}22` }]}>
                <View style={[styles.colorDot, { backgroundColor: currentDefaultCat.colorHex }]} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Default Category</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: theme.secondaryText }]}>{currentDefaultCat.name}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
            </View>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity onPress={() => setShowCategoryManager(true)} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="grid-outline" size={16} color={theme.accent} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Manage Categories</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <Text style={[styles.sectionHeader, { color: theme.secondaryText }]}>DATA MANAGEMENT</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={handleExport} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: theme.greenSoft }]}>
                <Ionicons name="share-outline" size={16} color={theme.green} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Export Backup (JSON)</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity onPress={handleImport} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="download-outline" size={16} color={theme.accent} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Import Backup (JSON)</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity onPress={handleReset} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: theme.redSoft }]}>
                <Ionicons name="trash-outline" size={16} color={theme.red} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.red }]}>Reset All Data</Text>
            </View>
          </TouchableOpacity>
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
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>
                    {c.symbol} {c.name} ({c.code})
                  </Text>
                  {selectedCurrency === c.code && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
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
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{cat.name}</Text>
                  </View>
                  {defaultCategoryID === cat.id && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
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
    paddingBottom: 10,
  },
  screenTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  brandBanner: {
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 4,
  },
  bannerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  bannerSub: { color: 'rgba(226,232,240,0.72)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  proPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.5)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  proPillText: { color: '#34D399', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 6,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowValue: { fontSize: 13, fontWeight: '600' },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 43 },
  segmented: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentText: { fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
});
