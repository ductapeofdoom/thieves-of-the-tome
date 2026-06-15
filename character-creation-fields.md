# Thieves of the Tome — Character Creation Fields

Parsed from **Chapter 2: Tomecraft** (Spell Library phase) and **Chapter 3: The Thieves**
(Character Creation phase) of *Thieves of the Tome Core Rules v1.0*.

A character ("thief") is built in two layers:

1. **The Spellsheet** (Chapter 2) — written for the book the player *brought*. It is handed to
   the GM and later belongs to whoever *steals* that book. Each thief therefore plays with a
   spellsheet authored by another player and does **not** know its effects.
2. **The Thief** (Chapter 3) — built from a *different* Tome stolen off the table.

---

## 1. Spellsheet fields (Chapter 2 — Tomecraft)

One spellsheet per Tome. Created in secret during the Spell Library phase.

| Field | Type | Rules / Source |
|-------|------|----------------|
| `tomeTitle` | string | Title of the book this spellsheet is for (written at top of sheet). |
| `spells` | list (min 6) | The first 6 valid chapters become spells. Skip foreword/intro/TOC sections. May write more; bookmark the last spell so others know how many the Tome holds. |

Each entry in `spells`:

| Field | Type | Rules / Source |
|-------|------|----------------|
| `name` | string | The chapter title — or, if the chapter is untitled, the first sentence of that chapter. |
| `choice` | string | A prompt that **must start with "Choose…"**. Names what the caster picks (person, place, thing, or abstract; singular or plural; broad or narrow). |
| `effect` | string | 1–2 sentences describing what the spell does, inspired by the name. Kept secret from the player who will wield this Tome. |
| `starred` | boolean | Default `false`. Set `true` once cast; a starred spell can't be cast again without incurring doom. |

---

## 2. Thief fields (Chapter 3 — The Thieves)

| # | Field | Type | Required | Rules / Source |
|---|-------|------|----------|----------------|
| 1 | `stolenTome` | string | yes | Title of the book stolen from the center of the table — **must differ** from the one the player wrote spells for. This is the active Tome the thief casts from. |
| 2 | `name` | string | yes | The **author** of the stolen Tome. Nicknames / modifications allowed. |
| 3 | `adjectives` | list of 3 strings | yes | 3 mostly-positive descriptive phrases/adjectives taken from the first two pages of the stolen Tome. Each grants **+1 bonus die** on relevant actions/reactions. Wording may be adapted. |
| 4 | `inventory` | list of up to 3 strings | no | Up to 3 inanimate, backpack-sized objects found in the first two pages. No inherent bonus; situationally useful. Fewer than 3 is fine. |
| 5 | `destinies` | list of 3 destiny objects | full game only | One per random page (beginning / middle / end). Drives the thief's goals. Omitted in a "lite" game. |
| 6 | `dooms` | list of 3 strings | full game only | One negative descriptor per random page (beginning / middle / end) — a harm or misfortune (e.g. "broken leg", "sunken eyes"). Omitted in a "lite" game. |
| 7 | `heistNarration` | string | yes | Free-text describing the thief's role in stealing the Tomes (improv, "yes, and…", no rolls). |
| 7 | `specialty` | string | yes | One word/phrase summarizing the thief's role in the crew, chosen after heist narration (e.g. "The Pilot", "The Muscle", "The Face"). Need not come from the Tome. Grants bonus dice on acting/reacting. |

### Destiny object (field 5)

| Field | Type | Rules / Source |
|-------|------|----------------|
| `condition` | string | The **"When I ___"** trigger — a pivotal moment/goal achievable in play. |
| `descriptor` | string | The **"I will become ___"** result — an adjective usable for bonus dice once triggered. |
| `starred` | boolean | Default `false`. Permanently starred when the condition is triggered in play; only then does it grant bonus dice. |

Full destiny reads: *"When I `<condition>`, I will become `<descriptor>`."*

### Doom object (field 6)

| Field | Type | Rules / Source |
|-------|------|----------------|
| `text` | string | The negative descriptor. |
| `starred` | boolean | Default `false`. Starred when the thief fails a reaction; once starred, subtracts hazard dice. |

---

## 3. Derived / play-state tracking

These aren't entered at creation but are tracked on the sheet from creation onward.

| Field | Type | Rule |
|-------|------|------|
| `starredDestinyCount` | int | At least **1** must be starred for the thief to escape the White Guard. |
| `starredDoomCount` | int | At **4** starred dooms, the thief meets their doom (dies / goes mad / removed from game). |
| `gameMode` | enum `lite` \| `full` | `lite` skips destinies and dooms (steps 5–6); jump from inventory straight to the heist. |

---

## Character creation step order (Chapter 3 summary)

1. **Steal a Tome** — pick a book other than your own from the pile → `stolenTome`
2. **The Name** — author of that book → `name`
3. **Adjectives** — 3 from first pages → `adjectives`
4. **Inventory** — up to 3 backpack items → `inventory`  *(lite game stops here, skip to 7)*
5. **Destiny** — 3 "When I…, I will become…" → `destinies`
6. **Doom** — 3 negative descriptors → `dooms`
7. **The Heist & Specialty** — narrate the heist → `heistNarration`, then pick `specialty`
