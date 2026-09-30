# UI/UX Overhaul Plan

Source: UI/UX audit, 2026-09-30 (UI UX Pro Max checklist + full read of `src/`).
Goal: remove AI/vibecoded tells, fix visible bugs and accessibility gaps, and
tighten the native iOS feel. No new dependencies are required by this plan.

The phases are ordered by dependency: each one builds on the one before it.
Phase 1 lays the foundation, Phase 2 updates the shell and shared components,
and Phase 3 works through each screen.

Each phase ends with `npm run build`, `npm run lint`, and a check on an iPhone
in the Light, Dark and Warm themes.

---

## Decisions (all recommendations accepted 2026-09-30)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Sheet animations: custom keyframes vs adding `tw-animate-css` | Custom keyframes in `globals.css` (~10 lines, no dependency) |
| D2 | Sheet drag handles: implement swipe-to-dismiss or remove the handle | Remove the handle; keep tap-outside, Escape and the close button |
| D3 | Deletes: keep the confirmation sheet, or delete immediately with an "Undo" toast | Undo toast for transactions and income; keep the confirmation for deleting categories |
| D4 | What the "Monthly pace" line measures against | Sum of budgets when any are set, otherwise income. Label the line either way. |
| D5 | Screen header style | Simple sticky title per screen (e.g. "Add expense", "Income", "Insights", "Settings"). No brand pill. |
| D6 | Haptics (`navigator.vibrate` does nothing on iOS) | Remove the calls |

---

## Phase 1: Foundation (tokens, globals, lib, docs) - done

The two items still unchecked below are rules written down in Phase 1. They get applied to each file as Phases 2–3 touch it.

