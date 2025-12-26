# Minimal Viable Prompt Engine - Structure

## File Tree

```
.
├── package.json              # TypeScript project configuration
├── tsconfig.json             # TypeScript compiler configuration
├── README.md                 # Project overview and usage
├── STRUCTURE.md              # This file - structure documentation
└── src/
    ├── index.ts              # Public API exports
    ├── engine.ts             # Main orchestrator (generatePrompt)
    ├── types/
    │   ├── entities.ts       # Core domain entity types
    │   └── errors.ts         # Error type definitions
    └── modules/
        ├── validator.ts      # Selection validation
        ├── fragment-generator.ts  # Fragment generation
        ├── fragment-processor.ts   # Modifier application
        ├── fragment-orderer.ts     # Fragment ordering
        └── prompt-assembler.ts     # Final prompt assembly
```

## Module Dependencies

```
engine.ts (orchestrator)
  ├── validator.ts
  ├── fragment-generator.ts
  ├── fragment-processor.ts
  ├── fragment-orderer.ts
  └── prompt-assembler.ts
      └── (uses OrderedFragments from fragment-orderer.ts)

All modules depend on:
  └── types/entities.ts
  └── types/errors.ts
```

## Function Signatures

### Core Engine
- `generatePrompt(input: EngineInput): Prompt | ValidationError`

### Validation
- `validateSelection(attributeId, existingSelections, attributeDefinitions): { valid: boolean; error?: ValidationError }`

### Fragment Generation
- `generateFragments(selections, attributeDefinitions): PromptFragment[]`

### Fragment Processing
- `applyModifiers(fragments, modifiers, attributeIds): PromptFragment[]`

### Fragment Ordering
- `orderFragments(fragments, selectionOrder): OrderedFragments`

### Prompt Assembly
- `assemblePrompt(orderedFragments, modelProfile, selectedAttributeIds, appliedModifiers): Prompt | ValidationError`

## Type Definitions

### Core Entities
- `AttributeDefinition` - Selectable attribute schema
- `AttributeSelection` - User's selection instance
- `Modifier` - Weight/intensity adjustment
- `PromptFragment` - Single token in prompt
- `ModelProfile` - SD model configuration
- `Prompt` - Final assembled prompt

### Supporting Types
- `ValidationError` - Error with type and details
- `OrderedFragments` - Separated positive/negative fragments
- `EngineInput` - Complete engine configuration

## Implementation Status

All modules contain:
- ✅ Complete TypeScript type definitions
- ✅ Function signatures with proper types
- ✅ Clear documentation comments
- ✅ TODO comments describing implementation steps
- ❌ No implementation logic (throws "Not implemented")

## Next Steps

1. Implement `validator.ts` - conflict detection
2. Implement `fragment-generator.ts` - selection to fragment conversion
3. Implement `fragment-processor.ts` - weight application
4. Implement `fragment-orderer.ts` - priority sorting
5. Implement `prompt-assembler.ts` - string assembly
6. Implement `engine.ts` - orchestration logic

