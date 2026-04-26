import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '../../domain/money';
import { FinanceComposer } from '../finance';
import { loadDashboardSnapshot, type DashboardSnapshot } from '../../storage';
import { colors } from '../../theme/colors';

function SectionCard(props: { title: string; children: ReactNode; tone?: keyof typeof colors }) {
  const backgroundColor = props.tone ? colors[props.tone] : colors.surface;

  return (
    <View style={[styles.card, { backgroundColor }]}> 
      <Text style={styles.cardTitle}>{props.title}</Text>
      {props.children}
    </View>
  );
}

export function DashboardScreen() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void hydrateDashboard();
  }, []);

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
        <Text style={styles.eyebrow}>Phase 1 foundation</Text>
        <Text style={styles.title}>One place for spending, subscriptions and investing.</Text>
        <Text style={styles.subtitle}>
          The first build centralizes daily finance first, while keeping portfolios and passive income in the same ledger.
        </Text>
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

      <FinanceComposer snapshot={snapshot} onSaved={hydrateDashboard} />

      <SectionCard title="Categories in focus" tone="surface">
        <View style={styles.chipRow}>
          {snapshot.categories.map((category) => (
            <View key={category.id} style={styles.chip}>
              <Text style={styles.chipText}>{category.name}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Recent activity" tone="cardC">
        {snapshot.transactions.map((transaction) => (
          <View key={transaction.id} style={styles.listRow}>
            <View>
              <Text style={styles.listTitle}>{transaction.note ?? transaction.kind}</Text>
              <Text style={styles.listMeta}>{transaction.occurredAt}</Text>
            </View>
            <Text style={styles.listValue}>{formatMoney(transaction.originalAmount)}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Recurring plan" tone="surface">
        {snapshot.recurringRules.map((rule) => (
          <View key={rule.id} style={styles.listRow}>
            <View>
              <Text style={styles.listTitle}>{rule.label}</Text>
              <Text style={styles.listMeta}>
                {rule.frequency} · next {rule.nextOccurrenceAt}
              </Text>
            </View>
            <Text style={styles.listValue}>{formatMoney(rule.amount)}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Portfolios" tone="surface">
        {snapshot.portfolios.map((portfolio) => (
          <View key={portfolio.id} style={styles.portfolioBlock}>
            <View style={styles.portfolioHeader}>
              <Text style={styles.listTitle}>{portfolio.name}</Text>
              <Text style={styles.portfolioKind}>{portfolio.kind}</Text>
            </View>
            <Text style={styles.portfolioMeta}>
              {portfolio.holdings.length} positions · cash {formatMoney(portfolio.availableCash)}
            </Text>
            {(() => {
              const firstIncomeStream = portfolio.passiveIncome[0];

              return (
                <Text style={styles.portfolioMeta}>
                  Passive income {firstIncomeStream ? formatMoney(firstIncomeStream.annualEstimate) : 'Not tracked yet'}
                </Text>
              );
            })()}
          </View>
        ))}
        <Text style={styles.metricLabel}>Projected annual passive income {snapshot.metrics.passiveIncomeAnnual}</Text>
        <Text style={styles.footnote}>Passive income is modeled from holdings so wealth and cash-flow reporting remain connected.</Text>
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
    gap: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  subtitle: {
    color: colors.mutedInk,
    fontSize: 16,
    lineHeight: 23,
  },
  metricRow: {
    gap: 12,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  cardTitle: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.mutedInk,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  listTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  listMeta: {
    color: colors.mutedInk,
    marginTop: 4,
  },
  listValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  portfolioBlock: {
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  portfolioKind: {
    color: colors.accent,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  portfolioMeta: {
    color: colors.mutedInk,
    fontSize: 15,
  },
  footnote: {
    color: colors.mutedInk,
    fontSize: 13,
    lineHeight: 19,
  },
});
