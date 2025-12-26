# DIAGNOSTIC REPORT - Category Visibility Issue

## STEP 1 — DATA VERIFICATION

### FINAL AttributeDefinition[] Location
**File:** `src/ui/App.tsx`  
**Lines:** 131-142

```typescript
const [attributeDefinitions] = useState<AttributeDefinition[]>(() => {
  try {
    const loaded = loadAttributeDefinitions();
    const result = loaded.length > 0 ? loaded : demoAttributeDefinitions;
    console.log(`[App] Loaded ${result.length} attribute definitions`);
    return result;
  } catch (error) {
    console.error('Failed to load attribute definitions:', error);
    return demoAttributeDefinitions;
  }
});
```

### Data Source Analysis

**Demo Data (Lines 57-90):**
- **Total AttributeDefinitions:** 4
- **Categories:** 
  - `subject`: 2 attributes
  - `style`: 2 attributes

**Migration Data (via `loadAttributeDefinitions()`):**
- **Expected:** ~965+ attributes
- **Expected Categories:** `subject`, `attribute`, `style`, `effect`, `composition`, `quality`

### To Determine Actual Data in Use:

**Check Browser Console For:**
1. `[App] Loaded X attribute definitions` - What is X?
   - If X = 4 → Using demo data (migration failed/returned empty)
   - If X > 4 → Using migrated data

2. `[Migration]` prefixed logs:
   - `[Migration] FOUND X OLD DATA FILES` - Are files being found?
   - `[Migration] Created X attribute definitions` - How many migrated?
   - `[Migration] Category breakdown:` - What categories exist?

**Run This in Browser Console:**
```javascript
// Add this temporarily to App.tsx or use React DevTools
const categories = [...new Set(attributeDefinitions.map(a => a.category))];
console.log('=== ACTUAL DATA DIAGNOSTIC ===');
console.log('Total attributes:', attributeDefinitions.length);
console.log('Distinct categories:', categories);
categories.forEach(cat => {
  const count = attributeDefinitions.filter(a => a.category === cat).length;
  console.log(`  ${cat}: ${count} attributes`);
});
```

---

## STEP 2 — WIRING VERIFICATION

### Data Import Chain

1. **App.tsx Line 20:**
   ```typescript
   import { loadAttributeDefinitions } from '../data/loadAttributeDefinitions';
   ```

2. **App.tsx Line 133:**
   ```typescript
   const loaded = loadAttributeDefinitions();
   ```

3. **Fallback Logic (Line 135):**
   ```typescript
   const result = loaded.length > 0 ? loaded : demoAttributeDefinitions;
   ```

### Critical Finding:

**The app uses migrated data ONLY if:**
- `loadAttributeDefinitions()` returns array with length > 0
- AND no exception is thrown

**If migration fails (returns `[]` or throws):**
- App silently falls back to `demoAttributeDefinitions` (4 attributes, 2 categories)

### Which Dataset is Active?

**To Determine:**
- Check console log: `[App] Loaded X attribute definitions`
- If X = 4 → **Using demo data** (migration not working)
- If X > 4 → **Using migrated data** (migration working)

**Evidence Needed:**
- Console output showing actual count
- Migration logs showing file discovery and processing

---

## STEP 3 — UI FILTERING CHECK

### CategorySidebar Component Analysis

**File:** `src/ui/components/CategorySidebar.tsx`  
**Line 196:**
```typescript
{Object.entries(categoryMap).map(([categoryId, items]) => {
```

**CategorySidebar receives `categoryMap` prop and displays it directly.**

### CategoryMap Source

**File:** `src/data/categoryMap.ts`  
**Lines 24-49:**
```typescript
export const CATEGORY_MAP: CategoryStructure = {
  character: [
    { label: "Archetype", nodeId: "character-archetype-root", ... }
  ],
  style: [
    { label: "Art Style", nodeId: "style-artstyle-root", ... }
  ]
};
```

