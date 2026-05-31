import { z } from 'zod';

const CAMEL_CASE_BOUNDARY_REGEX = /([a-z0-9])([A-Z])/g;
const SEPARATORS_REGEX = /[_-]+/g;
const MULTI_SPACE_REGEX = /\s+/g;
const CAMEL_CASE_WORD_REGEX = /\b[a-z]+(?:[A-Z][a-z0-9]+)+\b/g;
const SNAKE_CASE_WORD_REGEX = /\b[a-z]+(?:_[a-z0-9]+)+\b/gi;

const ACRONYM_REPLACEMENTS: Array<{ pattern: RegExp; value: string }> = [
    { pattern: /\bid\b/gi, value: 'ID' },
    { pattern: /\burl\b/gi, value: 'URL' },
    { pattern: /\bip\b/gi, value: 'IP' },
    { pattern: /\buuid\b/gi, value: 'UUID' }
];

const capitalize = (value: string): string => {
    if (!value) return value;
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
};

const ensureSentence = (value: string): string => {
    const normalized = value.trim();
    if (!normalized) return normalized;
    return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
};

const applyAcronyms = (value: string): string => {
    return ACRONYM_REPLACEMENTS.reduce(
        (result, replacement) => result.replace(replacement.pattern, replacement.value),
        value
    );
};

const humanizeToken = (token: string, toLowerCase = false): string => {
    const normalized = token
        .replace(CAMEL_CASE_BOUNDARY_REGEX, '$1 $2')
        .replace(SEPARATORS_REGEX, ' ')
        .replace(MULTI_SPACE_REGEX, ' ')
        .trim();

    if (!normalized) return token;
    return toLowerCase ? normalized.toLowerCase() : normalized;
};

const humanizeInlineFieldMentions = (message: string): string => {
    return message
        .replace(CAMEL_CASE_WORD_REGEX, token => humanizeToken(token, true))
        .replace(SNAKE_CASE_WORD_REGEX, token => humanizeToken(token, true));
};

const finalizeMessage = (message: string): string => {
    const cleaned = humanizeInlineFieldMentions(message).replace(MULTI_SPACE_REGEX, ' ').trim();
    return ensureSentence(applyAcronyms(capitalize(cleaned)));
};

const humanizePath = (path: readonly PropertyKey[], fallbackField?: string): string => {
    const pathParts = path
        .map(segment => (typeof segment === 'number' ? `item ${segment + 1}` : humanizeToken(String(segment), true)))
        .filter(Boolean);

    if (pathParts.length > 0) {
        return applyAcronyms(capitalize(pathParts.join(' ')));
    }

    if (fallbackField) {
        return applyAcronyms(capitalize(humanizeToken(fallbackField, true)));
    }

    return 'This field';
};

const pluralize = (count: number, singular: string, plural = `${singular}s`): string => {
    return count === 1 ? singular : plural;
};

const DEFAULT_ZOD_MESSAGE_PATTERNS: RegExp[] = [
    /^invalid input:?/i,
    /^too small:/i,
    /^too big:/i,
    /^invalid (string|type|enum|date|value|union)/i,
    /^expected .+?, received /i
];

const isDefaultZodMessage = (message: string): boolean => {
    return DEFAULT_ZOD_MESSAGE_PATTERNS.some(pattern => pattern.test(message));
};

const readAsNumber = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const isMissingValue = (value: unknown): boolean => {
    const normalized = String(value).toLowerCase();
    return normalized === 'undefined' || normalized === 'null' || normalized === 'nan';
};

const expectedTypeLabel = (expected: unknown): string => {
    const normalized = String(expected).toLowerCase();

    switch (normalized) {
        case 'string':
            return 'text';
        case 'number':
            return 'a number';
        case 'int':
            return 'a whole number';
        case 'boolean':
            return 'true or false';
        case 'array':
            return 'a list';
        case 'object':
            return 'an object';
        case 'date':
            return 'a valid date';
        default:
            return normalized ? `a valid ${normalized}` : 'a valid value';
    }
};

