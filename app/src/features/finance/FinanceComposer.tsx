import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { RecurrenceFrequency } from '../../domain/types';
import type { DashboardSnapshot } from '../../storage';
import { createCategory, createRecurringRule, createTransaction, createTransfer } from '../../storage';
import { colors } from '../../theme/colors';

const recurrenceOptions: RecurrenceFrequency[] = ['weekly', 'monthly', 'quarterly', 'yearly'];
const colorTokenOptions = ['cardA', 'cardB', 'cardC', 'accentSoft'] as const;

interface FinanceComposerProps {
  portfolioId: string;
  portfolioName: string;
  snapshot: DashboardSnapshot;
  onSaved: () => Promise<void>;
}

export function FinanceComposer(props: FinanceComposerProps) {
  const defaultAccountId = props.snapshot.accounts[0]?.id ?? '';
  const defaultCategoryId = props.snapshot.categories[0]?.id ?? '';
  const selectedAccount = props.snapshot.accounts.find((account) => account.id === defaultAccountId) ?? null;

  const [transactionKind, setTransactionKind] = useState<'expense' | 'income'>('expense');
  const [transactionAccountId, setTransactionAccountId] = useState(defaultAccountId);
  const [transactionCategoryId, setTransactionCategoryId] = useState(defaultCategoryId);
  const [transactionNote, setTransactionNote] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionBaseAmount, setTransactionBaseAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState('2026-04-26');

  const [ruleLabel, setRuleLabel] = useState('');
  const [ruleAmount, setRuleAmount] = useState('');
  const [ruleAccountId, setRuleAccountId] = useState(defaultAccountId);
  const [ruleCategoryId, setRuleCategoryId] = useState(defaultCategoryId);
  const [ruleFrequency, setRuleFrequency] = useState<RecurrenceFrequency>('monthly');
  const [ruleDate, setRuleDate] = useState('2026-05-01');

  const [categoryName, setCategoryName] = useState('');
  const [categoryColorToken, setCategoryColorToken] = useState<(typeof colorTokenOptions)[number]>('cardA');

  const [transferSourceId, setTransferSourceId] = useState(defaultAccountId);
  const [transferDestId, setTransferDestId] = useState(
    props.snapshot.accounts.length > 1 ? props.snapshot.accounts[1]?.id ?? defaultAccountId : defaultAccountId
  );
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState('2026-04-26');
  const [transferNote, setTransferNote] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const transactionAccount = useMemo(
    () => props.snapshot.accounts.find((account) => account.id === transactionAccountId) ?? selectedAccount,
    [props.snapshot.accounts, selectedAccount, transactionAccountId]
  );
  const ruleAccount = useMemo(
    () => props.snapshot.accounts.find((account) => account.id === ruleAccountId) ?? selectedAccount,
    [props.snapshot.accounts, selectedAccount, ruleAccountId]
  );

  async function handleCreateTransaction() {
    if (!transactionAccount) {
      setErrorMessage('Select an account before saving a transaction.');
      return;
    }

    const originalMinorUnits = parseMinorUnits(transactionAmount);
    const baseMinorUnits = transactionAccount.currency === props.snapshot.baseCurrency
      ? originalMinorUnits
      : parseMinorUnits(transactionBaseAmount);

    if (originalMinorUnits <= 0) {
      setErrorMessage('Enter a positive transaction amount.');
      return;
    }

    if (baseMinorUnits <= 0) {
      setErrorMessage('Enter a positive base-currency amount for cross-currency transactions.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setFeedback(null);

    try {
      await createTransaction({
        portfolioId: props.portfolioId,
        kind: transactionKind,
        accountId: transactionAccount.id,
        categoryId: transactionCategoryId || undefined,
        note: transactionNote,
        occurredAt: transactionDate,
        originalMinorUnits,
        baseMinorUnits,
      });
      await props.onSaved();
      setTransactionNote('');
      setTransactionAmount('');
      setTransactionBaseAmount('');
      setFeedback('Transaction saved to the local ledger.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save the transaction.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateRecurringRule() {
    if (!ruleAccount) {
      setErrorMessage('Select an account before saving a recurring rule.');
      return;
    }

    const minorUnits = parseMinorUnits(ruleAmount);
    if (minorUnits <= 0) {
      setErrorMessage('Enter a positive recurring amount.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setFeedback(null);

    try {
      await createRecurringRule({
        portfolioId: props.portfolioId,
        label: ruleLabel,
        frequency: ruleFrequency,
        nextOccurrenceAt: ruleDate,
        accountId: ruleAccount.id,
        categoryId: ruleCategoryId || undefined,
        minorUnits,
      });
      await props.onSaved();
      setRuleLabel('');
      setRuleAmount('');
      setFeedback('Recurring rule saved locally.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save the recurring rule.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateCategory() {
    setIsSaving(true);
    setErrorMessage(null);
    setFeedback(null);

    try {
      const category = await createCategory({
        name: categoryName,
        colorToken: categoryColorToken,
      });
      await props.onSaved();
      setCategoryName('');
      setTransactionCategoryId(category.id);
      setRuleCategoryId(category.id);
      setFeedback('Category created and ready for new entries.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create the category.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateTransfer() {
    const amountMinorUnits = parseMinorUnits(transferAmount);

    if (transferSourceId === transferDestId) {
      setErrorMessage('Source and destination accounts must be different.');
      return;
    }

    if (amountMinorUnits <= 0) {
      setErrorMessage('Enter a positive transfer amount.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setFeedback(null);

    try {
      await createTransfer({
        portfolioId: props.portfolioId,
        sourceAccountId: transferSourceId,
        destinationAccountId: transferDestId,
        amountInSourceCurrency: amountMinorUnits,
        occurredAt: transferDate,
        note: transferNote,
      });
      await props.onSaved();
      setTransferAmount('');
      setTransferNote('');
      setFeedback('Transfer recorded in the ledger.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create the transfer.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.header}>Add finance data</Text>
      <Text style={styles.subheader}>These forms save operations to {props.portfolioName} and refresh the portfolio after save.</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Transaction</Text>
        <SegmentedChoice
          label="Direction"
          options={[
            { label: 'Expense', value: 'expense' },
            { label: 'Income', value: 'income' },
          ]}
          selectedValue={transactionKind}
          onSelect={(value) => setTransactionKind(value as 'expense' | 'income')}
        />
        <SegmentedChoice
          label="Account"
          options={props.snapshot.accounts.map((account) => ({ label: `${account.name} · ${account.currency}`, value: account.id }))}
          selectedValue={transactionAccountId}
          onSelect={setTransactionAccountId}
        />
        <SegmentedChoice
          label="Category"
          options={props.snapshot.categories.map((category) => ({ label: category.name, value: category.id }))}
          selectedValue={transactionCategoryId}
          onSelect={setTransactionCategoryId}
        />
        <LabeledInput label="Note" value={transactionNote} onChangeText={setTransactionNote} placeholder="Groceries, bonus, rent..." />
        <LabeledInput
          label={`Amount${transactionAccount ? ` (${transactionAccount.currency})` : ''}`}
          value={transactionAmount}
          onChangeText={setTransactionAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        {transactionAccount && transactionAccount.currency !== props.snapshot.baseCurrency ? (
          <LabeledInput
            label={`Base amount (${props.snapshot.baseCurrency})`}
            value={transactionBaseAmount}
            onChangeText={setTransactionBaseAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        ) : null}
        <LabeledInput label="Date" value={transactionDate} onChangeText={setTransactionDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        <Pressable disabled={isSaving} onPress={() => void handleCreateTransaction()} style={styles.actionButton}>
          <Text style={styles.actionLabel}>{isSaving ? 'Saving...' : 'Save transaction'}</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Recurring rule</Text>
        <LabeledInput label="Label" value={ruleLabel} onChangeText={setRuleLabel} placeholder="Gym, rent, monthly transfer..." />
        <SegmentedChoice
          label="Frequency"
          options={recurrenceOptions.map((option) => ({ label: capitalize(option), value: option }))}
          selectedValue={ruleFrequency}
          onSelect={(value) => setRuleFrequency(value as RecurrenceFrequency)}
        />
        <SegmentedChoice
          label="Account"
          options={props.snapshot.accounts.map((account) => ({ label: `${account.name} · ${account.currency}`, value: account.id }))}
          selectedValue={ruleAccountId}
          onSelect={setRuleAccountId}
        />
        <SegmentedChoice
          label="Category"
          options={props.snapshot.categories.map((category) => ({ label: category.name, value: category.id }))}
          selectedValue={ruleCategoryId}
          onSelect={setRuleCategoryId}
        />
        <LabeledInput
          label={`Amount${ruleAccount ? ` (${ruleAccount.currency})` : ''}`}
          value={ruleAmount}
          onChangeText={setRuleAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <LabeledInput label="Next date" value={ruleDate} onChangeText={setRuleDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        <Pressable disabled={isSaving} onPress={() => void handleCreateRecurringRule()} style={styles.actionButtonSecondary}>
          <Text style={styles.actionLabel}>{isSaving ? 'Saving...' : 'Save recurring rule'}</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Category</Text>
        <LabeledInput label="Name" value={categoryName} onChangeText={setCategoryName} placeholder="Transport, taxes, side projects..." />
        <SegmentedChoice
          label="Color"
          options={colorTokenOptions.map((token) => ({ label: token, value: token }))}
          selectedValue={categoryColorToken}
          onSelect={(value) => setCategoryColorToken(value as (typeof colorTokenOptions)[number])}
        />
        <Pressable disabled={isSaving} onPress={() => void handleCreateCategory()} style={styles.actionButtonMuted}>
          <Text style={styles.actionLabel}>{isSaving ? 'Saving...' : 'Create category'}</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Transfer</Text>
        <SegmentedChoice
          label="From"
          options={props.snapshot.accounts.map((account) => ({ label: `${account.name} · ${account.currency}`, value: account.id }))}
          selectedValue={transferSourceId}
          onSelect={setTransferSourceId}
        />
        <SegmentedChoice
          label="To"
          options={props.snapshot.accounts
            .filter((a) => a.id !== transferSourceId)
            .map((account) => ({ label: `${account.name} · ${account.currency}`, value: account.id }))}
          selectedValue={transferDestId}
          onSelect={setTransferDestId}
        />
        <LabeledInput
          label="Amount"
          value={transferAmount}
          onChangeText={setTransferAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <LabeledInput label="Date" value={transferDate} onChangeText={setTransferDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        <LabeledInput label="Note (optional)" value={transferNote} onChangeText={setTransferNote} placeholder="To investing account..." />
        <Pressable disabled={isSaving} onPress={() => void handleCreateTransfer()} style={styles.actionButtonSecondary}>
          <Text style={styles.actionLabel}>{isSaving ? 'Transferring...' : 'Create transfer'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.mutedInk}
        style={styles.input}
        keyboardType={props.keyboardType ?? 'default'}
        autoCapitalize={props.autoCapitalize ?? 'sentences'}
      />
    </View>
  );
}

function SegmentedChoice(props: {
  label: string;
  options: Array<{ label: string; value: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <View style={styles.segmentWrap}>
        {props.options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => props.onSelect(option.value)}
            style={[styles.segment, option.value === props.selectedValue ? styles.segmentActive : null]}
          >
            <Text style={[styles.segmentText, option.value === props.selectedValue ? styles.segmentTextActive : null]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function parseMinorUnits(value: string): number {
  const normalized = value.trim().replace(',', '.');

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  header: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
  },
  subheader: {
    color: colors.mutedInk,
    fontSize: 15,
    lineHeight: 22,
  },
  panel: {
    gap: 14,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  panelTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  segmentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
  },
  segmentActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  segmentText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.surface,
  },
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: colors.cardB,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonMuted: {
    backgroundColor: colors.cardA,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
