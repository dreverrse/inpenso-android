import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/context/AppContext';
import { Expense } from './src/types/models';
import { HomeScreen } from './src/screens/HomeScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TransactionModal } from './src/screens/TransactionModal';

type MainTab = 'home' | 'analytics' | 'transactions' | 'settings';

const NAV_ITEMS: {
  key: MainTab;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'analytics', label: 'Analytics', icon: 'pie-chart-outline', activeIcon: 'pie-chart' },
  { key: 'transactions', label: 'Transactions', icon: 'list-outline', activeIcon: 'list' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

function MainShell() {
  const { isReady, theme } = useApp();
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const openAdd = () => {
    setEditingExpense(null);
    setModalVisible(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setModalVisible(true);
  };

  if (!isReady) {
    return (
      <SafeAreaView style={[styles.loading, { backgroundColor: theme.groupedBackground }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.groupedBackground }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen
            onOpenAdd={openAdd}
            onEditExpense={openEdit}
            onSwitchToTransactions={() => setActiveTab('transactions')}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsScreen />}
        {activeTab === 'transactions' && (
          <TransactionsScreen onOpenAdd={openAdd} onEditExpense={openEdit} />
        )}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      <SafeAreaView
        edges={['bottom']}
        style={[styles.tabBarWrap, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}
      >
        <View style={styles.tabBar}>
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setActiveTab(item.key)}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={active ? item.activeIcon : item.icon}
                  size={22}
                  color={active ? theme.accent : theme.secondaryText}
                />
                <Text style={[styles.tabLabel, { color: active ? theme.accent : theme.secondaryText }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      <TransactionModal
        visible={modalVisible}
        editingExpense={editingExpense}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  tabBarWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