const normalizeCustomRequiredMessage = (message: string): string => {
    const requiredMatch = message.match(/^([a-zA-Z0-9_.-]+)\s+is required$/i);
    if (!requiredMatch) return message;

    const fieldName = capitalize(humanizeToken(requiredMatch[1], true));
    return `${fieldName} is required`;
};

const formatAllowedValues = (values: unknown): string => {
    if (!Array.isArray(values) || values.length === 0) {
        return 'a supported value';
    }

    const labels = values.map(value => {
        if (typeof value === 'string') {
            return humanizeToken(value, true);
        }

        return String(value);
    });

    return `one of: ${labels.join(', ')}`;
};

interface FormatZodIssueOptions {
    defaultField?: string;
}

export const formatZodIssueMessage = (issue: z.ZodIssue, options: FormatZodIssueOptions = {}): string => {
    const fieldName = humanizePath(issue.path, options.defaultField);
    const issueData = issue as unknown as Record<string, unknown>;
    const rawIssueMessage = typeof issueData.message === 'string' ? issueData.message.trim() : '';

    if (rawIssueMessage && !isDefaultZodMessage(rawIssueMessage) && !/^invalid input$/i.test(rawIssueMessage)) {
        return finalizeMessage(rawIssueMessage);
    }

    let message = `${fieldName} has an invalid value`;

    switch (issue.code) {
        case 'custom': {
            const normalized = normalizeCustomRequiredMessage(issue.message || 'Invalid input');
            message = /^invalid input$/i.test(normalized) ? `${fieldName} has an invalid value` : normalized;
            break;
        }

        case 'invalid_type': {
            if (isMissingValue(issueData.received)) {
                message = `${fieldName} is required`;
                break;
            }

            message = `${fieldName} must be ${expectedTypeLabel(issueData.expected)}`;
            break;
        }

        case 'invalid_format': {
            const format = String(issueData.format || '').toLowerCase();

            switch (format) {
                case 'email':
                    message = `${fieldName} must be a valid email address`;
                    break;
                case 'url':
                    message = `${fieldName} must be a valid URL`;
                    break;
                case 'uuid':
                    message = `${fieldName} must be a valid ID format`;
                    break;
                case 'datetime':
                    message = `${fieldName} must be a valid date and time`;
                    break;
                case 'date':
                    message = `${fieldName} must be a valid date`;
                    break;
                default:
                    message = `${fieldName} has an invalid format`;
            }

            break;
        }

        case 'invalid_value':
            message = `${fieldName} must be ${formatAllowedValues(issueData.values)}`;
            break;

        case 'too_small': {
            const type = String(issueData.type || '').toLowerCase();
            const minimum = readAsNumber(issueData.minimum);
            const inclusive = issueData.inclusive !== false;
            const exact = Boolean(issueData.exact);

            if (type === 'string') {
                if (minimum === 1) {
                    message = `${fieldName} is required`;
                    break;
                }

                if (minimum !== null) {
                    if (exact) {
                        message = `${fieldName} must be exactly ${minimum} characters long`;
                    } else if (inclusive) {
                        message = `${fieldName} must be at least ${minimum} characters long`;
                    } else {
                        message = `${fieldName} must be longer than ${minimum} characters`;
                    }

                    break;
                }

                message = `${fieldName} is too short`;
                break;
            }

            if (type === 'number' || type === 'bigint') {
                if (minimum !== null) {
                    if (exact) {
                        message = `${fieldName} must be exactly ${minimum}`;
                    } else if (inclusive) {
                        message = `${fieldName} must be at least ${minimum}`;
                    } else {
                        message = `${fieldName} must be greater than ${minimum}`;
                    }

                    break;
                }

                message = `${fieldName} is too small`;
                break;
            }

            if (type === 'array' || type === 'set') {
                if (minimum !== null) {
                    if (exact) {
                        message = `${fieldName} must include exactly ${minimum} ${pluralize(minimum, 'item')}`;
                    } else if (inclusive) {
                        message = `${fieldName} must include at least ${minimum} ${pluralize(minimum, 'item')}`;
                    } else {
                        message = `${fieldName} must include more than ${minimum} ${pluralize(minimum, 'item')}`;
                    }

                    break;
                }

                message = `${fieldName} must include more items`;
                break;
            }

            message = `${fieldName} is too small`;
            break;
        }

        case 'too_big': {
            const type = String(issueData.type || '').toLowerCase();
            const maximum = readAsNumber(issueData.maximum);
            const inclusive = issueData.inclusive !== false;
            const exact = Boolean(issueData.exact);

            if (type === 'string') {
                if (maximum !== null) {
                    if (exact) {
                        message = `${fieldName} must be exactly ${maximum} characters long`;
                    } else if (inclusive) {
                        message = `${fieldName} must be no more than ${maximum} characters long`;
                    } else {
                        message = `${fieldName} must be shorter than ${maximum} characters`;
                    }

                    break;
                }

                message = `${fieldName} is too long`;
                break;
            }

            if (type === 'number' || type === 'bigint') {
                if (maximum !== null) {
                    if (exact) {
                        message = `${fieldName} must be exactly ${maximum}`;
                    } else if (inclusive) {
                        message = `${fieldName} must be no more than ${maximum}`;
                    } else {
                        message = `${fieldName} must be less than ${maximum}`;
                    }

                    break;
                }

                message = `${fieldName} is too large`;
                break;
            }

            if (type === 'array' || type === 'set') {
                if (maximum !== null) {
                    if (exact) {
                        message = `${fieldName} must include exactly ${maximum} ${pluralize(maximum, 'item')}`;
                    } else if (inclusive) {
                        message = `${fieldName} can include up to ${maximum} ${pluralize(maximum, 'item')}`;
                    } else {
                        message = `${fieldName} must include fewer than ${maximum} ${pluralize(maximum, 'item')}`;
                    }

                    break;
                }

                message = `${fieldName} has too many items`;
                break;
            }

            message = `${fieldName} is too large`;
            break;
        }

        case 'not_multiple_of': {
            const step = readAsNumber(issueData.divisor);
            message =
                step !== null ? `${fieldName} must be a multiple of ${step}` : `${fieldName} has an invalid value`;
            break;
        }

        case 'invalid_union':
        case 'invalid_key':
        case 'invalid_element': {
            message = `${fieldName} has an invalid value`;
            break;
        }

        case 'unrecognized_keys': {
            const keys = Array.isArray(issueData.keys)
                ? issueData.keys.map(key => humanizeToken(String(key), true))
                : [];
            if (keys.length > 0) {
                message = `Request contains unsupported fields: ${keys.join(', ')}`;
                break;
            }

            message = 'Request contains unsupported fields';
            break;
        }

        default: {
            const normalized = typeof issueData.message === 'string' ? issueData.message.trim() : '';
            const issuePath = Array.isArray(issueData.path) ? issueData.path : [];

            if (normalized && !/^invalid input:?/i.test(normalized)) {
                if (issuePath.length === 0) {
                    message = normalized;
                    break;
                }

                message = `${fieldName}: ${normalized}`;
                break;
            }

            message = `${fieldName} has an invalid value`;
        }
    }

    return finalizeMessage(message);
};

interface FormatZodValidationMessageOptions {
    defaultField?: string;
    maxIssues?: number;
}

export const formatZodValidationMessage = (
    error: z.ZodError,
    options: FormatZodValidationMessageOptions = {}
): string => {
    const maxIssues = options.maxIssues ?? 5;
    const issues = error.issues
        .slice(0, Math.max(1, maxIssues))
        .map(issue => formatZodIssueMessage(issue, { defaultField: options.defaultField }))
        .filter(Boolean);

    const uniqueIssues = Array.from(new Set(issues));

    if (uniqueIssues.length === 0) {
        return 'Some fields have invalid values.';
    }

    if (error.issues.length > uniqueIssues.length) {
        const remaining = error.issues.length - uniqueIssues.length;
        uniqueIssues.push(finalizeMessage(`${remaining} more ${pluralize(remaining, 'field')} need attention`));
    }

    return uniqueIssues.join(' ');
};
