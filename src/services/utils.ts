// This utility file will house common functions like sanitizeAndParseJson
// to avoid circular dependencies.

export const sanitizeAndParseJson = (jsonText: string): any => {
    if (!jsonText) {
        throw new Error("Received empty JSON string from AI.");
    }

    let sanitized = jsonText.trim();

    // First, try to parse as-is
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        // Proceed to sanitize
    }

    // Improved: Extract content from markdown code block (```json ... ``` or ``` ... ```)
    const markdownRegex = /```(?:json)?\s*\n?([\s\S]*?)(?:\n?\s*```|$)/i;
    const markdownMatch = sanitized.match(markdownRegex);
    if (markdownMatch && markdownMatch[1]) {
        sanitized = markdownMatch[1].trim(); // Use the captured group
    }
    // Else, if no code block, keep the original sanitized string

    // Try parsing again after extracting code block
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        // Continue with fixes
    }

    // Fix: `,"=value"` → `,"value"`
    sanitized = sanitized.replace(/([,[\]]\s*)\"=([^\"]*)\"/g, '$1\"$2\"');

    // Fix: "infographicContent" → "content"
    sanitized = sanitized.replace(/\"infographicContent\":/g, '\"content\":');

    // Fix: hashtags missing opening quote: `#tag"` → `"#tag"`
    sanitized = sanitized.replace(/([,[\]\s])#([^\"\]\s]+)(\")/g, '$1\"#$2$3');

    // Fix: trailing commas in objects and arrays
    sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');

    // Try final parse
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        console.error("Failed to parse AI JSON response:", jsonText);
        console.error("Sanitized text that failed to parse:", sanitized);
        throw new Error(
            "The AI returned a malformed or unexpected response. This may be a temporary issue with the model. Please try again later or configure a different model in Settings."
        );
    }
};