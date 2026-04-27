import { money } from '../money';
import type { RecurringRule, Transaction } from '../models';

describe('Finance domain models', () => {
  describe('Transaction structure', () => {
    it('creates an expense transaction', () => {
      const transaction: Transaction = {
        id: 'txn-001',
        portfolioId: 'portfolio-001',
        kind: 'expense',
        accountId: 'acc-001',
        categoryId: 'food',
        note: 'Groceries',
        occurredAt: '2026-04-26',
        originalAmount: money('EUR', -2500),
        baseAmount: money('EUR', -2500),
      };

      expect(transaction.kind).toBe('expense');
      expect(transaction.originalAmount.minorUnits).toBeLessThan(0);
    });

    it('creates an income transaction', () => {
      const transaction: Transaction = {
        id: 'txn-002',
        portfolioId: 'portfolio-001',
        kind: 'income',
        accountId: 'acc-001',
        categoryId: 'salary',
        note: 'Monthly salary',
        occurredAt: '2026-04-01',
        originalAmount: money('EUR', 250000),
        baseAmount: money('EUR', 250000),
      };

      expect(transaction.kind).toBe('income');
      expect(transaction.originalAmount.minorUnits).toBeGreaterThan(0);
    });

    it('creates a transfer with FX metadata', () => {
      const transfer: Transaction = {
        id: 'xfer-001',
        portfolioId: 'portfolio-001',
        kind: 'transfer',
        accountId: 'acc-eur',
        occurredAt: '2026-04-26',
        originalAmount: money('EUR', -50000),
        baseAmount: money('EUR', -50000),
        fxRate: {
          baseCurrency: 'EUR',
          quoteCurrency: 'USD',
          rate: 1.09,
          asOf: '2026-04-26',
        },
      };

      expect(transfer.fxRate).toBeDefined();
      expect(transfer.fxRate?.rate).toBe(1.09);
    });
  });

  describe('Recurring rule structure', () => {
    it('creates a monthly recurring rule', () => {
      const rule: RecurringRule = {
        id: 'rule-001',
        portfolioId: 'portfolio-001',
        label: 'Gym membership',
        frequency: 'monthly',
        nextOccurrenceAt: '2026-05-15',
        accountId: 'acc-001',
        categoryId: 'health',
        amount: money('EUR', -5000),
      };

      expect(rule.frequency).toBe('monthly');
      expect(rule.amount.minorUnits).toBeLessThan(0);
    });

    it('creates a quarterly recurring rule', () => {
      const rule: RecurringRule = {
        id: 'rule-002',
        portfolioId: 'portfolio-001',
        label: 'Quarterly property tax',
        frequency: 'quarterly',
        nextOccurrenceAt: '2026-07-01',
        accountId: 'acc-001',
        categoryId: 'taxes',
        amount: money('EUR', -45000),
      };

      expect(rule.frequency).toBe('quarterly');
    });
  });

  describe('Portfolio and holdings', () => {
    it('structures a portfolio with holdings', () => {
      const portfolio = {
        id: 'port-001',
        name: 'Growth Portfolio',
        kind: 'core' as const,
        baseCurrency: 'EUR' as const,
        availableCash: money('EUR', 50000),
        holdings: [
          {
            id: 'hold-001',
            assetId: 'vwra',
            quantity: 42.5,
            costBasis: money('EUR', 512340),
            marketValue: money('EUR', 566180),
          },
        ],
        passiveIncome: [
          {
            id: 'income-001',
            kind: 'dividend' as const,
            assetId: 'vwra',
            annualEstimate: money('EUR', 21450),
            lastPaidAt: '2026-03-28',
          },
        ],
      };

      expect(portfolio.holdings).toHaveLength(1);
      expect(portfolio.passiveIncome).toHaveLength(1);
      if (portfolio.passiveIncome[0]) {
        expect(portfolio.passiveIncome[0].kind).toBe('dividend');
      }
    });
  });
});
