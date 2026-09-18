# FLIPIT

FLIPIT is a browser-based real-estate deal workspace by HSW365 for buyers, sellers, wholesalers, and investors.

## Current capabilities

- Deal analyzer with purchase price, ARV, repairs, holding/closing costs, desired profit, rent, operating expenses, financing inputs, projected margin, maximum allowable offer, monthly cash flow and cash-on-cash calculation
- Full underwriting checklist for title, liens, permits, comps, repairs, financing, occupancy and local transaction rules
- Saved deal pipeline using browser storage
- FLIPIT Copilot interface with local workspace-aware answers and a clear production AI API boundary
- Cash-buyer / investor CRM with budget, strategy and target-area fields
- Buyer matching against saved deals using budget, strategy and area signals
- Contract/document workspace with purchase agreement, assignment agreement, LOI, buyer offer summary, outreach, due-diligence and deal-structure drafts
- Deal-structure workflow and contract-rights/assignment workflow UI
- Standalone deal calculator for project cost, estimated profit, maximum offer and assignment spread
- Zillow outbound search handoff using Zillow's public website; no scraping or unauthorized embedding
- Pricing display: Starter $19 one-time, Investor $49/month, Pro $99/month
- Cash App reference: $HSW365
- Responsive interface with explicit production-integration boundaries

## Data and production boundaries

This GitHub build is intentionally frontend-first and stores workspace data in the browser's localStorage. Production features such as live MLS/property feeds, county/title records, authenticated accounts, shared database persistence, Stripe Checkout/webhooks, AI model APIs, email/SMS delivery, e-signature, buyer notifications and secure contract execution require a backend and provider credentials.

Never place API keys, payment secrets, MLS credentials, AI keys or other secrets in frontend HTML/JavaScript.

## Run locally

Open `index.html` in a browser. For deployment, publish the repository through GitHub Pages or serve it from Render/static hosting.

## Legal notice

FLIPIT is not a broker, attorney, title company, lender, MLS provider, or appraisal service. Calculations, buyer matches and templates are informational and must be independently verified and reviewed by qualified professionals.
