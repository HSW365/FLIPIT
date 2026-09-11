# FLIPIT

FLIPIT is a browser-based real-estate deal workspace by HSW365 for buyers, sellers, wholesalers, and investors.

## Included in this build

- Deal analyzer with purchase price, ARV, repairs, holding/closing costs, desired profit, estimated margin, and maximum allowable offer
- Saved deal pipeline using browser storage
- Seller, buyer, investor, agent, and service-provider contact CRM
- Draft generator for letters of intent, purchase/assignment agreement templates, outreach, and due diligence
- Zillow handoff button using Zillow's public website; no scraping or unauthorized embedding
- Pricing display and Cash App reference: `$HSW365`
- Responsive interface with explicit production-integration boundaries

## Pricing

| Plan | Price |
|---|---:|
| Starter | $19 one-time |
| Investor | $49/month |
| Pro | $99/month |

## Production integrations still requiring credentials/provider setup

The static app is functional for local deal organization, calculations, contacts, and document drafts. A production SaaS deployment requires a secure backend and provider accounts for authentication, database persistence, Stripe Checkout/webhooks, authorized property-data/MLS access, county-record/title data, email/SMS delivery, and e-signature. Secrets must never be placed in frontend HTML.

## Run locally

Open `index.html` in a browser. For deployment, publish the repository through GitHub Pages or serve it from Render/static hosting.

## Legal notice

FLIPIT is not a broker, attorney, title company, lender, MLS provider, or appraisal service. Calculations and templates are informational and must be independently verified and reviewed by qualified professionals.
