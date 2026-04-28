import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { formatMoney, money } from '../../domain/money';
import { loadDashboardSnapshot, type DashboardSnapshot } from '../../storage';
import { colors } from '../../theme/colors';
import type { RootStackParamList } from './navigationTypes';

function SectionCard(props: { title: string; children: ReactNode; tone?: keyof typeof colors }) {
  const backgroundColor = props.tone ? colors[props.tone] : colors.surface;

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <Text style={styles.cardTitle}>{props.title}</Text>
      {props.children}
    </View>
  );
}

const PORTFOLIO_BAR_COLORS = ['#14532D', '#1D4ED8', '#C77400', '#B42318', '#5A564B'];

function PortfolioOverview({ portfolios }: { portfolios: DashboardSnapshot['portfolios'] }) {
  const items = portfolios.map((p, idx) => {
    const value =
      p.availableCash.minorUnits +
      p.holdings.reduce((sum, h) => sum + h.marketValue.minorUnits, 0);
    return { id: p.id, name: p.name, value, color: PORTFOLIO_BAR_COLORS[idx % PORTFOLIO_BAR_COLORS.length] };
  });

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const hasData = total > 0;

  return (
    <View style={styles.overviewContainer}>
      <Text style={styles.categoriesLabel}>Overview</Text>
      {hasData ? (
        <>
          <View style={styles.barTrack}>
            {items
              .filter((item) => item.value > 0)
              .map((item) => (
                <View
                  key={item.id}
                  style={[styles.barSegment, { flex: item.value / total, backgroundColor: item.color }]}
                />
              ))}
          </View>
          <View style={styles.legendRow}>
            {items.map((item) => (
              <View key={item.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.name}</Text>
                <Text style={styles.legendValue}>
                  {total > 0 ? `${Math.round((item.value / total) * 100)}%` : '—'}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.overviewEmpty}>Add transactions to see portfolio allocation</Text>
      )}
    </View>
  );
}

type ConsolidatedDashboardProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ConsolidatedDashboard'>;
};

export function ConsolidatedDashboard({ navigation }: ConsolidatedDashboardProps) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void hydrateDashboard();
  }, []);

  const salaryTransactions = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.transactions.filter((t) => t.kind === 'income').slice(0, 5);
  }, [snapshot]);

  const monthlySalaryMinorUnits = useMemo(() => {
    if (!snapshot) return 0;
    const now = new Date();
    const yyyyMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return snapshot.transactions
      .filter((t) => t.kind === 'income' && t.occurredAt.startsWith(yyyyMM))
      .reduce((sum, t) => sum + t.baseAmount.minorUnits, 0);
  }, [snapshot]);

  async function hydrateDashboard() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextSnapshot = await loadDashboardSnapshot();
      setSnapshot(nextSnapshot);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load local finance data.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.stateTitle}>Preparing your local finance workspace</Text>
        <Text style={styles.stateBody}>Creating the on-device ledger, sample accounts, and portfolio snapshot.</Text>
      </View>
    );
  }

  if (errorMessage || !snapshot) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Local data could not be loaded</Text>
        <Text style={styles.stateBody}>{errorMessage ?? 'Unknown local storage error.'}</Text>
        <Pressable onPress={() => void hydrateDashboard()} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>All-in-one Finance</Text>
      </View>

      <View style={styles.metricRow}>
        <SectionCard title="Net cash" tone="cardA">
          <Text style={styles.metricValue}>{snapshot.metrics.netCash}</Text>
          <Text style={styles.metricLabel}>{snapshot.accounts.length} linked money accounts</Text>
        </SectionCard>
        <SectionCard title="Commitments" tone="cardB">
          <Text style={styles.metricValue}>{snapshot.metrics.monthlyCommitments}</Text>
          <Text style={styles.metricLabel}>{snapshot.subscriptions.length} recurring charges this month</Text>
        </SectionCard>
      </View>

      <SectionCard title="Portfolios" tone="surface">
        <PortfolioOverview portfolios={snapshot.portfolios} />

        <View style={styles.divider} />
        {snapshot.portfolios.map((portfolio) => (
          <Pressable
            key={portfolio.id}
            onPress={() => navigation.navigate('PortfolioDetail', { portfolioId: portfolio.id })}
            style={({ pressed }) => [styles.portfolioBlock, pressed && styles.portfolioBlockPressed]}
          >
            <View style={styles.portfolioHeader}>
              <Text style={styles.listTitle}>{portfolio.name}</Text>
              <Text style={styles.portfolioKind}>{portfolio.kind}</Text>
            </View>
            <Text style={styles.portfolioMeta}>
              {portfolio.holdings.length} positions · cash {formatMoney(portfolio.availableCash)}
            </Text>
            <Text style={styles.portfolioTapHint}>Tap to manage →</Text>
          </Pressable>
        ))}

        <View style={styles.divider} />

        <Text style={styles.categoriesLabel}>Categories</Text>
        <View style={styles.chipRow}>
          {snapshot.categories.map((category) => (
            <View key={category.id} style={styles.chip}>
              <Text style={styles.chipText}>{category.name}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Salary &amp; Income" tone="cardC">
        <View style={styles.salaryRow}>
          <View>
            <Text style={styles.salaryLabel}>This month</Text>
            <Text style={styles.metricValue}>
              {formatMoney(money(snapshot.baseCurrency, monthlySalaryMinorUnits))}
            </Text>
          </View>
        </View>
        {salaryTransactions.length > 0 ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.categoriesLabel}>Recent income</Text>
            {salaryTransactions.map((t) => (
              <View key={t.id} style={styles.incomeRow}>
                <Text style={styles.incomeNote}>{t.note ?? 'Income'}</Text>
                <Text style={styles.incomeAmount}>{formatMoney(t.baseAmount)}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.overviewEmpty}>No income recorded yet. Add one via a portfolio.</Text>
        )}
      </SectionCard>
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
  hero: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.mutedInk,
    fontSize: 13,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '500',
  },
  listTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  portfolioBlock: {
    borderRadius: 12,
    backgroundColor: colors.line,
    padding: 12,
    marginVertical: 8,
    gap: 6,
  },
  portfolioBlockPressed: {
    opacity: 0.6,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portfolioKind: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  portfolioMeta: {
    color: colors.mutedInk,
    fontSize: 13,
  },
  portfolioTapHint: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 12,
  },
  categoriesLabel: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  overviewContainer: {
    gap: 10,
    marginBottom: 4,
  },
  overviewEmpty: {
    color: colors.mutedInk,
    fontSize: 13,
    fontStyle: 'italic',
  },
  barTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.line,
    gap: 2,
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
  },
  legendValue: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: '600',
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  salaryLabel: {
    color: colors.mutedInk,
    fontSize: 13,
    marginBottom: 2,
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  incomeNote: {
    color: colors.ink,
    fontSize: 14,
    flex: 1,
  },
  incomeAmount: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
