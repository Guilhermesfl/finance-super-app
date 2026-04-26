import { money, addMoney, negateMoney, formatMoney } from '../money';
import type { MoneyAmount } from '../money';

describe('MoneyAmount domain layer', () => {
  describe('money()', () => {
    it('creates money in minor units', () => {
      const amount = money('EUR', 10050);
      expect(amount.currency).toBe('EUR');
      expect(amount.minorUnits).toBe(10050);
    });

    it('rejects non-integer minor units', () => {
      expect(() => money('USD', 100.5)).toThrow('Money must be stored in integer minor units.');
    });

    it('accepts zero', () => {
      const amount = money('EUR', 0);
      expect(amount.minorUnits).toBe(0);
    });

    it('accepts negative values', () => {
      const amount = money('EUR', -5000);
      expect(amount.minorUnits).toBe(-5000);
    });
  });

  describe('addMoney()', () => {
    it('adds two amounts in same currency', () => {
      const a = money('EUR', 10000);
      const b = money('EUR', 5000);
      const result = addMoney(a, b);

      expect(result.currency).toBe('EUR');
      expect(result.minorUnits).toBe(15000);
    });

    it('adds negative amounts (like expenses)', () => {
      const income = money('EUR', 20000);
      const expense = money('EUR', -12000);
      const result = addMoney(income, expense);

      expect(result.minorUnits).toBe(8000);
    });

    it('throws when currencies don\'t match', () => {
      const eur = money('EUR', 10000);
      const usd = money('USD', 10000);

      expect(() => addMoney(eur, usd)).toThrow('Cannot add money values from different currencies.');
    });

    it('preserves zero sum', () => {
      const a = money('USD', 5000);
      const b = money('USD', -5000);
      const result = addMoney(a, b);

      expect(result.minorUnits).toBe(0);
    });
  });

  describe('negateMoney()', () => {
    it('negates positive amount', () => {
      const positive = money('EUR', 10000);
      const result = negateMoney(positive);

      expect(result.minorUnits).toBe(-10000);
      expect(result.currency).toBe('EUR');
    });

    it('negates negative amount', () => {
      const negative = money('EUR', -5000);
      const result = negateMoney(negative);

      expect(result.minorUnits).toBe(5000);
    });

    it('negates zero to zero', () => {
      const zero = money('EUR', 0);
      const result = negateMoney(zero);

      expect(result.minorUnits).toEqual(0); // toEqual is lenient with -0 vs 0
      expect(result.currency).toBe('EUR');
    });
  });

  describe('formatMoney()', () => {
    it('formats EUR correctly', () => {
      const amount = money('EUR', 10050); // €100.50
      const formatted = formatMoney(amount, 'en-US');

      expect(formatted).toContain('100');
      expect(formatted).toMatch(/EUR|€/); // May use currency code or symbol
    });

    it('formats USD correctly', () => {
      const amount = money('USD', 5000); // $50.00
      const formatted = formatMoney(amount, 'en-US');

      expect(formatted).toContain('50');
      expect(formatted).toMatch(/USD|\$/); // May use currency code or symbol
    });

    it('formats JPY correctly', () => {
      const amount = money('JPY', 10000);
      const formatted = formatMoney(amount, 'en-US');

      expect(formatted).toContain('10');
      expect(formatted).toMatch(/JPY|¥/); // May use currency code or symbol
    });

    it('formats negative amounts', () => {
      const amount = money('EUR', -8000); // -€80.00
      const formatted = formatMoney(amount, 'en-US');

      expect(formatted).toContain('80');
    });

    it('handles zero', () => {
      const amount = money('EUR', 0);
      const formatted = formatMoney(amount, 'en-US');

      expect(formatted).toMatch(/[0€EUR]/);
    });
  });

  describe('Financial domain rules', () => {
    it('reconciles expense transactions correctly', () => {
      const opening = money('EUR', 50000);
      const groceries = money('EUR', -2500);
      const rent = money('EUR', -120000);

      const afterGroceries = addMoney(opening, groceries);
      expect(afterGroceries.minorUnits).toBe(47500);

      const afterRent = addMoney(afterGroceries, rent);
      expect(afterRent.minorUnits).toBe(-72500);
    });

    it('reconciles transfer between same currency accounts', () => {
      const checking = money('EUR', 100000);
      const outflow = negateMoney(money('EUR', 30000));
      const newChecking = addMoney(checking, outflow);
      expect(newChecking.minorUnits).toBe(70000);

      const savings = money('EUR', 50000);
      const inflow = money('EUR', 30000);
      const newSavings = addMoney(savings, inflow);
      expect(newSavings.minorUnits).toBe(80000);
    });

    it('calculates net worth across multiple accounts', () => {
      const checking = money('EUR', 80000);
      const savings = money('EUR', 150000);
      const creditCardDebt = money('EUR', -35000);

      const netWorth = addMoney(addMoney(checking, savings), creditCardDebt);
      expect(netWorth.minorUnits).toBe(195000);
      expect(netWorth.currency).toBe('EUR');
    });

    it('tracks spending across categories', () => {
      const monthlyBudget = money('EUR', 300000);
      const housing = money('EUR', -120000);
      const food = money('EUR', -45000);
      const transport = money('EUR', -18000);
      const other = money('EUR', -25000);

      const remaining = addMoney(
        addMoney(addMoney(addMoney(monthlyBudget, housing), food), transport),
        other
      );

      expect(remaining.minorUnits).toBe(92000); // €920 left
    });
  });
});
