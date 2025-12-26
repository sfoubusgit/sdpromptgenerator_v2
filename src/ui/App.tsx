/**
 * Top-level Application Component
 * 
 * Responsibilities:
 * - Owns all global UI state (selections, modifiers, navigation, model profile)
 * - Orchestrates engine calls (converts state to EngineInput, calls generatePrompt)
 * - Manages data loading (AttributeDefinitions, ModelProfiles)
 * - Coordinates component communication
 * 
 * Must NOT:
 * - Compute prompt strings
 * - Validate conflicts
 * - Format weights
 * - Store domain rules
 */

import { useState, useCallback, useEffect } from 'react';
import { AttributeDefinition, AttributeSelection, Modifier, ModelProfile, Prompt, ValidationError } from '../types';
import { generatePrompt, EngineInput } from '../engine';
import { loadAttributeDefinitions } from '../data/loadAttributeDefinitions';
import { loadQuestionNodes, QuestionNode } from '../data/loadQuestionNodes';
import { validateAllCategories } from '../data/validateCategoryIntegration';
import './App.css';
import { PromptPreview } from './components/PromptPreview';
import { QuestionCard } from './components/QuestionCard';
import { CompletionState } from './components/CompletionState';
import { ErrorDisplay } from './components/ErrorDisplay';
import { CategorySidebar } from './components/CategorySidebar';
import { RandomPromptGenerator } from './components/RandomPromptGenerator';
import { CATEGORY_MAP } from '../data/categoryMap';

/**
 * Default model profile for Stable Diffusion
 * TODO: Load from config or allow user selection
 */
/**
 * Default model profile matching old generator behavior
 */
const DEFAULT_MODEL_PROFILE: ModelProfile = {
  tokenLimit: 77, // SD 1.5 default
  tokenSeparator: ', ', // Comma-separated tokens
  weightSyntax: 'attention', // Format: (text:value)
  defaultNegativePrompt: 'deformed, distorted, extra limbs, low detail, low quality, bad anatomy', // From old generator
};

/**
 * Attribute definitions will be loaded from external JSON files.
 * No data is loaded at this stage.
 */

