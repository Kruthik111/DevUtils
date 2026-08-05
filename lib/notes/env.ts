// Environment/variable helpers for the Notes page.
// Backed by /api/note-environments — intentionally separate from the API
// testing page's environments, which serve a different purpose.

export interface Environment {
    _id: string;
    name: string;
    variables: Record<string, string>;
    isDefault: boolean;
}

// Matches the {{variableName}} syntax used across the app.
const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

export function hasEnvironmentVariables(text: string): boolean {
    if (!text) return false;
    VARIABLE_REGEX.lastIndex = 0;
    return VARIABLE_REGEX.test(text);
}

// Replace {{key}} tokens with their values. Unknown keys are left untouched.
export function substituteVariables(text: string, variables: Record<string, string>): string {
    if (!text || !variables) return text;
    return text.replace(VARIABLE_REGEX, (match, key) =>
        key in variables ? variables[key] : match
    );
}
