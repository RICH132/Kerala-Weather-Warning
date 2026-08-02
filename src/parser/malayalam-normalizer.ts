/**
 * Normalizes Malayalam text to improve matching accuracy.
 * Handles zero-width joiners, non-joiners, excessive whitespace, and common formatting artifacts.
 */
export const normalizeMalayalam = (text: string): string => {
    if (!text) return '';

    return text
        // Unicode Normalization Form Canonical Composition
        .normalize('NFC')
        // Remove Zero Width Joiner (ZWJ) and Zero Width Non-Joiner (ZWNJ)
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        // Replace multiple newlines with a single space or newline if needed
        // For keyword matching, collapsing all whitespace into single spaces is usually best
        .replace(/\s+/g, ' ')
        // Convert to lower case (though Malayalam doesn't have case, English words might)
        .toLowerCase()
        // Trim leading/trailing whitespace
        .trim();
};
