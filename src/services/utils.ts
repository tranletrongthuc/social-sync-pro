// This utility file will house common functions like sanitizeAndParseJson
// to avoid circular dependencies.

export const sanitizeAndParseJson = (jsonText: string): any => {
    if (!jsonText) {
        throw new Error("Received empty JSON string from AI.");
    }

    let sanitized = jsonText.trim();

    // ALWAYS check for markdown block first and extract content.
    const markdownRegex = /```(?:json)?\s*\n?([\s\S]*?)(?:\n?\s*```|$)/i;
    const markdownMatch = sanitized.match(markdownRegex);
    if (markdownMatch && markdownMatch[1]) {
        sanitized = markdownMatch[1].trim();
    }
    // Now, 'sanitized' is either the content of the markdown block or the original trimmed string.

    // Try to parse this potentially clean JSON.
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        // If it fails, it might have other issues, so proceed to more specific fixes.
        console.warn("Initial parse failed, attempting further sanitization.");
    }

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