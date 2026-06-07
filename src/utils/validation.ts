export const VALIDATION_LIMITS = {
    displayNameMax: 50,
    tenantNameMax: 50,
    joinCodeLength: 6,
    channelNameMax: 50,
    channelDescriptionMax: 200,
    messageBodyMax: 1000,
} as const;

export const JOIN_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

export function isRequired(value: string): boolean {
    return value.trim().length > 0;
}

export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isBlankMessage(body: string): boolean {
    return body.trim().length === 0;
}

export function isWithinMaxLength(value: string, maxLength: number): boolean {
    return value.trim().length <= maxLength;
}

export function hasExactLength(value: string, length: number): boolean {
    return value.trim().length === length;
}

export function isValidJoinCode(joinCode: string): boolean {
    return JOIN_CODE_PATTERN.test(joinCode.trim());
}
