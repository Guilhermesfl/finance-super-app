# Finance Super App Phase 1 Product Spec

## Goal
Phase 1 centralizes the user's finance life in one mobile app: daily spending, categorized costs, fixed costs, subscriptions, investment cash separation, multiple portfolios, consolidated reporting, and passive income tracking. AI-driven analysis is explicitly out of scope until the finance foundation is trustworthy.

## Release split

### Phase 1.0
- Manual account and wallet setup
- Categorized expense and income tracking
- Recurring fixed costs and subscription management
- Transfers between daily-finance accounts and investment accounts
- CSV import with preview and validation
- Multi-currency ledger support
- Consolidated personal-finance dashboard

### Phase 1.1
- Multiple investment portfolios
- Trade and holding entry for stocks, ETFs, mutual funds, bonds, crypto, and cash reserves
- Passive-income entry for dividends, interest, and coupons
- Consolidated wealth dashboard across portfolios
- Basic allocation and performance views

## Scope guardrails
- No AI analysis in phase 1
- No bank or broker API integrations in phase 1
- No multi-user collaboration in phase 1
- No mandatory sign-in or cloud sync in phase 1
- No live market data requirement in the first implementation slice

## Product principles
- One underlying financial ledger, even when users move money into portfolios
- Preserve original-currency data and conversion context for reporting
- Optimize trust before automation: imports previewed, recurring logic predictable, and calculations deterministic
- Keep the app local-first while leaving room for sync later
