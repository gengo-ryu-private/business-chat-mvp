export function isRequired(value: string): boolean {
    return value.trim().length > 0;
}

export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isBlankMessage(body: string): boolean {
    return body.trim().length === 0;
}
