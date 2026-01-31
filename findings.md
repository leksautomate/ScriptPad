# Multi-Agent Design Review: Strategy Board

## Phase 1: Primary Designer Proposal
**Proposal**: "Title & Thumbnail Strategy Board"
- **Feature**: A dedicated view to brainstorm 10 title variations and draft a thumbnail concept.
- **UI**: A list of 10 numbered input fields for titles. A large text area for "Thumbnail Description".
- **Data**: Stored in `activeTab.strategy { titles: [], thumbnail: '' }`.
- **Why**: YouTube best practices dictate brainstorming multiple titles (10+) before filming to ensure the video is clickable.

## Phase 2: Structured Review

### 🧐 Skeptic / Challenger
**Critique**:
1.  **Redundancy**: Why not just use the new "Description" field? It's just text.
2.  **Over-engineering**: Does a list of 10 specific inputs really help? What if I want 20? What if I only have 3? Fixed inputs feel restrictive.
3.  **Failure Mode**: Users might ignore it if it's hidden behind another clicked toggle.

### 🛡️ Constraint Guardian
**Critique**:
1.  **Data Size**: `localStorage` (5MB limit) is fine for text. 10 titles + 1 paragraph is negligible.
2.  **State Complexity**: Adding a 3rd `viewMode` ('script', 'description', 'strategy') increases complexity in `App.jsx`. We need a cleaner switch (Dropdown? Segmented Control?).
3.  **Performance**: No concern. Text inputs are cheap.

### 🫂 User Advocate
**Critique**:
1.  **Context Switching**: If I'm brainstorming titles, I need to see my script/content. Hiding the script to see the titles is bad. Split screen?
2.  **Flow**: "Strategy" usually comes *before* scripting. It should be easily accessible from the start.
3.  **Visibility**: The toggle `[ Script | Desc ]` is already getting full. Adding `Strategy` makes it crowded on mobile.

## Phase 3: Arbitration & Integration

**Arbiter Decisions**:
1.  **On Redundancy**: Rejected. Dedicated fields force a specific workflow (The "Rule of 10" titles). A blank text box doesn't encourage this habit.
2.  **On Accessibility**: **Modification Required**. Instead of a full-screen view hide/seek, the Strategy Board should ideally overlay or be quickly togglable. However, given mobile constraints, a defined View Mode is safer than a complex split-screen for now.
3.  **On UI Inputs**: **Modification Required**. Instead of 10 fixed inputs (which is rigid), use a **single textarea** with line numbers auto-generated, or a dynamic list.
    *   *Decision*: Let's stick to 10 fixed inputs for V1 to enforce the constraint/habit, but allow empty ones.
4.  **On Navigation**: The toggle `[ SCRIPT | DESC | STRAT ]` text is too long.
    *   *Decision*: Use Icons or shortened text in the Segmented Control.

## Final Design Lock 🔒
- **View**: 'script' | 'desc' | 'idea' (short for Strategy/Ideation).
- **UI**:
    - **Title Section**: "Brainstorm 10 Titles". 10 Input fields.
    - **Thumbnail Section**: "Thumbnail Concept". Textarea.
- **Navigation**: Update Header Toggle to 3 segments.

## Decision Log
- **ACCEPTED**: Dedicated view (not just text field) to enforce "10 Title" workflow.
- **ACCEPTED**: 3-State Toggle in Header.
- **REJECTED**: Split-screen (too complex for V1/Mobile).
