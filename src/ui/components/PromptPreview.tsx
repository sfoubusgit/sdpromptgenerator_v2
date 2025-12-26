/**
 * Prompt Preview Component
 * 
 * Responsibilities:
 * - Display prompt strings (positive and negative)
 * - Apply syntax highlighting (optional, display-only)
 * - Show token count with limit indicator
 * - Provide copy functionality
 * 
 * Must NOT:
 * - Generate or compute prompt strings
 * - Modify prompt text before display
 * - Format weights manually
 * - Calculate token counts
 * - Store prompt strings internally
 * - Validate prompt content
 */

import './PromptPreview.css';

// TODO: Import types when ready
// import { Prompt } from '../types';

interface PromptPreviewProps {
  /** Engine result (prompt or null if no prompt yet) */
  prompt: any | null; // TODO: Prompt | null
  
  /** Handler for copy button (optional) */
  onCopy?: () => void;
}

/**
 * Prompt Preview Component
 * 
 * Displays engine-generated prompt strings verbatim.
 */
export function PromptPreview({
  prompt,
  onCopy,
}: PromptPreviewProps) {
  // TODO: Render positiveTokens (formatted for display)
  // TODO: Render negativeTokens (formatted for display)
  // TODO: Display tokenCount with limit indicator
  // TODO: Show progress bar (tokens used / token limit)
  // TODO: Render Copy button -> call onCopy
  // TODO: Apply syntax highlighting (display-only, no modification)

  // Display engine-generated prompt directly
  const displayPositive = prompt && 'positiveTokens' in prompt ? prompt.positiveTokens : '';
  const displayNegative = prompt && 'negativeTokens' in prompt ? prompt.negativeTokens : '';

  const handleCopy = () => {
    if (displayPositive) {
      const fullPrompt = displayNegative
        ? `${displayPositive}\n\nNegative prompt: ${displayNegative}`
        : displayPositive;
      navigator.clipboard.writeText(fullPrompt).catch(() => {
        // Silent fail - copy functionality is optional
      });
      onCopy?.();
    }
  };


  return (
    <div className="prompt-preview">
      <div className="prompt-preview-header">
        <h3 className="prompt-preview-title">Prompt Preview</h3>
        <div className="prompt-preview-header-controls">
          {prompt && 'tokenCount' in prompt && (
            <div className="prompt-preview-metadata">
              <span className="prompt-preview-token-count">
                <span className="prompt-preview-token-count-value">
                  {prompt.tokenCount}
                </span>
                <span className="prompt-preview-token-limit">
                  {' / 77'}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="prompt-preview-content">
        <div className="prompt-preview-section">
          <label className="prompt-preview-label">Prompt</label>
          <div className="prompt-preview-text">
            {displayPositive || 'Start building your prompt...'}
          </div>
        </div>
        
        {displayNegative && (
          <div className="prompt-preview-section">
            <label className="prompt-preview-label">Negative Prompt</label>
            <div className="prompt-preview-text">
              {displayNegative}
            </div>
          </div>
        )}
      </div>
      
      {(displayPositive || (prompt && 'positiveTokens' in prompt && prompt.positiveTokens)) && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="prompt-preview-copy-button"
            onClick={handleCopy}
            type="button"
          >
            Copy Prompt
          </button>
        </div>
      )}
    </div>
  );
}

