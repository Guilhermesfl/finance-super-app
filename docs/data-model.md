# Phase 1 Data Model

## Core entities
- MoneyAmount: integer minor units plus currency code
- FxRate: reporting conversion metadata with timestamp
- Category: user-defined spending or income grouping
- Account: daily-finance container such as checking, savings, brokerage cash, or crypto wallet
- Transaction: immutable ledger row for expense, income, transfer, trade, fee, dividend, or interest
- RecurringRule: template that generates expected finance events over time
- Subscription: recurring commitment with merchant-style semantics
- Portfolio: investment container with its own base currency, cash, holdings, and passive-income streams
- Asset: security, fund, bond, crypto, or cash instrument reference
- Holding: quantity and valuation state for one asset within one portfolio
- PassiveIncomeStream: expected or observed dividends, coupons, interest, or similar income linked to holdings

## Invariants
- All stored money amounts are integers in minor units
- Original currency is immutable on transactions
- Base-currency reporting is derived from original amounts and FX metadata
- Transfers and portfolio cash allocations must reconcile with source accounts
- Holdings and passive income are portfolio-linked, not free-floating records

## Early implementation notes
- Keep stable IDs and timestamps on all entities now to ease sync later
- Prefer immutable transaction rows over mutable balance snapshots
- Add SQLite migrations from the first schema revision rather than delaying migration strategy
- Treat CSV import as a staged process: parse, validate, preview, commit
- Current implementation seeds a normalized local SQLite schema for categories, accounts, recurring rules, subscriptions, transactions, assets, portfolios, holdings, and passive-income streams
- The dashboard reads through a repository boundary so future sync or richer reporting can reuse the same persistence layer
