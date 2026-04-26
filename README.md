# Finance Super App

A local-first mobile finance app focused on centralizing personal finance before layering AI analysis.

## Current implementation
- Expo + React Native TypeScript app scaffold
- Core domain models for money, accounts, categories, transactions, recurring costs, subscriptions, portfolios, holdings, and passive income
- SQLite-backed local storage schema, seed routine, and repository layer
- Dashboard backed by the local repository with loading and retry states
- Local write flows for transactions, recurring rules, categories, and inter-account transfers
- Product and data-model documentation for phase 1

## Next build targets
1. Add transaction editing and deletion flows
2. Add CSV import preview and validation
3. Expand into portfolio and passive-income entry flows
4. Add tests around money math, repository mapping, and recurring logic
