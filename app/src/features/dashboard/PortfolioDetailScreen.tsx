import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { formatMoney } from '../../domain/money';
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
  const [isOperationsMenuOpen, setIsOperationsMenuOpen] = useState(false);

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

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={styles.title}>{portfolio.name}</Text>
            <Text style={styles.kind}>{portfolio.kind} portfolio</Text>
          </View>
          <Pressable
            onPress={() => setIsOperationsMenuOpen(true)}
            style={({ pressed }) => [styles.burgerButton, pressed && styles.menuTriggerPressed]}
          >
            <Text style={styles.burgerIcon}>≡</Text>
            <Text style={styles.burgerLabel}>Menu</Text>
          </Pressable>
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

      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isOperationsMenuOpen}
        onRequestClose={() => setIsOperationsMenuOpen(false)}
      >
        <Pressable style={styles.overlayBackdrop} onPress={() => setIsOperationsMenuOpen(false)}>
          <Pressable style={styles.overlayCard} onPress={() => null}>
            <Text style={styles.overlayTitle}>Portfolio actions</Text>
            <Text style={styles.overlaySubTitle}>Choose what you want to do next.</Text>

            <Pressable
              onPress={() => {
                setIsOperationsMenuOpen(false);
                navigation.navigate('PortfolioOperations', { portfolioId: portfolio.id, mode: 'create' });
              }}
              style={({ pressed }) => [styles.menuOption, pressed && styles.menuOptionPressed]}
            >
              <Text style={styles.menuOptionTitle}>Create</Text>
              <Text style={styles.menuOptionBody}>Add transactions, recurring rules, categories, and transfers.</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setIsOperationsMenuOpen(false);
                navigation.navigate('PortfolioOperations', { portfolioId: portfolio.id, mode: 'activity' });
              }}
              style={({ pressed }) => [styles.menuOption, pressed && styles.menuOptionPressed]}
            >
              <Text style={styles.menuOptionTitle}>Activity</Text>
              <Text style={styles.menuOptionBody}>Review recent transactions and recurring rules in one place.</Text>
            </Pressable>

            <Pressable onPress={() => setIsOperationsMenuOpen(false)} style={styles.closeOverlayButton}>
              <Text style={styles.closeOverlayLabel}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
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
  burgerButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  menuTriggerPressed: {
    opacity: 0.7,
  },
  burgerIcon: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
  },
  burgerLabel: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 26, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  overlayCard: {
    backgroundColor: colors.canvas,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 10,
  },
  overlayTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  overlaySubTitle: {
    color: colors.mutedInk,
    fontSize: 14,
    marginBottom: 4,
  },
  menuPanel: {
    gap: 10,
  },
  menuOption: {
    borderRadius: 12,
    backgroundColor: colors.cardC,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  menuOptionPressed: {
    opacity: 0.72,
  },
  menuOptionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  menuOptionBody: {
    color: colors.mutedInk,
    fontSize: 13,
    lineHeight: 18,
  },
  closeOverlayButton: {
    marginTop: 6,
    alignSelf: 'flex-end',
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeOverlayLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
});
