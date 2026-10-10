# MaTache — Product & Build Spec

## Mission
Build a production-ready, mobile-first application that transforms WhatsApp screenshots into structured client follow-up actions.

Core loop:
**Capture → AI analysis → action → reminder → done**

The app must answer one question first: **“What do I still need to do for my clients?”**

## MVP scope
Implement:
1. Authentication
2. Single/multi-image import
3. Android/PWA share target where technically viable
4. Multimodal AI analysis
5. Structured extraction
6. Client identification and duplicate detection
7. Automatic task creation
8. Dashboard
9. Task management
10. Client files and history
11. Reminders and notifications
12. Search
13. Manual correction
14. Sensitive-data protection

Do not add WhatsApp Business API, CRM marketing, Stripe, hotel/flight booking, accounting, full visa management, public chatbot, client portal, or ERP features.

## UX rule
Normal workflow must be:
**Screenshot → Share to MaTache → AI analysis → Verify → Validate**

Target: 2–3 interactions after import. Avoid mandatory forms.

## Stack
- Next.js + React + TypeScript + App Router
- Tailwind CSS
- Supabase: PostgreSQL, Auth, Storage, RLS, Edge Functions if needed
- Vercel-compatible deployment
- Zod for runtime validation
- libphonenumber for E.164 phone normalization
- Provider abstraction for multimodal AI
- PWA first, optimized for Android/Chrome

## Navigation
Bottom nav:
- Accueil
- Actions
- +
- Clients

Central + opens:
- camera
- image picker
- multiple images

## Action categories
Exactly:
- INVOICE
- CALLBACK
- OMRA_INFO
- TRIP_SUMMARY
- WAITING_CLIENT
- OTHER

## Status
Exactly:
- TODO
- WAITING
- DONE

Priority is separate:
- NORMAL
- TODAY
- URGENT

## AI role
Do not use AI as simple OCR. It must infer the next required action and who owns it.

Action owner:
- ACTION_USER
- ACTION_CLIENT
- ACTION_THIRD_PARTY

Extract when present:
- client name
- phone
- departure/arrival city
- start/end date
- travelers/adults/children
- room type
- nationality/passport type
- received/missing documents
- amount/currency/deposit/balance
- invoice/payment status
- client request
- next action
- urgency
- concise conversation summary

Never invent missing data. Use null for absent/uncertain values.

## AI output shape
```json
{
  "client": {
    "name": null,
    "phone": null,
    "phone_normalized": null
  },
  "request": {
    "category": "CALLBACK",
    "summary": "",
    "action_owner": "ACTION_USER"
  },
  "travel": {
    "departure_city": null,
    "arrival_city": null,
    "start_date": null,
    "end_date": null,
    "travelers_total": null,
    "adults": null,
    "children": null,
    "room_type": null
  },
  "documents": {
    "passport_type": null,
    "passport_received": null,
    "residence_permit_received": null,
    "ticket_received": null,
    "missing_documents": []
  },
  "financial": {
    "total_amount": null,
    "deposit_amount": null,
    "balance_amount": null,
    "currency": null,
    "invoice_status": null,
    "payment_status": null
  },
  "action": {
    "title": "",
    "description": "",
    "category": "CALLBACK",
    "status": "TODO",
    "priority": "TODAY",
    "due_at": null,
    "confidence": 0.0
  },
  "confidence": {
    "client": 0.0,
    "request": 0.0,
    "travel": 0.0,
    "documents": 0.0,
    "financial": 0.0,
    "action": 0.0
  }
}
```

## Core AI instruction
“You are a commercial follow-up assistant specialized in screenshot analysis. Understand the context, identify what the client wants, determine who must act next, and create the next useful action. Never invent data. Use only allowed categories/statuses and return data conforming to the required JSON schema.”

Chronology matters. If a screenshot says the invoice was already sent and later asks for a call, create CALLBACK, not INVOICE.

## Multi-image handling
Analyze multiple images as one dossier where appropriate. Detect:
- same client
- likely chronology
- new information
- contradictions

Prefer newer information but keep prior values in history when practical.