Touches: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/manifest.ts`,
`src/hooks/useTheme.ts`, `src/lib/*` (plus new `src/lib/format.ts` and
`src/lib/dates.ts`), `README.md`.
Screens look nearly the same after this phase apart from font and contrast.
Later phases use what it adds.

### Typography
- [x] Remove `font-family: Arial, Helvetica` from `body` so Geist actually renders
- [x] Drop the unused `Geist_Mono` import and the `--font-mono` token
- [ ] Set a minimum text size: nothing below 12px (`text-xs`). Replace the 12 uses of `text-[10px]`/`text-[11px]` as each file is touched in Phases 2–3.

### Color tokens and contrast (WCAG AA 4.5:1 for text)
- [x] Darken `--fg-muted` in all three themes (currently 2.43 light, 3.04 dark, 2.63 warm)
- [x] Split green into a fill and a text token: add `--on-positive` (text on green buttons) and `--positive-fg` (green text on cards). The current `#10b981` with white measures 2.54.
- [x] Add a `--warning` / `--warning-tint` token pair to replace the hardcoded `#F59E0B` (2.15 on white)
- [x] Add a `--negative-fg` token that is readable as text on light surfaces (`#f87171` measures 2.77)
- [x] Add a `--pressed` token per theme for keypad and list-row press states (replaces `active:bg-gray-200/300`)
- [x] Warm theme: give it a warm `--brand` instead of emerald `#34d399`
- [x] Remove the chat remark `/* Warmed up your red just a touch */`
- [x] Map the new tokens in the `@theme inline` block

### Radius, shadow and motion scale
- [ ] Standardise on two radii (`rounded-xl` for controls, `rounded-2xl` for cards and sheets) and two shadows (`shadow-sm` for cards, `shadow-lg` for sheets and toasts). Write the rule as a short comment in `globals.css` and apply it as files are touched.
- [x] Add keyframes for sheet enter/exit and toast enter (D1)
- [x] Add a `prefers-reduced-motion` block that disables these animations
- [x] Remove the unused `.no-scrollbar` utility

### Viewport, PWA and theme color
- [x] Re-enable zoom: remove `maximumScale: 1` and `userScalable: false` in `layout.tsx`
- [x] Make `themeColor` follow the active theme: set it per `prefers-color-scheme` in viewport metadata, and update the `<meta name="theme-color">` tag in `useTheme` when the theme changes
- [x] Align the manifest `theme_color`/`background_color` with the app's launch surface
- [x] Add 192px and maskable icon entries to the manifest

### Shared lib utilities
- [x] `lib/format.ts`: `formatAUD(n)` using `Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })`, plus a compact variant for chart labels
- [x] `lib/dates.ts`: move `toLocalDateStr` (duplicated in Entry and Income) here and add `relativeDayLabel()` ("Today", "Yesterday", "3 Sep")
- [x] `lib/types.ts`: add `type Tab = "add" | "income" | "insights" | "settings"`
- [x] Delete the unused `CHART_COLORS` from `constants.ts`; move `INSIGHT_COLORS.warning` onto the new token

### Docs
- [x] Rewrite `README.md` in plain language:
  - [x] Drop the emoji headings and marketing lines ("premium", "Enterprise-Grade", "donut charts")
  - [x] Fix the broken code fences and the markdown link inside a code block
  - [x] Add the `income` table to the schema
  - [x] Remove the `yourusername` placeholder

---

## Phase 2: App shell and shared components

Touches: `MoneyballApp.tsx`, `TopHeader.tsx`, `BottomNav.tsx`, `Toast.tsx`,
`ConfirmDialog.tsx`, `CategoryPicker.tsx`, `hooks/useAppData.ts`,
`hooks/useToast.ts`. Adds new shared components: `Sheet`, `IconButton`,
`DateChip`, `TransactionRow`, `EmptyState`.
It also makes small, mechanical edits to each screen's `<main>` wrapper.

### Layout and safe areas
- [ ] Move the `max-w-md mx-auto` container into `MoneyballApp`. Remove `shadow-2xl`, `max-w-md` and `mx-auto` from every screen's `<main>`.
- [ ] Give the top safe-area inset a single owner, the header. Remove the extra `pt-[env(safe-area-inset-top)]` on the Income, Insights and Settings `<main>`s, and the `-mt-[env(...)]` hack in Entry.
- [ ] Toasts: position below the safe area instead of at a fixed `top-28`

### TopHeader to screen header (D5)
- [ ] Replace the floating "MONEYBALL" pill with a sticky screen title (`sticky top-0`, solid surface background, hairline border that appears once the page scrolls)
- [ ] Accept `title` and an optional `trailing` slot (Insights will put its month switcher here in Phase 3)

### BottomNav
- [ ] Type the tabs with `Tab`; rename the internal `"summary"` tab to `"insights"`
- [ ] Reduce the height to roughly 49pt plus the safe area (currently `pt-4` plus the inset plus `1rem`)
- [ ] Add `aria-current="page"` on the active tab
- [ ] Use 12px labels
- [ ] Rebuild the four buttons from one map instead of four copy-pasted blocks
- [ ] Reconsider the Home icon for "Entry" (e.g. `PlusCircle`)

### Sheet (new) used by every overlay
- [ ] `role="dialog"`, `aria-modal`, and `aria-labelledby` pointing at the title
- [ ] Focus moves into the sheet on open and returns to the triggering control on close; Escape closes it
- [ ] Lock page scrolling while open
- [ ] Use the Phase 1 keyframes for enter/exit (D1)
- [ ] Remove the drag handle (D2)
- [ ] Rebuild `ConfirmDialog`, `CategoryPicker`, the Entry "This Month" modal and the Insights drill-down on it

### Shared primitives (new)
- [ ] `IconButton`: at least a 44×44px hit area, with a required `label` prop that becomes `aria-label`. Use it for every icon-only button:
  - [ ] Trash and delete ×
  - [ ] Plus (add category)
  - [ ] Back chevron and close ×
  - [ ] Month arrows
- [ ] `DateChip`: the chip and hidden date input duplicated in Entry and Income
- [ ] `TransactionRow`: the row duplicated twice in EntryScreen. Uses `formatAUD`, `tabular-nums` and the `--pressed` state, and drops `hover:` classes (hover stays stuck after a tap on iOS).
- [ ] `EmptyState`: short, non-italic guidance text with an optional action, replacing the grey italic "No entries." messages

### Toast and undo (D3)
- [ ] Add `role="status"` / `aria-live="polite"`
- [ ] Replace the hardcoded `border-gray-700/50` with a token
- [ ] Extend `useToast` to accept an optional action (`{ label: "Undo", onAction }`) and keep the toast up longer when it has one
- [ ] Add a delete-with-undo helper: remove the row locally, show the undo toast, and commit the delete when the toast expires. Restore the row and show an error toast if the delete fails. This also fixes deletes currently failing silently.

### Data layer
- [ ] `useAppData`: show `loadingData` only on the first load, so later refetches don't flicker the pinned row to a spinner
- [ ] Add optimistic `add`/`update`/`remove` helpers so saves appear instantly; reconcile with a quiet background refetch
- [ ] Surface fetch errors through a toast instead of only `console.error`
- [ ] Remove all `navigator.vibrate` calls (D6)

---

## Phase 3: Screens

Touches one screen at a time, using the Phase 1–2 pieces. Each screen's
checklist also includes: `formatAUD` + `tabular-nums` on every amount,
12px minimum text, `IconButton`, `EmptyState`, and removing any AI-style
comments.

### EntryScreen
- [ ] Keypad presses use the `--pressed` token (the pressed state is currently invisible in dark mode at 1.18:1)
- [ ] Guard Save/Update against double taps: disable while saving and show a spinner
- [ ] Toast copy uses `formatAUD` ("Saved $12.50 · Coffee", not "$12.5")
- [ ] Make the note field a fixed, usable width instead of animating from `w-20` to `w-32`
- [ ] Show the selected category's short name (sub-label) in the chip, to match the pinned buttons
- [ ] Recent Activity: order by `created_at` so a just-saved backdated entry still appears, or show it briefly at the top
- [ ] "This Month" sheet:
  - [ ] Use `Sheet`
  - [ ] Use tokenized borders (the bare `border-b` currently draws in the text color)
  - [ ] Show the month total in the header
  - [ ] Add an empty state

### IncomeScreen
- [ ] Add Income button uses the green fill with `--on-positive` text; add visible disabled/loading styling
- [ ] Income amounts use `--positive-fg`
- [ ] Add an empty state for Income History (currently it shows nothing)
- [ ] Use `DateChip`, and undo-delete via `IconButton`

### InsightsScreen
- [ ] Remove the glow blobs and the dark navy cards in light mode. Summary cards become normal `surface-card` cards, with the green/red carried by the numbers only.
- [ ] Remove the `SECTION n:` / "Increased height…" / "Subtle glow" comments
- [ ] Fix the warning pill (green background with amber text); use `--warning` / `--warning-tint`
- [ ] Split the row interaction: the row (a real `<button>`) opens the drill-down; a separate chevron `IconButton` with `aria-expanded` expands sub-categories
- [ ] Pace chart (D4): measure against the budget total when set, otherwise income
  - [ ] Add a small legend or label for the dashed line
  - [ ] Don't show "Over pace" when there is no baseline
- [ ] Month switcher moves into the header `trailing` slot, with 44px arrows and aria-labels; disable moving past the current month
- [ ] Format budget limits and the chart dot label with `formatAUD`; use the compact form where space is tight
- [ ] Use a readable "Spent" bar color (not `fg-muted`, which reads as disabled); add a tooltip that also works on tap

### SettingsScreen
- [ ] Merge "Pinned Categories" and "Manage Categories & Budgets" into one list: each row shows the name, a pin toggle (`aria-pressed`), a budget input and delete
- [ ] At 4 pins, disable unpinned toggles and show why, instead of silently ignoring the tap
- [ ] `BudgetInput`:
  - [ ] Use `type="text" inputMode="decimal"`
  - [ ] Add a visible label per row for screen readers
  - [ ] Show a brief inline "Saved" confirmation when the field loses focus
- [ ] Theme switcher: `role="radiogroup"` / `aria-checked`; 12px labels
- [ ] Delete category keeps the confirmation sheet (D3), now built on `Sheet`

### LoginScreen
- [ ] Wrap the fields in a `<form>` so Enter submits
- [ ] Add visible `<label>`s, `autoComplete="email"` / `"current-password"`, and `type="email"` keyboard hints
- [ ] Show inline field errors instead of only a toast
- [ ] Make Sign In the clear primary action; make Create Account a quieter text button
- [ ] Remove the desktop-only `shadow-2xl` / `max-w-md` card chrome

### App launch
- [ ] Replace the 48px full-screen spinner in `page.tsx` with a surface-colored shell (header plus tab bar placeholders) so launch doesn't flash

---

## Verification per phase
- [ ] `npm run build` and `npm run lint` pass
- [ ] On an iPhone home-screen install, in Light, Dark and Warm:
  - [ ] No double gaps at the top; nothing hidden under the notch or home indicator
  - [ ] Every tap gives visible feedback; no stuck hover colors
- [ ] With VoiceOver on: every icon button announces a name; sheets trap focus and close with the close button
- [ ] With Reduce Motion on: sheets appear without sliding
- [ ] Amounts over $1,000 show separators everywhere
