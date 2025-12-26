# Development Plan: Stable Diffusion Prompt Builder

## Current Status

### ✅ Completed
- **Engine**: Fully implemented, tested, and working
- **Design System**: Global tokens, focus styles, consistent styling
- **Core UI Components**: PromptPreview, AttributeSelector, ModifierControls, NavigationButtons, ErrorDisplay, SelectionSummary, CategorySidebar
- **App Structure**: State management, engine wiring, layout
- **Entry Point**: main.tsx, index.html, Vite config
- **Data Loader**: Transformer created (needs real data)

### ⚠️ Incomplete
- **QuestionCard**: Not styled/implemented
- **Navigation State**: Handlers are empty TODOs
- **Real Data**: Still using demo data (3 attributes)
- **Category Map**: Not loaded/used
- **Custom Extensions**: Not visible in UI
- **Model Profile Selection**: Hardcoded

### ❌ Missing Features
- Interview/question flow (currently flat selection)
- Refinements/secondary questions
- Custom elements
- Reset/clear functionality
- Presets/templates
- Export options
- History/undo

---

## Phase 1: Complete Core UI (Priority: HIGH)

### Step 1.1: Style QuestionCard Component
**Status**: Not started  
**Files**: `src/ui/components/QuestionCard.tsx`, `src/ui/components/QuestionCard.css`

**Tasks**:
- Add semantic class names
- Style question text and description
- Integrate AttributeSelector, ModifierControls, NavigationButtons
- Add custom extension input fields
- Use design tokens only

**Estimated**: 1 step

---

### Step 1.2: Implement Custom Extension Inputs
**Status**: Not started  
**Files**: `src/ui/components/AttributeSelector.tsx`

**Tasks**:
- Add text input for each selected attribute
- Show input when attribute is selected
- Call `onCustomExtensionChange` on input
- Style using design tokens

**Estimated**: 1 step

---

### Step 1.3: Wire QuestionCard into App.tsx
**Status**: Not started  
**Files**: `src/ui/App.tsx`

**Tasks**:
- Replace AttributeSelector/ModifierControls with QuestionCard
- Pass question node data
- Connect all handlers

**Estimated**: 1 step

---

## Phase 2: Navigation & Flow (Priority: HIGH)

### Step 2.1: Implement Navigation State
**Status**: Not started  
**Files**: `src/ui/App.tsx`

**Tasks**:
- Add `currentNodeId` state
- Add `history` state (array of node IDs)
- Add `visitedNodes` Set
- Implement `handleNavigateBack`, `handleNavigateNext`, `handleNavigateSkip`
- Implement `handleJumpToCategory`

**Estimated**: 1 step

---

### Step 2.2: Load Category Map
**Status**: Not started  
**Files**: `src/data/loadCategoryMap.ts`, `src/ui/App.tsx`

**Tasks**:
- Create loader for category map from old project
- Or create simplified category structure
- Pass to CategorySidebar
- Wire navigation handlers

**Estimated**: 1 step

---

### Step 2.3: Implement Question/Node System
**Status**: Not started  
**Files**: `src/ui/App.tsx`, `src/types/interview.ts` (new)

**Tasks**:
- Define InterviewNode type
- Load question nodes from JSON (or create simple structure)
- Filter AttributeDefinitions by current node
- Show only relevant attributes per question

**Estimated**: 2-3 steps

---

## Phase 3: Real Data Integration (Priority: MEDIUM)

### Step 3.1: Migrate Real Attribute Data
**Status**: Partially done (loader exists)  
**Files**: `src/data/loadAttributeDefinitions.ts`

**Tasks**:
- Copy JSON files from `PCV1_final/src/data/interview/` to `src/data/interview/`
- Test transformer with real data
- Fix any inference issues (categories, priorities, conflicts)
- Generate flat `attributes.json` for performance

**Estimated**: 1-2 steps

---

### Step 3.2: Load Question/Node Data
**Status**: Not started  
**Files**: `src/data/loadInterviewNodes.ts` (new)

**Tasks**:
- Extract question nodes from old JSON
- Create simplified node structure
- Map nodes to attribute definitions
- Wire into App.tsx

**Estimated**: 2 steps

---

### Step 3.3: Load Category Map
**Status**: Not started  
**Files**: `src/data/loadCategoryMap.ts` (new)

**Tasks**:
- Import from `PCV1_final/src/data/categoryMap.ts`
- Or create simplified version
- Wire into App.tsx and CategorySidebar

**Estimated**: 1 step

---

## Phase 4: Enhanced Features (Priority: MEDIUM)

### Step 4.1: Model Profile Selection
**Status**: Not started  
**Files**: `src/ui/components/ModelProfileSelector.tsx` (new), `src/ui/App.tsx`

