import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { formatMoney } from '../../domain/money';
import { FinanceComposer } from '../finance';
import { loadDashboardSnapshot, type DashboardSnapshot } from '../../storage';
import { colors } from '../../theme/colors';
import type { RootStackParamList } from './navigationTypes';

type PortfolioDetailProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PortfolioDetail'>;
  route: RouteProp<RootStackParamList, 'PortfolioDetail'>;
};

export function PortfolioDetailScreen({ navigation, route }: PortfolioDetailProps) {
  const { portfolioId } = route.params;
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void hydrateData();
  }, []);

  async function hydrateData() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextSnapshot = await loadDashboardSnapshot();
      setSnapshot(nextSnapshot);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load portfolio data.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.stateTitle}>Loading portfolio</Text>
      </View>
    );
  }

  if (errorMessage || !snapshot) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Could not load portfolio</Text>
        <Text style={styles.stateBody}>{errorMessage ?? 'Unknown error.'}</Text>
        <Pressable onPress={() => void hydrateData()} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const portfolio = snapshot.portfolios.find((p) => p.id === portfolioId);

  if (!portfolio) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Portfolio not found</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const portfolioTransactions = snapshot.transactions.filter((transaction) => transaction.portfolioId === portfolio.id);
  const portfolioRules = snapshot.recurringRules.filter((rule) => rule.portfolioId === portfolio.id);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{portfolio.name}</Text>
        <Text style={styles.kind}>{portfolio.kind} portfolio</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: colors.cardA }]}>
          <Text style={styles.metricLabel}>Available cash</Text>
          <Text style={styles.metricValue}>{formatMoney(portfolio.availableCash)}</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.cardB }]}>
          <Text style={styles.metricLabel}>Holdings</Text>
          <Text style={styles.metricValue}>{portfolio.holdings.length}</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.cardC }]}>
          <Text style={styles.metricLabel}>Currency</Text>
          <Text style={styles.metricValue}>{portfolio.baseCurrency}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Holdings</Text>
        {portfolio.holdings.length === 0 ? (
          <Text style={styles.emptyState}>No holdings yet. Start building your portfolio.</Text>
        ) : (
          portfolio.holdings.map((holding) => (
            <View key={holding.id} style={styles.holdingRow}>
              <View style={styles.holdingInfo}>
                <Text style={styles.holdingAsset}>{holding.assetId.toUpperCase()}</Text>
                <Text style={styles.holdingDetail}>
                  {holding.quantity}x · Cost {formatMoney(holding.costBasis)}
                </Text>
              </View>
              <View style={styles.holdingValue}>
                <Text style={styles.holdingMarketValue}>{formatMoney(holding.marketValue)}</Text>
                <Text style={styles.holdingGain}>
                  {holding.marketValue.minorUnits >= holding.costBasis.minorUnits ? '+' : ''}
                  {formatMoney({
                    currency: holding.marketValue.currency,
                    minorUnits: holding.marketValue.minorUnits - holding.costBasis.minorUnits,
                  })}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Passive income</Text>
        {portfolio.passiveIncome.length === 0 ? (
          <Text style={styles.emptyState}>No passive income tracked for this portfolio.</Text>
        ) : (
          portfolio.passiveIncome.map((income) => (
            <View key={income.id} style={styles.incomeRow}>
              <View>
                <Text style={styles.incomeKind}>{income.kind}</Text>
                <Text style={styles.incomeMeta}>Last paid {income.lastPaidAt}</Text>
              </View>
              <Text style={styles.incomeAmount}>{formatMoney(income.annualEstimate)}/year</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operations</Text>
        <FinanceComposer portfolioId={portfolio.id} portfolioName={portfolio.name} snapshot={snapshot} onSaved={hydrateData} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent transactions</Text>
        {portfolioTransactions.length === 0 ? (
          <Text style={styles.emptyState}>No transactions yet for this portfolio.</Text>
        ) : (
          portfolioTransactions.slice(0, 8).map((transaction) => (
            <View key={transaction.id} style={styles.incomeRow}>
              <View>
                <Text style={styles.incomeKind}>{transaction.note ?? transaction.kind}</Text>
                <Text style={styles.incomeMeta}>{transaction.occurredAt}</Text>
              </View>
              <Text style={styles.incomeAmount}>{formatMoney(transaction.originalAmount)}</Text>
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
            <View key={rule.id} style={styles.incomeRow}>
              <View>
                <Text style={styles.incomeKind}>{rule.label}</Text>
                <Text style={styles.incomeMeta}>
                  {rule.frequency} · next {rule.nextOccurrenceAt}
                </Text>
              </View>
              <Text style={styles.incomeAmount}>{formatMoney(rule.amount)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 24,
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
    gap: 8,
    paddingVertical: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  kind: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  metricLabel: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    gap: 12,
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
    paddingVertical: 16,
  },
  holdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  holdingInfo: {
    flex: 1,
    gap: 4,
  },
  holdingAsset: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  holdingDetail: {
    color: colors.mutedInk,
    fontSize: 13,
  },
  holdingValue: {
    alignItems: 'flex-end',
    gap: 4,
  },
  holdingMarketValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  holdingGain: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  incomeKind: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  incomeMeta: {
    color: colors.mutedInk,
    fontSize: 13,
    marginTop: 2,
  },
  incomeAmount: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
});