## Client matching
Normalize phone numbers to E.164. Same logical number in local/international formats must match the same client.

Do not merge automatically on name only.

## Validation screen
Show only useful detected data:
- client
- action
- category
- context
- priority
- low-confidence fields

Primary button: VALIDER
Secondary: Modifier / Ignorer

## Dashboard
Must answer “what do I need to do now?”

Show:
- actions today
- overdue
- invoices
- callbacks
- Omra requests
- summaries

Then list priority actions.

## Action screen
Show:
- client
- title
- description
- due date
- priority
- context
- source screenshot

Actions:
- TERMINÉ
- EN ATTENTE
- REPORTER
- MODIFIER

Snooze options:
+1 hour / Tonight / Tomorrow / 2 days / 3 days / 1 week / Custom

## Waiting client
WAITING actions must support reminder scheduling and simple follow-up flow:
- Relancer
- Documents reçus
- Reporter

## Client dossier
Sections:
- identity
- travel
- documents
- finances
- open actions
- timeline
- attachments

## Source traceability
Every AI-extracted fact should be traceable to its source attachment when possible.

## Database
Use:
- workspaces
- workspace_members
- profiles
- clients
- analyses
- attachments
- actions
- reminders
- extracted_fields
- action_events
- push_subscriptions

All business tables include workspace_id.

Create indexes for workspace_id, normalized phone, action status/due dates as appropriate.

## RLS
Mandatory.
A user can access only workspaces they belong to.
Never rely on frontend authorization alone.

## Storage
Private bucket: `matache-private`

Suggested path:
`workspace_id/clients/client_id/attachments/uuid.ext`

Use temporary signed URLs.

Never put passport numbers or sensitive document identifiers in URLs, logs, analytics, or notifications.

## PWA
Provide:
- manifest
- service worker
- icons
- favicon
- theme color
- standalone mode
- Android share target if viable
- gallery upload fallback

## Notifications
Implement architecture for Web Push.
No sensitive data in push content.

## Search
Search by:
- client name
- phone
- city
- date
- action text

Semantic search can wait.

## Failure handling
If AI fails, preserve uploaded images and allow manual creation with:
- Facture
- Rappeler
- Infos Omra
- Récapitulatif
- Attente client
- Autre

## Code quality
- TypeScript strict
- avoid `any`
- Zod validation
- modular services/repositories
- no important business logic inside presentational components
- secrets only through environment variables
- include `.env.example`

## Tests
At minimum:
Unit:
- phone normalization
- overdue calculation
- priority mapping
- AI result validation/mapping

Integration:
- client creation
- duplicate detection
- action creation
- TODO → WAITING
- TODO → DONE

## Seed data
Use fictitious clients only:
- Mme Benali
- M. Amrani
- Famille Haddad

## Acceptance tests
1. “Pouvez-vous m’envoyer la facture ?” → INVOICE / TODO
2. “C’est possible de vous appeler ?” → CALLBACK
3. “Nous voulons partir de Bruxelles du 13 au 23 octobre” → OMRA_INFO with parsed city/dates
4. “Je vous envoie mes passeports demain” → WAITING_CLIENT / WAITING
5. Existing normalized phone → no automatic duplicate client
6. Past-due TODO → appears overdue
7. DONE → removed from active list but retained in timeline
8. Extracted info → source screenshot accessible
9. AI unavailable → manual action creation still works

## Build order
1. Next.js + Supabase + auth + layout + design system
2. DB migrations + RLS + clients/actions/timeline
3. Dashboard + clients + actions
4. Private image upload
5. AI provider abstraction + structured multimodal extraction + Zod
6. Client matching + phone normalization + duplicate handling
7. AI validation screen
8. Reminders + snooze + overdue logic
9. PWA + Android share target
10. Web Push
11. Tests, security pass, README, deployment readiness

## Working method
Implement incrementally. After each phase:
1. implement
2. type-check
3. build
4. fix errors
5. test
6. continue

Do not suppress TypeScript or security errors just to make builds pass.

## Final principle
Before adding anything, ask:
**“Does this reduce the risk that a client is forgotten?”**
If not, it is probably outside the MVP.
