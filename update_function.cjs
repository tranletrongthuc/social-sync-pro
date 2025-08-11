const fs = require('fs');

// Read the file
const filePath = 'C:\\Users\\trltr\\Downloads\\personal_projects\\socialsync-pro-2.1\\services\\geminiService.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Define the old and new functions
const oldFunction = `export const sanitizeAndParseJson = (jsonText: string) => {
    // This function attempts to fix common JSON errors produced by AI models.
    if (!jsonText) {
        throw new Error("Received empty JSON string from AI.");
    }

    let sanitized = jsonText;

    // The single-line comment removal was removed because it was corrupting
    // base64 strings in image generation which can contain "//".
    // The AI models should be trusted to return valid JSON when requested.

    // 2. Fix for observed error: \`... ,"=value" ...\` which should be \`... ,"value" ...\`
    // This regex looks for a comma or opening bracket, optional whitespace,
    // then the erroneous \`="\` followed by a string, and a closing "\`.
    // It reconstructs it as a valid JSON string.
    sanitized = sanitized.replace(/([,\\[])\\s*=\\s*"([^"]*)"/g, '$1"$2"');

    // 3. Fix for Pinterest posts generating "infographicContent" instead of "content".
    sanitized = sanitized.replace(/"infographicContent":/g, '"content":');
    
    // 4. Fix for hashtags missing an opening quote, e.g., [... , #tag"] or [#tag"]
    // This looks for a comma/bracket followed by whitespace, then a #, then captures the tag content, and the closing quote.
    // It then reconstructs it with the opening quote.
    sanitized = sanitized.replace(/([\\[,]\\s*)#([^"]+)(")/g, '$1"#$2$3');

    // 5. Removed risky unescaped quote sanitizer. Relying on responseMimeType: "application/json".
    // sanitized = sanitized.replace(/(?<![[{\\s:,])"(?![\\s,}\\]:])/g, '\\"');

    // 6. Remove trailing commas, which are valid in JS but not in strict JSON.
    // e.g., \`{"key":"value",}\` or \`["item1",]\`
    sanitized = sanitized.replace(/,(\\s*[}\\]])/g, '$1');
    
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        console.error("Failed to parse AI JSON response for product-based ideas:", jsonText);
        throw new Error("The AI returned a malformed or unexpected response. This may be a temporary issue with the model. Please try again later or configure a different model in Settings.");
    }
};`;

const newFunction = `export const sanitizeAndParseJson = (jsonText: string) => {
    // This function attempts to fix common JSON errors produced by AI models.
    if (!jsonText) {
        throw new Error("Received empty JSON string from AI.");
    }

    let sanitized = jsonText.trim();

    // First, try to parse the JSON as is - if it works, return it immediately
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        // If it fails, continue with sanitization
    }

    // Remove any markdown code block markers if present
    const markdownMatch = sanitized.match(/\\\`\\\`\\\`(json)?\\\\s*([\\\\s\\\\S]*?)\\\\s*\\\`\\\`\\\`/);
    if (markdownMatch && markdownMatch[2]) {
        sanitized = markdownMatch[2];
    }

    // The single-line comment removal was removed because it was corrupting
    // base64 strings in image generation which can contain "//".
    // The AI models should be trusted to return valid JSON when requested.

    // 2. Fix for observed error: \`... ,"=value" ...\` which should be \`... ,"value" ...\`
    // This regex looks for a comma or opening bracket, optional whitespace,
    // then the erroneous \`="\` followed by a string, and a closing "\`.
    // It reconstructs it as a valid JSON string.
    sanitized = sanitized.replace(/([,\\[])\\s*=\\s*"([^"]*)"/g, '$1"$2"');

    // 3. Fix for Pinterest posts generating "infographicContent" instead of "content".
    sanitized = sanitized.replace(/"infographicContent":/g, '"content":');
    
    // 4. Fix for hashtags missing an opening quote, e.g., [... , #tag"] or [#tag"]
    // This looks for a comma/bracket followed by whitespace, then a #, then captures the tag content, and the closing quote.
    // It then reconstructs it with the opening quote.
    sanitized = sanitized.replace(/([\\[,]\\s*)#([^"]+)(")/g, '$1"#$2$3');

    // 5. Removed risky unescaped quote sanitizer. Relying on responseMimeType: "application/json".
    // sanitized = sanitized.replace(/(?<![[{\\s:,])"(?![\\s,}\\]:])/g, '\\"');

    // 6. Remove trailing commas, which are valid in JS but not in strict JSON.
    // e.g., \`{"key":"value",}\` or \`["item1",]\`
    sanitized = sanitized.replace(/,(\\s*[}\\]])/g, '$1');
    
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        console.error("Failed to parse AI JSON response for product-based ideas:", jsonText);
        throw new Error("The AI returned a malformed or unexpected response. This may be a temporary issue with the model. Please try again later or configure a different model in Settings.");
    }
};`;

// Replace the old function with the new one
content = content.replace(oldFunction, newFunction);

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('File updated successfully.');