export function App() {
  // UI State: Selections
  const [selections, setSelections] = useState<Map<string, AttributeSelection>>(new Map());
  
  // UI State: Modifiers
  const [modifiers, setModifiers] = useState<Map<string, Modifier>>(new Map());
  
  // UI State: Weight enabled/disabled (checkbox state for each attribute)
  // This tracks whether the weight checkbox is checked for each attribute
  const [weightEnabled, setWeightEnabled] = useState<Map<string, boolean>>(new Map());
  
  // UI State: Model Profile
  const [modelProfile, setModelProfile] = useState<ModelProfile>(DEFAULT_MODEL_PROFILE);
  
  // UI State: Engine Result
  const [engineResult, setEngineResult] = useState<Prompt | ValidationError | null>(null);
  
  // Attribute definitions will be loaded from external JSON files.
  // No data is loaded at this stage.
  const [attributeDefinitions] = useState<AttributeDefinition[]>(() => {
    try {
      const loaded = loadAttributeDefinitions();
      console.log(`[App] Loaded ${loaded.length} attribute definitions`);
      
      // CRITICAL VALIDATION: Verify categories in CATEGORY_MAP have attribute data
      Object.keys(CATEGORY_MAP).forEach(categoryId => {
        const categoryAttributes = loaded.filter(def => def.category === categoryId);
        if (categoryAttributes.length === 0) {
          console.error(`[App] ⚠️ VALIDATION ERROR: Category "${categoryId}" is in CATEGORY_MAP but has 0 attributes loaded!`);
          console.error(`[App] SOLUTION: Check that src/data/${categoryId}.json exists and is properly formatted.`);
          console.error(`[App] File must have structure: { "category": "${categoryId}", "attributes": [...] }`);
        } else {
          console.log(`[App] ✓ Category "${categoryId}" has ${categoryAttributes.length} attributes loaded`);
        }
      });
      
      return loaded;
    } catch (error) {
      console.error('Failed to load attribute definitions:', error);
      return [];
    }
  });
  
  // Question nodes will be loaded from external JSON files.
  // No data is loaded at this stage.
  const [questionNodes, setQuestionNodes] = useState<QuestionNode[]>([]);
  
  // Category order for interview flow (based on semantic priority)
  // This defines the sequence in which categories are presented when clicking Next
  // 
  // IMPORTANT: When adding new categories, add them to this array in the desired order
  // The order determines the interview flow: subject -> style -> lighting -> [future categories]
  // 
  // Categories must also exist in CATEGORY_MAP with their root nodeId
  const CATEGORY_ORDER: string[] = ['subject', 'style', 'lighting', 'camera', 'environment', 'quality', 'effects', 'post-processing'];
  
  // Helper: Get first subcategory node ID for a category, or the category root if no subcategories
  const getFirstSubcategoryNodeId = (categoryId: string, nodes: QuestionNode[]): string | null => {
    const categoryItems = CATEGORY_MAP[categoryId];
    if (!categoryItems || categoryItems.length === 0) return null;
    
    const mainItem = categoryItems[0];
    // If there are subcategories, get the first one's nodeId
    if (mainItem.subcategories && mainItem.subcategories.length > 0) {
      const firstSubcategory = mainItem.subcategories[0];
      if (firstSubcategory.nodeId && nodes.find(n => n.id === firstSubcategory.nodeId)) {
        return firstSubcategory.nodeId;
      }
    }
    // Otherwise, use the main category's nodeId
    if (mainItem.nodeId && nodes.find(n => n.id === mainItem.nodeId)) {
      return mainItem.nodeId;
    }
    return null;
  };

  // Determine initial node ID
  const getInitialNodeId = (nodes: QuestionNode[]): string => {
    // Try to get the first subcategory of the first category
    const firstCategory = CATEGORY_ORDER[0];
    const firstSubcategoryId = getFirstSubcategoryNodeId(firstCategory, nodes);
    if (firstSubcategoryId) {
      return firstSubcategoryId;
    }
    
    // Fallback to subject-root or first node
    return nodes.find(n => n.id === 'subject-root')?.id || 
           nodes.find(n => n.id === 'root')?.id ||
           nodes[0]?.id || 
           '';
  };
  
  /**
   * Get the next category node ID in the interview order
   * Returns the root node ID for the next category, or null if no more categories
   */
  const getNextCategoryNodeId = useCallback((currentCategoryId: string | null, nodes: QuestionNode[]): string | null => {
    if (!currentCategoryId) {
      // If no current category, return first category's first subcategory
      const firstCategory = CATEGORY_ORDER[0];
      return getFirstSubcategoryNodeId(firstCategory, nodes);
    }
    
    // Find current category index by checking if current node belongs to any category
    let currentIndex = -1;
    for (let i = 0; i < CATEGORY_ORDER.length; i++) {
      const cat = CATEGORY_ORDER[i];
      const categoryItems = CATEGORY_MAP[cat] || [];
      // Check if current node is in this category (including subcategories)
      const isInCategory = categoryItems.some(item => {
        if (item.nodeId === currentCategoryId) return true;
        if (item.subcategories) {
          return item.subcategories.some(sub => sub.nodeId === currentCategoryId);
        }
        return false;
      });
      if (isInCategory) {
        currentIndex = i;
        break;
      }
    }
    
    if (currentIndex === -1) {
      // Current node not in category order, return first category's first subcategory
      const firstCategory = CATEGORY_ORDER[0];
      return getFirstSubcategoryNodeId(firstCategory, nodes);
    }
    
    // Get next category
    const nextIndex = currentIndex + 1;
    if (nextIndex >= CATEGORY_ORDER.length) {
      // No more categories
      return null;
    }
    
    const nextCategory = CATEGORY_ORDER[nextIndex];
    return getFirstSubcategoryNodeId(nextCategory, nodes);
    
    // Verify the node exists in question nodes
    if (nextNodeId && nodes.find(n => n.id === nextNodeId)) {
      return nextNodeId;
    }
    
    return null;
  }, []);
  
  // UI State: Navigation
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  
  // Track if user has explicitly clicked Next to reach the end
  // This ensures completion only happens after explicit Next click, not just from selections
  const [hasReachedEndViaNext, setHasReachedEndViaNext] = useState<boolean>(false);
  
  // Load question nodes
  useEffect(() => {
    try {
      const loaded = loadQuestionNodes();
      console.log(`[App] Loaded ${loaded.length} question nodes:`, loaded.map(n => n.id));
      
      // COMPREHENSIVE VALIDATION: Validate all categories using the validation system
      const validationResults = validateAllCategories(
        attributeDefinitions,
        loaded,
        CATEGORY_ORDER
      );

      // Log validation results
      validationResults.forEach(result => {
        if (result.isValid) {
          console.log(`[App] ✓ Category "${result.categoryId}" is fully integrated`);
          if (result.warnings.length > 0) {
            result.warnings.forEach(warning => {
              console.warn(`[App] ⚠️ ${warning}`);
            });
          }
        } else {
          console.error(`[App] ❌ Category "${result.categoryId}" has integration errors:`);
          result.errors.forEach(error => {
            console.error(`[App]   - ${error}`);
          });
          if (result.warnings.length > 0) {
            result.warnings.forEach(warning => {
              console.warn(`[App] ⚠️ ${warning}`);
            });
          }
        }
      });

      // Count valid vs invalid categories
      const validCount = validationResults.filter(r => r.isValid).length;
      const invalidCount = validationResults.filter(r => !r.isValid).length;
      console.log(`[App] Category Integration Summary: ${validCount} valid, ${invalidCount} invalid out of ${validationResults.length} total`);
      
      if (loaded.length > 0) {
        setQuestionNodes(loaded);
        // Always set initial node when question nodes first load
        const initialId = getInitialNodeId(loaded);
        console.log(`[App] Setting initial node ID: ${initialId}`);
        if (initialId) {
          setCurrentNodeId(initialId);
          setNavigationHistory([initialId]);
          setHasReachedEndViaNext(false); // Reset completion flag on initial load
        }
      } else {
        console.warn('[App] No question nodes loaded');
      }
    } catch (err) {
      console.error('[App] Failed to load question nodes:', err);
    }
  }, []);
  
  // Get current question node
  const currentNode: QuestionNode | undefined = questionNodes.find(n => n.id === currentNodeId);
  
  // Debug logging
  useEffect(() => {
    console.log('[App] Current state:', {
      questionNodesCount: questionNodes.length,
      currentNodeId,
      currentNode: currentNode?.id,
      attributeDefinitionsCount: attributeDefinitions.length,
    });
  }, [questionNodes.length, currentNodeId, currentNode?.id, attributeDefinitions.length]);
  
  // Check if interview is complete
  // CRITICAL RULE: Completion ONLY happens after user explicitly clicks Next button
  // Completion requires ALL of:
  // 1. There's a current node
  // 2. There's no next node (reached the end)
  // 3. User has explicitly clicked Next to reach this end state (hasReachedEndViaNext)
  // 4. User has made at least one selection
  // 
  // This ensures:
  // - Completion NEVER happens just from making selections
  // - Completion ONLY happens after explicit Next button click
  // - Next button is ALWAYS required to proceed
  const isComplete = currentNode && 
                     !currentNode.nextNodeId && 
                     hasReachedEndViaNext &&
                     selections.size > 0;
  
  // Get attribute definitions for current question
  const currentQuestionAttributes = attributeDefinitions.filter(attr => 
    currentNode?.attributeIds.includes(attr.id)
  );
  
  // CRITICAL VALIDATION: Detect missing attributes for current question
  useEffect(() => {
    if (currentNode && currentNode.attributeIds) {
      const missingAttributes = currentNode.attributeIds.filter(
        attrId => !attributeDefinitions.find(def => def.id === attrId)
      );
      
      if (missingAttributes.length > 0) {
        console.error(`[App] ⚠️ VALIDATION ERROR: Question node "${currentNode.id}" references ${missingAttributes.length} missing attributes:`, missingAttributes);
        console.error(`[App] Available attribute IDs (first 20):`, attributeDefinitions.map(def => def.id).slice(0, 20));
        console.error(`[App] Question node expects:`, currentNode.attributeIds);
        console.error(`[App] SOLUTION: Ensure src/data/${currentNode.id.split('-')[0]}.json exists and contains these attribute IDs.`);
        console.error(`[App] Also verify: 1) Dev server was restarted, 2) File is valid JSON, 3) Attribute IDs match exactly`);
      }
      
      if (currentQuestionAttributes.length === 0 && currentNode.attributeIds.length > 0) {
        console.error(`[App] ⚠️ VALIDATION ERROR: Question node "${currentNode.id}" has ${currentNode.attributeIds.length} attribute IDs but 0 matching attributes found!`);
        console.error(`[App] This indicates a data loading or matching issue.`);
        console.error(`[App] DIAGNOSIS: Check browser console for earlier errors about missing data files.`);
      }
      
      // Success logging for debugging
      if (currentQuestionAttributes.length > 0 && currentNode.attributeIds.length > 0) {
        console.log(`[App] ✓ Question "${currentNode.id}" has ${currentQuestionAttributes.length}/${currentNode.attributeIds.length} attributes available`);
      }
    }
  }, [currentNode?.id, currentNode?.attributeIds, attributeDefinitions.length, currentQuestionAttributes.length]);
  
  // Get modifiers for current question (empty for now, can be enhanced later)
  const currentQuestionModifiers: Modifier[] = [];

  /**
   * Core UI ↔ Engine Integration Point
   * 
   * This function bridges UI state (selections, modifiers) with the prompt engine.
   * It converts React state into engine input format and calls generatePrompt().
   * 
   * TODO: Future enhancements could be added here:
   * - Category filtering before engine call
   * - Selection persistence (localStorage, API)
   * - Undo/redo history
   * - Batch operations
   * - Optimistic updates
   */
  const callEngine = useCallback(() => {
    // Convert Map state to arrays for engine
    const selectionsArray: AttributeSelection[] = Array.from(selections.values());
    
    // Only include modifiers that are enabled (checkbox checked)
    const modifiersArray: Modifier[] = Array.from(modifiers.values()).filter(modifier => {
      const isEnabled = weightEnabled.get(modifier.targetAttributeId) ?? false;
      return isEnabled;
    });

    // Build engine input
    const input: EngineInput = {
      attributeDefinitions,
      selections: selectionsArray,
      modifiers: modifiersArray,
      modelProfile,
    };

    // Call engine
    const result = generatePrompt(input);
    setEngineResult(result);
  }, [selections, modifiers, weightEnabled, modelProfile, attributeDefinitions]);

  // Call engine whenever selections, modifiers, or modelProfile changes
  useEffect(() => {
    callEngine();
  }, [callEngine]);

  /**
   * Event Handler: Select an attribute
   * 
   * GLOBAL BEHAVIOR: When ANY attribute is selected:
   * - Selection is added to state
   * - Default weight of 1.0 is automatically set (GLOBAL RULE - NO EXCEPTIONS)
   * - Inline weight slider appears in AttributeSelector (GLOBAL RULE - NO EXCEPTIONS)
   * 
   * Does NOT automatically navigate - user must click Next button
   */
  const handleAttributeSelect = useCallback((attributeId: string) => {
    console.log('[App] Attribute selected:', attributeId);
    console.log('[App] Current node ID:', currentNodeId);
    console.log('[App] Will NOT navigate - user must click Next button');
    setSelections(prev => {
      const next = new Map(prev);
      next.set(attributeId, {
        attributeId,
        isEnabled: true,
        customExtension: null,
      });
      return next;
    });
    
    // GLOBAL RULE: Set default weight of 1.0 when ANY attribute is selected
    // This applies to ALL attributes without exception:
    // - subject attributes
    // - style attributes  
    // - lighting attributes
    // - positive and negative attributes
    // - ALL current and future attributes
    setModifiers(prev => {
      const next = new Map(prev);
      if (!next.has(attributeId)) {
        next.set(attributeId, {
          targetAttributeId: attributeId,
          value: 1.0,
        });
      }
      return next;
    });
    
    // GLOBAL RULE: Weight checkbox is disabled by default when attribute is selected
    setWeightEnabled(prev => {
      const next = new Map(prev);
      if (!next.has(attributeId)) {
        next.set(attributeId, false); // Default to disabled
      }
      return next;
    });
    // EXPLICITLY DO NOT NAVIGATE - user must click Next button
  }, [currentNodeId]);

  /**
   * Event Handler: Deselect an attribute
   * 
   * GLOBAL BEHAVIOR: When ANY attribute is deselected:
   * - Selection is removed from state
   * - Weight modifier is removed (GLOBAL RULE - NO EXCEPTIONS)
   * - Inline weight slider disappears (GLOBAL RULE - NO EXCEPTIONS)
   * - Weight resets to default (no persistence, no memory)
   * 
   * This applies to ALL attributes without exception.
   */
  const handleAttributeDeselect = useCallback((attributeId: string) => {
    setSelections(prev => {
      const next = new Map(prev);
      next.delete(attributeId);
      return next;
    });
    
    // GLOBAL RULE: Remove weight modifier when attribute is deselected
    // This applies to ALL attributes - no exceptions, no persistence
    setModifiers(prev => {
      const next = new Map(prev);
      next.delete(attributeId);
      return next;
    });
    
    // GLOBAL RULE: Remove weight enabled state when attribute is deselected
    setWeightEnabled(prev => {
      const next = new Map(prev);
      next.delete(attributeId);
      return next;
    });
  }, []);

  /**
   * Event Handler: Change custom extension text
   * Updates selection's customExtension and triggers engine call
   */
  const handleCustomExtensionChange = useCallback((attributeId: string, extension: string) => {
    setSelections(prev => {
      const next = new Map(prev);
      const existing = next.get(attributeId);
      if (existing) {
        next.set(attributeId, {
          ...existing,
          customExtension: extension || null,
        });
      }
      return next;
    });
  }, []);

  /**
   * Event Handler: Change weight value
   * Updates modifier value and triggers engine call
   */
  const handleWeightChange = useCallback((attributeId: string, value: number) => {
    setModifiers(prev => {
      const next = new Map(prev);
      next.set(attributeId, {
        targetAttributeId: attributeId,
        value,
      });
      return next;
    });
  }, []);

  /**
   * Event Handler: Change weight enabled state (checkbox toggle)
   * 
   * When enabled: Weight modifier is included in engine call
   * When disabled: Weight modifier is excluded from engine call (but slider value is preserved)
   */
  const handleWeightEnabledChange = useCallback((attributeId: string, enabled: boolean) => {
    // Update weight enabled state
    setWeightEnabled(prev => {
      const next = new Map(prev);
      next.set(attributeId, enabled);
      return next;
    });
    
    // If enabling and modifier doesn't exist, create it with current weight or default 1.0
    if (enabled) {
      setModifiers(prev => {
        const next = new Map(prev);
        if (!next.has(attributeId)) {
          const currentWeight = modifiers.get(attributeId)?.value ?? 1.0;
          next.set(attributeId, {
            targetAttributeId: attributeId,
            value: currentWeight,
          });
        }
        return next;
      });
    }
    // Note: We don't remove the modifier when disabled - we just filter it out in callEngine
    // This preserves the slider value if user re-enables it
  }, [modifiers]);

  /**
   * Event Handler: Navigate back
   * Moves to previous node in history
   */
  const handleNavigateBack = useCallback(() => {
    setHasReachedEndViaNext(false); // Reset completion flag when going back
    setNavigationHistory(prev => {
      if (prev.length > 1) {
        const newHistory = prev.slice(0, -1);
        setCurrentNodeId(newHistory[newHistory.length - 1]);
        return newHistory;
      }
      return prev;
    });
  }, []);

  /**
   * Event Handler: Navigate next
   * Moves to next node if available, or to next category in order
   * ONLY called when user explicitly clicks Next button
   * 
   * CRITICAL: This is the ONLY way to proceed to next question or mark as complete
   * 
   * Flow:
   * 1. If current node has nextNodeId -> navigate to that node
   * 2. Else, check if there's a next category in order -> navigate to that category
   * 3. Else, no more categories -> mark as complete
   */
  const handleNavigateNext = useCallback(() => {
    console.log('[App] Navigate Next clicked');
    console.log('[App] Current node:', currentNode?.id);
    console.log('[App] Next node ID:', currentNode?.nextNodeId);
    
    if (currentNode?.nextNodeId) {
      // There's a next node within current category - navigate to it
      setCurrentNodeId(currentNode.nextNodeId);
      setNavigationHistory(prev => [...prev, currentNode.nextNodeId!]);
      setHasReachedEndViaNext(false); // Reset completion flag when moving forward
    } else {
      // No next node in current category - check for next category
      const nextCategoryNodeId = getNextCategoryNodeId(currentNode?.id || null, questionNodes);
      
      if (nextCategoryNodeId) {
        // There's a next category - navigate to it
        console.log('[App] Navigating to next category:', nextCategoryNodeId);
        setCurrentNodeId(nextCategoryNodeId);
        setNavigationHistory(prev => [...prev, nextCategoryNodeId]);
        setHasReachedEndViaNext(false); // Reset completion flag when moving to next category
      } else {
        // No more categories - mark as complete
        console.log('[App] No more categories available - marking as complete via Next button');
        setHasReachedEndViaNext(true);
      }
    }
  }, [currentNode, questionNodes, getNextCategoryNodeId]);

  /**
   * Event Handler: Navigate skip
   * Skips current question and moves to next
   */
  const handleNavigateSkip = useCallback(() => {
    if (currentNode?.nextNodeId) {
      setCurrentNodeId(currentNode.nextNodeId);
      setNavigationHistory(prev => [...prev, currentNode.nextNodeId!]);
    }
  }, [currentNode]);

  /**
   * Event Handler: Start over
   * Resets all state and returns to first question
   */
  const handleStartOver = useCallback(() => {
    setSelections(new Map());
    setModifiers(new Map());
    setHasReachedEndViaNext(false); // Reset completion flag
    const initialId = getInitialNodeId(questionNodes);
    setCurrentNodeId(initialId);
    setNavigationHistory([initialId]);
  }, [questionNodes]);

  /**
   * Event Handler: Review selections
   * Goes back to first question to review
   */
  const handleReview = useCallback(() => {
    setHasReachedEndViaNext(false); // Reset completion flag when reviewing
    const initialId = getInitialNodeId(questionNodes);
    setCurrentNodeId(initialId);
    setNavigationHistory([initialId]);
  }, [questionNodes]);

  /**
   * Event Handler: Jump to category
   * Navigates to a specific question node
   * 
   * CRITICAL: When jumping to a category, reset completion state
   * This ensures completion doesn't persist when switching categories
   */
  const handleJumpToCategory = useCallback((nodeId: string) => {
    console.log('[App] handleJumpToCategory called with nodeId:', nodeId);
    console.log('[App] Available question nodes:', questionNodes.map(n => n.id));
    // Check if node exists in question nodes
    const targetNode = questionNodes.find(n => n.id === nodeId);
    if (targetNode) {
      console.log('[App] Target node found, navigating to:', nodeId);
      setCurrentNodeId(nodeId);
      setHasReachedEndViaNext(false); // Reset completion flag when jumping
      // Update history to include this jump
      setNavigationHistory(prev => {
        // If node is already in history, truncate to that point
        const nodeIndex = prev.indexOf(nodeId);
        if (nodeIndex !== -1) {
          return prev.slice(0, nodeIndex + 1);
        }
        // Otherwise, add to history
        return [...prev, nodeId];
      });
    } else {
      console.error('[App] Target node not found:', nodeId);
      console.error('[App] Available nodes:', questionNodes.map(n => n.id));
    }
  }, [questionNodes]);

  /**
   * Event Handler: Remove selection
   * Removes selection and triggers engine call
   */
  const handleRemoveSelection = useCallback((attributeId: string) => {
    handleAttributeDeselect(attributeId);
  }, [handleAttributeDeselect]);

  /**
   * Event Handler: Change model profile
   * Updates model profile and triggers engine call
   */
  const handleModelProfileChange = useCallback((profile: ModelProfile) => {
    setModelProfile(profile);
  }, []);

  /**
   * Event Handler: Randomize prompt
   * Applies random selections from the Random Prompt Generator
   */
  const handleRandomize = useCallback((randomSelections: AttributeSelection[]) => {
    // Clear existing selections
    setSelections(new Map());
    setModifiers(new Map());
    setWeightEnabled(new Map());

    // Apply random selections
    const newSelections = new Map<string, AttributeSelection>();
    randomSelections.forEach(selection => {
      newSelections.set(selection.attributeId, selection);
    });
    setSelections(newSelections);
  }, []);

  // Convert Map state to props format for children
  const selectionsMap = new Map<string, { isEnabled: boolean; customExtension: string | null }>();
  selections.forEach((selection, id) => {
    selectionsMap.set(id, {
      isEnabled: selection.isEnabled,
      customExtension: selection.customExtension,
    });
  });

  const modifierValues = new Map<string, number>();
  modifiers.forEach((modifier, id) => {
    modifierValues.set(id, modifier.value);
  });

  // Build modifierEnabled map from weightEnabled state
  // This is passed to components to control checkbox state
  const modifierEnabled = new Map<string, boolean>();
  selections.forEach((selection, attributeId) => {
    // Only show enabled state for selected attributes
    // Default to false if not explicitly set (checkbox unchecked by default)
    modifierEnabled.set(attributeId, weightEnabled.get(attributeId) ?? false);
  });
  
  // Add allowCustomExtension to attribute definitions for current question
  const currentQuestionAttributesWithExtensions = currentQuestionAttributes.map(attr => ({
    ...attr,
    allowCustomExtension: currentNode?.allowCustomExtension?.includes(attr.id) ?? false,
  }));

  // Extract prompt and error from engine result
  const prompt: Prompt | null = engineResult && 'positiveTokens' in engineResult ? engineResult : null;
  const error: ValidationError | null = engineResult && 'type' in engineResult ? engineResult : null;
  

  return (
    <div className="app-root">
      <div className="interview-layout">
        <CategorySidebar
          categoryMap={CATEGORY_MAP}
          currentNodeId={currentNodeId}
          selections={selectionsMap}
          onJumpToCategory={handleJumpToCategory}
        />
        <div className="interview-container">
          <div className="app-main">
            {isComplete ? (
              <CompletionState
                totalSteps={navigationHistory.length}
                onStartOver={handleStartOver}
                onReview={handleReview}
              />
            ) : currentNode ? (
              <QuestionCard
                node={currentNode}
                currentStep={navigationHistory.length}
                selections={selectionsMap}
                modifierValues={modifierValues}
                modifierEnabled={modifierEnabled}
                attributeDefinitions={currentQuestionAttributesWithExtensions}
                modifiers={currentQuestionModifiers}
                onSelect={handleAttributeSelect}
                onDeselect={handleAttributeDeselect}
                onCustomExtensionChange={handleCustomExtensionChange}
                onWeightChange={handleWeightChange}
                onWeightEnabledChange={handleWeightEnabledChange}
                onNavigateBack={handleNavigateBack}
                onNavigateNext={handleNavigateNext}
                onNavigateSkip={handleNavigateSkip}
                canGoBack={navigationHistory.length > 1}
                canGoNext={true}
              />
            ) : (
              <div className="app-error-state">
                <p>Question not found. Please start over.</p>
                <button onClick={handleStartOver}>Start Over</button>
              </div>
            )}
            {error && (
              <ErrorDisplay
                error={error}
                selections={selectionsMap}
                onRemoveSelection={handleRemoveSelection}
              />
            )}
          </div>
          <div className="app-sidebar">
            <PromptPreview 
              prompt={prompt}
            />
            <RandomPromptGenerator
              attributeDefinitions={attributeDefinitions}
              questionNodes={questionNodes}
              onRandomize={handleRandomize}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

