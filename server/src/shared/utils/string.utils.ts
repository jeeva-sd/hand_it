export const StringUtils = {
    /**
     * Capitalizes the first letter of each word in the string.
     */
    capitalizeWords: (str: string): string => {
        if (!str) return '';
        return str
            .trim()
            .toLowerCase()
            .replace(/\b\w/g, char => char.toUpperCase());
    },

    /**
     * Converts a string to title case, adding spaces between camelCase words.
     */
    toTitleCase: (str: string): string => {
        if (!str) return '';
        return str
            .trim()
            .toLowerCase()
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\b\w/g, c => c.toUpperCase());
    },

    /**
     * Converts a space-separated string to camelCase.
     */
    toCamelCase: (str: string): string => {
        if (!str) return '';
        return str.trim().replace(/\s(.)/g, (_, char) => char.toUpperCase());
    },

    /**
     * Truncates a string to the specified maxLength and appends ellipsis if necessary.
     */
    truncate: (str: string, maxLength: number): string => {
        if (!str || maxLength <= 0) return '';

        const value = str.trim();

        if (value.length <= maxLength) return value;
        if (maxLength <= 3) return '.'.repeat(maxLength);

        return `${value.slice(0, maxLength - 3)}...`;
    },

    /**
     * Checks whether the string is empty or only contains whitespace.
     */
    isEmptyString: (str: string): boolean => {
        return !str || str.trim().length === 0;
    },

    /**
     * Removes all whitespace characters from the string.
     */
    removeWhitespace: (str: string): string => {
        if (!str) return '';
        return str.replace(/\s/g, '');
    },

    /**
     * Counts the number of words in the string.
     */
    countWords: (str: string): number => {
        if (!str) return 0;
        const words = str.split(/\s+/).filter(word => word.length > 0);
        return words.length;
    },

    /**
     * Validates if the input is a properly formatted email address.
     */
    isEmail: (str: string): boolean => {
        if (!str) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    },

    /**
     * Converts a string into a URL-friendly slug.
     */
    slugify: (str: string): string => {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    },

    /**
     * Removes all special characters from the string, preserving alphanumerics and spaces.
     */
    removeSpecialChars: (str: string): string => {
        if (!str) return '';
        return str.replace(/[^\w\s]/g, '');
    },

    /**
     * Generates a random alphanumeric string of the specified length.
     */
    getRandomString: (length: number): string => {
        // biome-ignore lint/security/noSecrets: charset for random string generation
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Pads a string equally on both sides with the specified character to reach the given length.
     */
    padString: (str: string, length: number, char = ' '): string => {
        if (!str || length <= str.length) return str;
        const pad = char.repeat(length - str.length);
        return pad.slice(0, Math.floor(pad.length / 2)) + str + pad.slice(Math.floor(pad.length / 2));
    },

    /**
     * Reverses the characters in the string.
     */
    reverse: (str: string): string => {
        return str.split('').reverse().join('');
    },

    /**
     * Repeats a string a given number of times.
     */
    repeat: (str: string, count: number): string => {
        return str.repeat(count);
    },

    /**
     * Checks if a string contains only alphabetic characters.
     */
    isAlpha: (str: string): boolean => {
        return /^[a-zA-Z]+$/.test(str);
    },

    /**
     * Checks if a string contains only numeric digits.
     */
    isNumeric: (str: string): boolean => {
        return /^[0-9]+$/.test(str);
    },

    /**
     * Extracts all numbers from a string and returns them as an array of numbers.
     */
    extractNumbers: (str: string): number[] => {
        const matches = str.match(/\d+/g);
        return matches ? matches.map(Number) : [];
    },

    /**
     * Converts the first character of a string to uppercase.
     */
    capitalizeFirst: (str: string): string => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Checks whether a string starts with a given substring.
     */
    startsWith: (str: string, prefix: string): boolean => {
        return str.startsWith(prefix);
    },

    /**
     * Checks whether a string ends with a given substring.
     */
    endsWith: (str: string, suffix: string): boolean => {
        return str.endsWith(suffix);
    },

    /**
     * Generates key candidates from an array of words for project/task keys.
     * Takes first 2 words, generates initials and expansions up to 6 characters.
     */
    generateKeyCandidates(words: string[]): string[] {
        if (!words?.length) return [];

        const cleanWords = words.map(w => w.replace(/[^a-zA-Z]/g, '').toUpperCase()).filter(w => w.length > 0);

        if (cleanWords.length === 0) return [];

        const candidates: string[] = [];

        const first = cleanWords[0];
        const second = cleanWords[1];

        // ---- 2 letter base ----
        const base = second ? first[0] + second[0] : first.slice(0, 2);

        candidates.push(base);

        // ---- expand to 3 letters ----
        if (second && second.length > 1) {
            candidates.push(base + second[1]);
        } else if (first.length > 2) {
            candidates.push(base + first[2]);
        }

        // ---- expand to 4 letters ----
        const thirdChar = second?.[2] || first?.[3];

        if (thirdChar) {
            candidates.push(candidates[candidates.length - 1] + thirdChar);
        }

        // remove duplicates, cap at 4 chars
        return [...new Set(candidates)].filter(k => k.length <= 4);
    }
};
