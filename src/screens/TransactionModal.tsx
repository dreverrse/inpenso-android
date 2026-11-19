import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { Expense, TransactionType } from '../types/models';
import { CategoryGrid } from '../components/CategoryGrid';
import { formatShortDate, getCurrencySymbol } from '../utils/format';

interface TransactionModalProps {
  visible: boolean;
  editingExpense: Expense | null;
  onClose: () => void;
}

export function TransactionModal({ visible, editingExpense, onClose }: TransactionModalProps) {
  const {
    theme,
    selectedCurrency,
    defaultCategoryID,
    categoriesForPicker,
    preferredCategoryID,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useApp();

  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategoryID, setSelectedCategoryID] = useState(defaultCategoryID);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateInput, setDateInput] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (editingExpense) {
      setTransactionType(editingExpense.type);
      setTitle(editingExpense.title);
      setPrice(String(editingExpense.price));
      setSelectedCategoryID(editingExpense.categoryID);
      const d = new Date(editingExpense.date);
      setSelectedDate(d);
      setDateInput(d.toISOString().slice(0, 10));
      setNotes(editingExpense.notes ?? '');
    } else {
      const now = new Date();
      setTransactionType('expense');
      setTitle('');
      setPrice('');
      setSelectedCategoryID(preferredCategoryID(defaultCategoryID));
      setSelectedDate(now);
      setDateInput(now.toISOString().slice(0, 10));
      setNotes('');
    }
  }, [visible, editingExpense, defaultCategoryID, preferredCategoryID]);

  const pickerCategories = categoriesForPicker(editingExpense?.categoryID);
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  const shiftDays = (days: number) => {
    const next = new Date();
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
    setDateInput(next.toISOString().slice(0, 10));
  };

  const handleDateTextChange = (text: string) => {
    setDateInput(text);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const parsed = new Date(`${text}T12:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
      }
    }
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Validation', 'Please enter a title.');
      return;
    }
    const normalizedPrice = price.replace(',', '.').trim();
    const numericPrice = Number(normalizedPrice);
    if (!normalizedPrice || Number.isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Validation', 'Please enter a valid positive amount.');
      return;
    }

    if (editingExpense) {
      updateExpense({
        ...editingExpense,
        title: trimmedTitle,
        price: numericPrice,
        date: selectedDate.toISOString(),
        type: transactionType,
        categoryID: selectedCategoryID,
        notes: notes.trim() || undefined,
      });
    } else {
      addExpense({
        title: trimmedTitle,
        price: numericPrice,
        date: selectedDate.toISOString(),
        categoryID: selectedCategoryID,
        type: transactionType,
        notes: notes.trim() || undefined,
      });
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editingExpense) return;
    Alert.alert('Delete Transaction', `Delete "${editingExpense.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteExpense(editingExpense.id);
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }
          onClose();
        },
      },
    ]);
  };

  const isFormValid = title.trim().length > 0 && price.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.groupedBackground }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: theme.secondaryText }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {editingExpense ? 'Edit Entry' : 'New Entry'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={!isFormValid} style={[styles.headerBtn, { alignItems: 'flex-end' }]}>
            <Text
              style={[
                styles.headerBtnText,
                { color: isFormValid ? theme.accent : theme.secondaryText, fontWeight: '800' },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Hero Amount Card */}
          <View style={[styles.heroAmountCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={[styles.segmented, { backgroundColor: theme.tertiaryBackground }]}>
              {(['expense', 'income'] as TransactionType[]).map((type) => {
                const active = transactionType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setTransactionType(type)}
                    style={[
                      styles.segmentBtn,
                      active && {
                        backgroundColor: type === 'income' ? theme.green : theme.accent,
                      },
                    ]}
                  >
                    <Ionicons
                      name={type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={15}
                      color={active ? '#FFFFFF' : theme.secondaryText}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        { color: active ? '#FFFFFF' : theme.secondaryText },
                      ]}
                    >
                      {type === 'expense' ? 'Expense' : 'Income'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.bigAmountRow}>
              <Text
                style={[
                  styles.bigCurrency,
                  { color: transactionType === 'income' ? theme.green : theme.accent },
                ]}
              >
                {currencySymbol}
              </Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={theme.gray}
                keyboardType="decimal-pad"
                style={[styles.bigAmountInput, { color: theme.text }]}
              />
            </View>

            <View style={[styles.inputRow, { backgroundColor: theme.tertiaryBackground }]}>
              <Ionicons name="create-outline" size={18} color={theme.secondaryText} />
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={transactionType === 'expense' ? 'What did you spend on?' : 'Income source'}
                placeholderTextColor={theme.secondaryText}
                style={[styles.input, { color: theme.text }]}
              />
            </View>
          </View>

          {/* Category Card */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Category</Text>
            <CategoryGrid
              categories={pickerCategories}
              selectedCategoryID={selectedCategoryID}
              onSelect={setSelectedCategoryID}
            />
          </View>

          {/* Date Card */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.dateHeader}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>Date</Text>
              <Text style={[styles.datePreview, { color: theme.accent }]}>
                {formatShortDate(selectedDate.toISOString())}
              </Text>
            </View>
            <View style={styles.quickDates}>
              {[
                { label: 'Today', offset: 0 },
                { label: 'Yesterday', offset: -1 },
                { label: '2 days ago', offset: -2 },
              ].map((d) => (
                <TouchableOpacity
                  key={d.label}
                  onPress={() => shiftDays(d.offset)}
                  style={[styles.chip, { backgroundColor: theme.tertiaryBackground }]}
                >
                  <Text style={[styles.chipText, { color: theme.text }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.inputRow, { backgroundColor: theme.tertiaryBackground }]}>
              <Ionicons name="calendar-outline" size={16} color={theme.secondaryText} />
              <TextInput
                value={dateInput}
                onChangeText={handleDateTextChange}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.secondaryText}
                style={[styles.input, { color: theme.text }]}
              />
            </View>
          </View>

          {/* Notes Card */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Notes (Optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any extra notes..."
              placeholderTextColor={theme.secondaryText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[styles.notesInput, { backgroundColor: theme.tertiaryBackground, color: theme.text }]}
            />
          </View>

          {/* Gradient Save CTA */}
          <TouchableOpacity onPress={handleSave} disabled={!isFormValid} activeOpacity={0.85}>
            <LinearGradient
              colors={isFormValid ? theme.accentGradient : [theme.gray, theme.gray]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>
                {editingExpense ? 'Save Changes' : 'Save Transaction'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {editingExpense && (
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.deleteBtn, { backgroundColor: theme.redSoft, borderColor: theme.red }]}
            >
              <Ionicons name="trash-outline" size={18} color={theme.red} />
              <Text style={[styles.deleteBtnText, { color: theme.red }]}>Delete Transaction</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerBtn: { minWidth: 64 },
  headerBtnText: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  heroAmountCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    gap: 16,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bigAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  bigCurrency: {
    fontSize: 28,
    fontWeight: '800',
  },
  bigAmountInput: {
    fontSize: 42,
    fontWeight: '800',
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
    letterSpacing: -1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePreview: { fontSize: 13, fontWeight: '700' },
  quickDates: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  chipText: { fontSize: 12, fontWeight: '700' },
  notesInput: {
    borderRadius: 14,
    padding: 13,
    minHeight: 84,
    fontSize: 14,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '700' },
});
