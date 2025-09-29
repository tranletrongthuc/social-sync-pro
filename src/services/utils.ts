// This utility file will house common functions like sanitizeAndParseJson
// to avoid circular dependencies.

export const sanitizeAndParseJson = (jsonText: string): any => {
    if (!jsonText) {
        throw new Error("Received empty JSON string from AI.");
    }

    let sanitized = jsonText.trim();

    // More robustly find the JSON object within the text
    const firstBrace = sanitized.indexOf('{');
    const lastBrace = sanitized.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        console.error("Could not find a valid JSON object within the AI response:", jsonText);
        throw new Error("The AI response did not contain a recognizable JSON object.");
    }

    sanitized = sanitized.substring(firstBrace, lastBrace + 1);

    // Fix: trailing commas in objects and arrays
    sanitized = sanitized.replace(/,(\s*[\}\]])/g, '$1');

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

export const renderPostContent = (content: any): string => {
    if (!content) return '';
    if (typeof content === 'string') {
        return content;
    }
    if (Array.isArray(content)) {
        return content.join('\n\n');
    }
    if (typeof content === 'object') {
        // For video scripts or other objects, return the most relevant field or stringify
        if (content.fullScript) return content.fullScript;
        if (content.general) return content.general;
        return JSON.stringify(content, null, 2);
    }
    return String(content); // Fallback for any other type
};
