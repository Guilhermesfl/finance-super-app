import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { formatMoney } from '../../domain/money';
import { FinanceComposer } from '../finance';
import { loadDashboardSnapshot, type DashboardSnapshot } from '../../storage';
import { colors } from '../../theme/colors';
import type { RootStackParamList } from './navigationTypes';

type PortfolioOperationsProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PortfolioOperations'>;
  route: RouteProp<RootStackParamList, 'PortfolioOperations'>;
};

export function PortfolioOperationsScreen({ route }: PortfolioOperationsProps) {
  const { portfolioId, mode = 'create' } = route.params;
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'create' | 'activity'>(mode);

  useEffect(() => {
    void hydrateData();
  }, []);

  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  async function hydrateData() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextSnapshot = await loadDashboardSnapshot();
      setSnapshot(nextSnapshot);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load portfolio operations.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.stateTitle}>Loading operations</Text>
      </View>
    );
  }

  if (errorMessage || !snapshot) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Could not load operations</Text>
        <Text style={styles.stateBody}>{errorMessage ?? 'Unknown error.'}</Text>
        <Pressable onPress={() => void hydrateData()} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const portfolio = snapshot.portfolios.find((item) => item.id === portfolioId);

  if (!portfolio) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Portfolio not found</Text>
      </View>
    );
  }

  const portfolioTransactions = snapshot.transactions.filter((transaction) => transaction.portfolioId === portfolio.id);
  const portfolioRules = snapshot.recurringRules.filter((rule) => rule.portfolioId === portfolio.id);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Operations hub</Text>
        <Text style={styles.subtitle}>{portfolio.name}</Text>
      </View>

      <View style={styles.modeSwitch}>
        <Pressable
          onPress={() => setActiveMode('create')}
          style={[styles.modeButton, activeMode === 'create' ? styles.modeButtonActive : null]}
        >
          <Text style={[styles.modeLabel, activeMode === 'create' ? styles.modeLabelActive : null]}>Create</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveMode('activity')}
          style={[styles.modeButton, activeMode === 'activity' ? styles.modeButtonActive : null]}
        >
          <Text style={[styles.modeLabel, activeMode === 'activity' ? styles.modeLabelActive : null]}>Activity</Text>
        </Pressable>
      </View>

      {activeMode === 'create' ? (
        <FinanceComposer
          portfolioId={portfolio.id}
          portfolioName={portfolio.name}
          snapshot={snapshot}
          onSaved={hydrateData}
        />
      ) : (
        <View style={styles.activityRoot}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent transactions</Text>
            {portfolioTransactions.length === 0 ? (
              <Text style={styles.emptyState}>No transactions yet for this portfolio.</Text>
            ) : (
              portfolioTransactions.slice(0, 10).map((transaction) => (
                <View key={transaction.id} style={styles.row}>
                  <View>
                    <Text style={styles.rowTitle}>{transaction.note ?? transaction.kind}</Text>
                    <Text style={styles.rowMeta}>{transaction.occurredAt}</Text>
                  </View>
                  <Text style={styles.rowValue}>{formatMoney(transaction.originalAmount)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recurring rules</Text>
            {portfolioRules.length === 0 ? (
              <Text style={styles.emptyState}>No recurring rules for this portfolio yet.</Text>
            ) : (
              portfolioRules.map((rule) => (
                <View key={rule.id} style={styles.row}>
                  <View>
                    <Text style={styles.rowTitle}>{rule.label}</Text>
                    <Text style={styles.rowMeta}>
                      {rule.frequency} · next {rule.nextOccurrenceAt}
                    </Text>
                  </View>
                  <Text style={styles.rowValue}>{formatMoney(rule.amount)}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: colors.canvas,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.canvas,
  },
  stateTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateBody: {
    color: colors.mutedInk,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retryLabel: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    gap: 6,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.mutedInk,
    fontSize: 14,
    fontWeight: '600',
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 6,
  },
  modeButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  modeButtonActive: {
    backgroundColor: colors.cardA,
  },
  modeLabel: {
    color: colors.mutedInk,
    fontSize: 14,
    fontWeight: '700',
  },
  modeLabelActive: {
    color: colors.ink,
  },
  activityRoot: {
    gap: 18,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    color: colors.mutedInk,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  rowMeta: {
    color: colors.mutedInk,
    fontSize: 13,
    marginTop: 2,
  },
  rowValue: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
});
