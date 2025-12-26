# Minimal Viable Prompt Engine

A minimal, deterministic engine for generating Stable Diffusion prompts from attribute selections.

## Structure

```
src/
  types/
    entities.ts          # Core domain entity types
    errors.ts            # Error type definitions
  modules/
    validator.ts         # Selection validation logic
    fragment-generator.ts # Fragment generation from selections
    fragment-processor.ts # Modifier application
    fragment-orderer.ts  # Fragment ordering and separation
    prompt-assembler.ts  # Final prompt assembly
  engine.ts              # Main orchestrator
  index.ts               # Public API exports
```

## Usage

```typescript
import { generatePrompt, type EngineInput } from './src';

const input: EngineInput = {
  attributeDefinitions: new Map([
    ['attr1', { id: 'attr1', baseText: 'text', ... }],
    // ...
  ]),
  selections: [
    { attributeId: 'attr1', isEnabled: true, customExtension: null },
    // ...
  ],
  modifiers: [
    { targetAttributeId: 'attr1', value: 1.3 },
    // ...
  ],
  modelProfile: {
    tokenLimit: 77,
    tokenSeparator: ', ',
    weightSyntax: 'attention',
    defaultNegativePrompt: 'deformed, low quality',
  },
};

const result = generatePrompt(input);
// Returns Prompt | ValidationError
```

## Module Responsibilities

- **validator**: Validates selections for conflicts
- **fragment-generator**: Converts selections to fragments
- **fragment-processor**: Applies weight modifiers
- **fragment-orderer**: Orders fragments by priority
- **prompt-assembler**: Assembles final prompt strings
- **engine**: Orchestrates all phases

## Status

This is a skeleton implementation. All modules contain function signatures but no implementation logic yet.

## Deployment

This project is configured for GitHub Pages deployment. See:
- **[GITHUB_PAGES_SETUP.md](./GITHUB_PAGES_SETUP.md)** - Quick setup guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment documentation

### Quick Deploy

1. Enable GitHub Pages in repository settings (Source: GitHub Actions)
2. Push to `main` branch
3. The workflow will automatically build and deploy your site 
"# sdpromptgenerator_v2" 
"# sdpromptgenerator_v2" 
"# sdpromptgenerator_v2" 
