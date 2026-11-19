import React, { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppProvider, useApp } from './src/context/AppContext';
import { Expense } from './src/types/models';
import { HomeScreen } from './src/screens/HomeScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TransactionModal } from './src/screens/TransactionModal';

type MainTab = 'home' | 'analytics' | 'transactions' | 'settings';

function MainShell() {
  const { isReady, theme } = useApp();
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const openAdd = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
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

  const renderTabButton = (
    key: MainTab,
    label: string,
    icon: React.ComponentProps<typeof Ionicons>['name'],
    activeIcon: React.ComponentProps<typeof Ionicons>['name']
  ) => {
    const active = activeTab === key;
    return (
      <TouchableOpacity
        key={key}
        onPress={() => setActiveTab(key)}
        style={styles.tabItem}
        activeOpacity={0.75}
      >
        <View style={[styles.tabIconWrap, active && { backgroundColor: theme.accentSoft }]}>
          <Ionicons
            name={active ? activeIcon : icon}
            size={20}
            color={active ? theme.accent : theme.secondaryText}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: active ? theme.accent : theme.secondaryText, fontWeight: active ? '700' : '600' },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.groupedBackground }]}
      edges={['top', 'left', 'right']}
    >
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

      {/* Floating Glass Pill Navigation Dock with Center Quick-Add FAB */}
      <SafeAreaView edges={['bottom']} style={styles.dockOuter} pointerEvents="box-none">
        <View
          style={[
            styles.dockPill,
            {
              backgroundColor: theme.tabBarBg,
              borderColor: theme.tabBarBorder,
            },
          ]}
        >
          {renderTabButton('home', 'Home', 'home-outline', 'home')}
          {renderTabButton('analytics', 'Analytics', 'pie-chart-outline', 'pie-chart')}

          <TouchableOpacity onPress={openAdd} activeOpacity={0.85} style={styles.fabTouch}>
            <LinearGradient
              colors={theme.accentGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabButton}
            >
              <Ionicons name="add" size={26} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          {renderTabButton('transactions', 'History', 'receipt-outline', 'receipt')}
          {renderTabButton('settings', 'Settings', 'settings-outline', 'settings')}
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
  dockOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  dockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  fabTouch: {
    marginHorizontal: 4,
    marginTop: -22,
  },
  fabButton: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});