**CRITICAL FINDING:**
- `CATEGORY_MAP` is **HARDCODED** with only 2 categories: `character` and `style`
- This is a **static constant**, not derived from data

### App.tsx Wiring

**Line 29:**
```typescript
import { CATEGORY_MAP } from '../data/categoryMap';
```

**Line 468:**
```typescript
<CategorySidebar
  categoryMap={CATEGORY_MAP}
  ...
/>
```

### CategorySidebar Behavior

**CategorySidebar.tsx Line 196:**
- Renders `Object.entries(categoryMap)` 
- **Does NOT filter** by available attributes
- **Does NOT derive** categories from `attributeDefinitions`
- **Displays exactly what's in `categoryMap` prop**

### Conclusion:

**The sidebar displays ONLY what's in `CATEGORY_MAP`, regardless of:**
- How many categories exist in `attributeDefinitions`
- How many question nodes are loaded
- What data was migrated

**Even if migration succeeds with 6 categories, the sidebar will show only 2 because `CATEGORY_MAP` is hardcoded.**

---

## STEP 4 — CONCLUSION

### Answer: **A) All categories exist but UI filters them**

**WITH CLARIFICATION:**

The issue is **NOT** that categories are filtered from `attributeDefinitions`. The issue is:

1. **`CATEGORY_MAP` is hardcoded** with only 2 categories (`character` and `style`)
2. **CategorySidebar displays `categoryMap` directly** - it doesn't derive categories from `attributeDefinitions` or `questionNodes`
3. **Even if migration succeeds and `attributeDefinitions` has 6 categories**, the sidebar will still show only 2 because `CATEGORY_MAP` is hardcoded

### Evidence Summary:

1. ✅ **categoryMap.ts (Lines 24-49):** Only defines `character` and `style` categories
2. ✅ **CategorySidebar.tsx (Line 196):** Renders `Object.entries(categoryMap)` - displays whatever is in the map
3. ✅ **App.tsx (Line 468):** Passes `CATEGORY_MAP` directly to CategorySidebar
4. ✅ **No dynamic category generation:** There's no code that builds `CATEGORY_MAP` from `attributeDefinitions` or `questionNodes`

### Root Cause:

**The `CATEGORY_MAP` is a static, hardcoded structure that doesn't reflect the actual migrated data.**

### Additional Unknowns:

1. **Is migration actually working?** 
   - Need console logs to verify
   - If `[App] Loaded 4 attribute definitions` → migration failed
   - If `[App] Loaded 965+ attribute definitions` → migration succeeded

2. **Are question nodes loaded?**
   - Check if `questionNodes` has more than 2 nodes
   - Check migration logs for question node count

3. **What categories actually exist in migrated data?**
   - Run diagnostic query in browser console
   - Check migration logs for category breakdown

---

## VERIFICATION REQUIRED

**To Complete Diagnosis, Check Browser Console For:**

1. `[App] Loaded X attribute definitions` → What is X?
2. `[Migration] FOUND X OLD DATA FILES` → Are files found?
3. `[Migration] Created X attribute definitions` → How many migrated?
4. `[Migration] Category breakdown:` → What categories exist?

**Run Diagnostic Query:**
```javascript
// In browser console (requires React DevTools or temporary code)
const categories = [...new Set(attributeDefinitions.map(a => a.category))];
console.log('Total:', attributeDefinitions.length);
console.log('Categories:', categories);
categories.forEach(cat => {
  console.log(`${cat}: ${attributeDefinitions.filter(a => a.category === cat).length}`);
});
```

---

## SUMMARY

**Primary Issue:** `CATEGORY_MAP` is hardcoded with 2 categories, so sidebar shows only 2 regardless of actual data.

**Secondary Issue:** Need to verify if migration is working (check console logs).

**Solution Path:**
1. Verify migration status (console logs)
2. If migration works: Build `CATEGORY_MAP` dynamically from `questionNodes` or `attributeDefinitions`
3. If migration fails: Fix migration first, then build dynamic `CATEGORY_MAP`

