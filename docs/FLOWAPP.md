# unifind — FlowApp Kanban Board

Project management for the unifind web→mobile migration lives on **MultiMagics FlowApp**.
It mirrors the local [`SPRINT_BOARD.md`](SPRINT_BOARD.md) (one card per task) so the flow
is trackable visually. As agents work, they move the matching card across the columns.

## Board

| Field | Value |
|---|---|
| **Project ID** | **6** |
| **Project name** | unifind |
| **Platform** | www.multimagics.com |
| **Board URL** | www.multimagics.com (open FlowApp → unifind) |

## Sprints

| ID | Sprint | Status | Goal |
|---|---|---|---|
| 8  | Foundation        | **active** | Shared infra: scaffold · i18n · api · auth · nav · universal-list · filters · compare/fav · shared cards |
| 9  | Discovery         | planning | Home + find programs/institutions/offerings + program explorer |
| 10 | Detail Pages      | planning | Institution / program / offering detail |
| 11 | Booking & Payment | planning | Offering checkout + payment status |
| 12 | Profile           | planning | Profile shell + all sub-tabs + booking detail |
| 13 | Compare & Static  | planning | Compare + footer/newsletter/contact + terms + 404 |

## Columns

| ID | Column | Meaning |
|---|---|---|
| 32 | Backlog | Not started |
| 33 | To Do | Ready to pick up (foundation, unblocked) |
| 34 | In Progress | Being worked on |
| 35 | Stuck | Blocked |
| 36 | Review | In code/parity/design review |
| 37 | Done | Shipped (parity PASS) |

## Cards on the board

Card titles match the task ids / slugs in `SPRINT_BOARD.md` + `MIGRATION_QUEUE.md`.

| Card | Sprint | Column |
|---|---|---|
| TASK-S001 app-scaffold | Foundation | Done |
| TASK-S002 i18n-setup | Foundation | Done |
| TASK-S003 api-layer | Foundation | Done |
| TASK-S004 navigation-shell | Foundation | Done |
| TASK-S005 reference-data | Foundation | To Do |
| TASK-S006 auth-login | Foundation | To Do |
| TASK-S007 upload-service | Foundation | Backlog |
| TASK-S008 universal-list | Foundation | To Do |
| TASK-S009 filter-system | Foundation | Backlog |
| TASK-S010 compare-favorites-infra | Foundation | To Do |
| TASK-S011 shared-cards | Foundation | To Do |
| TASK-F001 home | Discovery | **Done** |
| find-programs | Discovery | Backlog |
| find-institutions | Discovery | Backlog |
| find-offerings | Discovery | Backlog |
| program-explorer | Discovery | Backlog |
| institution-detail | Detail Pages | Backlog |
| program-detail | Detail Pages | Backlog |
| offering-detail | Detail Pages | Backlog |
| offering-checkout | Booking & Payment | Backlog |
| payment-status | Booking & Payment | Backlog |
| profile-shell | Profile | Backlog |
| profile-information | Profile | Backlog |
| account-credentials | Profile | Backlog |
| about-profile | Profile | Backlog |
| profile-activity | Profile | Backlog |
| profile-notifications | Profile | Backlog |
| profile-favorites | Profile | Backlog |
| profile-comparisons | Profile | Backlog |
| profile-bookings | Profile | Backlog |
| booking-detail | Profile | Backlog |
| compare | Compare & Static | Backlog |
| footer-newsletter-contact | Compare & Static | Backlog |
| terms-conditions | Compare & Static | Backlog |
| not-found | Compare & Static | Backlog |

## Rules for agents (keep the board in sync with reality)

- When you **start** a task → move its card to **In Progress** (col 34).
- When it goes to **review** → move to **Review** (col 36).
- When it **PASSES** (parity + code + design) → move to **Done** (col 37), and tick it in `SPRINT_BOARD.md` + `MIGRATION_QUEUE.md`.
- When **blocked** → move to **Stuck** (col 35) and add a comment explaining why.
- The board is a **mirror** of `SPRINT_BOARD.md` — never let them diverge. `SPRINT_BOARD.md` stays the source of truth the software-house executes; FlowApp is the human-visible flow.
- Find a card's id by reading the board and matching its title (cards are created with the exact task id/slug as the title).

## API (for agents)

Store the key as **`FLOWAPP_API_KEY`** in your environment (it already lives in `~/.bashrc`). Never hardcode it.

```bash
KEY="$FLOWAPP_API_KEY"
BASE="https://www.multimagics.com/api/v1/flow_app/projects/6"

# Find a card id by title
curl -s -H "X-API-Key: $KEY" "$BASE/board" \
  | python3 -c 'import sys,json;[print(c["id"],c["title"]) for c in json.load(sys.stdin).get("cards",[])]'

# Move a card → In Progress (34) / Review (36) / Done (37) / Stuck (35)
curl -s -X PUT "$BASE/cards/<card_id>/move" -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" -d '{"card":{"flow_app_column_id":34}}'

# Add a comment (e.g. why Stuck, or the review verdict)
curl -s -X POST "$BASE/cards/<card_id>/comments" -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" -d '{"comment":{"content":"your note"}}'

# Add a NEW card (when the product-owner grooms a new task)
curl -s -X POST "$BASE/cards" -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"card":{"title":"<slug>","description":"<scope>","flow_app_column_id":32,"flow_app_sprint_id":9}}'
```
