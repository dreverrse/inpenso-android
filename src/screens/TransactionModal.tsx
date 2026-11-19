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
        <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: theme.accent }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {editingExpense ? 'Edit Transaction' : 'Add Transaction'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={!isFormValid} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: isFormValid ? theme.accent : theme.secondaryText, fontWeight: '700' }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Transaction Details Card */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Transaction Details</Text>

            {/* Segmented Control */}
            <View style={[styles.segmented, { backgroundColor: theme.tertiaryBackground }]}>
              {(['expense', 'income'] as TransactionType[]).map((type) => {
                const active = transactionType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setTransactionType(type)}
                    style={[
                      styles.segmentBtn,
                      active && { backgroundColor: theme.cardBackground },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: active ? (type === 'income' ? theme.green : theme.text) : theme.secondaryText },
                      ]}
                    >
                      {type === 'expense' ? 'Expense' : 'Income'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.secondaryText }]}>Title</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.tertiaryBackground }]}>
              <Ionicons name="pencil" size={16} color={theme.secondaryText} />
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={transactionType === 'expense' ? 'Expense title' : 'Income title'}
                placeholderTextColor={theme.secondaryText}
                style={[styles.input, { color: theme.text }]}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: theme.secondaryText }]}>Amount</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.tertiaryBackground }]}>
              <Text style={[styles.currencyPrefix, { color: theme.accent }]}>{currencySymbol}</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={theme.secondaryText}
                keyboardType="decimal-pad"
                style={[styles.input, styles.amountInput, { color: theme.text }]}
              />
              {price.length > 0 && (
                <TouchableOpacity onPress={() => setPrice('')}>
                  <Ionicons name="close-circle" size={18} color={theme.secondaryText} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Card */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Category</Text>
            <CategoryGrid
              categories={pickerCategories}
              selectedCategoryID={selectedCategoryID}
              onSelect={setSelectedCategoryID}
            />
          </View>

          {/* Date Card */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.dateHeader}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>Date</Text>
              <Text style={[styles.datePreview, { color: theme.accent }]}>
                {formatShortDate(selectedDate.toISOString())}
              </Text>
            </View>
            <View style={styles.quickDates}>
              <TouchableOpacity
                onPress={() => shiftDays(0)}
                style={[styles.chip, { backgroundColor: theme.tertiaryBackground }]}
              >
                <Text style={[styles.chipText, { color: theme.text }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => shiftDays(-1)}
                style={[styles.chip, { backgroundColor: theme.tertiaryBackground }]}
              >
                <Text style={[styles.chipText, { color: theme.text }]}>Yesterday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => shiftDays(-2)}
                style={[styles.chip, { backgroundColor: theme.tertiaryBackground }]}
              >
                <Text style={[styles.chipText, { color: theme.text }]}>2 days ago</Text>
              </TouchableOpacity>
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
          <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
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

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isFormValid}
            style={[styles.primaryBtn, { backgroundColor: isFormValid ? theme.accent : theme.gray }]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>{editingExpense ? 'Save Changes' : 'Save Transaction'}</Text>
          </TouchableOpacity>

          {editingExpense && (
            <TouchableOpacity onPress={handleDelete} style={[styles.primaryBtn, { backgroundColor: theme.red }]}>
              <Ionicons name="trash" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Delete Transaction</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { minWidth: 60 },
  headerBtnText: { fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 36,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
  },
  amountInput: {
    fontSize: 20,
    fontWeight: '700',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePreview: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickDates: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesInput: {
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    fontSize: 15,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