**Tasks**:
- Create ModelProfileSelector component
- Define multiple model profiles (SD 1.5, SDXL, etc.)
- Style using design tokens
- Wire into App.tsx

**Estimated**: 1-2 steps

---

### Step 4.2: Reset/Clear Functionality
**Status**: Not started  
**Files**: `src/ui/App.tsx`, `src/ui/components/PromptPreview.tsx`

**Tasks**:
- Add reset button to PromptPreview or App
- Clear all selections, modifiers, navigation
- Reset to initial state
- Style button using design tokens

**Estimated**: 1 step

---

### Step 4.3: Copy to Clipboard Enhancement
**Status**: Basic implementation exists  
**Files**: `src/ui/components/PromptPreview.tsx`

**Tasks**:
- Add visual feedback (toast/notification)
- Copy both positive and negative prompts
- Handle copy errors gracefully
- Style feedback using design tokens

**Estimated**: 1 step

---

## Phase 5: Advanced Features (Priority: LOW)

### Step 5.1: Presets/Templates
**Status**: Not started  
**Files**: `src/ui/components/PresetSelector.tsx` (new), `src/data/presets.json` (new)

**Tasks**:
- Define preset structure (name, selections, modifiers)
- Create PresetSelector component
- Load presets from JSON
- Apply preset to current state
- Style using design tokens

**Estimated**: 2-3 steps

---

### Step 5.2: History/Undo
**Status**: Not started  
**Files**: `src/ui/App.tsx`

**Tasks**:
- Add history stack for state changes
- Implement undo/redo handlers
- Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- Add UI controls (optional)

**Estimated**: 2-3 steps

---

### Step 5.3: Export Options
**Status**: Not started  
**Files**: `src/ui/components/ExportPanel.tsx` (new)

**Tasks**:
- Export as JSON
- Export as text file
- Export as image (with prompt overlay)
- Style using design tokens

**Estimated**: 2-3 steps

---

### Step 5.4: Custom Elements
**Status**: Not started  
**Files**: `src/ui/components/CustomElementsPanel.tsx` (new)

**Tasks**:
- Add custom text elements (positive/negative)
- Toggle enable/disable
- Integrate into prompt generation
- Style using design tokens

**Estimated**: 2 steps

---

## Phase 6: Polish & Optimization (Priority: LOW)

### Step 6.1: Performance Optimization
**Status**: Not started

**Tasks**:
- Memoize expensive computations
- Optimize re-renders
- Lazy load components if needed
- Debounce engine calls (optional)

**Estimated**: 1-2 steps

---

### Step 6.2: Accessibility
**Status**: Partially done (focus-visible styles)

**Tasks**:
- Add ARIA labels
- Keyboard navigation improvements
- Screen reader support
- Focus management

**Estimated**: 2 steps

---

### Step 6.3: Error Handling
**Status**: Basic (engine errors displayed)

**Tasks**:
- Better error messages
- Recovery suggestions
- Error logging (optional)
- User-friendly error states

**Estimated**: 1 step

---

### Step 6.4: Responsive Design
**Status**: Not started

**Tasks**:
- Mobile layout adjustments
- Tablet optimizations
- Breakpoint handling
- Touch interactions

**Estimated**: 2-3 steps

---

## Recommended Order

### Immediate Next Steps (Complete Core):
1. ✅ Style CategorySidebar (DONE)
2. **Style QuestionCard** ← NEXT
3. **Implement Custom Extension Inputs**
4. **Wire QuestionCard into App**
5. **Implement Navigation State**

### Then (Make It Functional):
6. **Load Real Data**
7. **Implement Question/Node System**
8. **Load Category Map**

### Finally (Enhance):
9. Model Profile Selection
10. Reset/Clear
11. Copy Enhancement
12. Presets (optional)
13. Other advanced features

---

## Critical Path

**Minimum Viable Product:**
1. QuestionCard styled and wired
2. Navigation state working
3. Real data loaded
4. Question flow functional

**Everything else is enhancement.**

---

## Notes

- **Design System**: Complete and ready to use
- **Engine**: Complete and tested
- **Foundation**: Solid, just needs completion
- **Data Migration**: Transformer ready, just needs files copied
- **Complexity**: Most remaining work is UI wiring, not logic

---

## Estimated Timeline

- **Phase 1** (Core UI): 3-4 steps
- **Phase 2** (Navigation): 3-4 steps  
- **Phase 3** (Data): 2-4 steps
- **Phase 4** (Features): 3-5 steps
- **Phase 5** (Advanced): 8-12 steps
- **Phase 6** (Polish): 6-8 steps

**Total**: ~25-37 steps for complete app

**MVP**: ~10-12 steps

