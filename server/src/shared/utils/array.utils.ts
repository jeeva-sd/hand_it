export const ArrayUtils = {
    groupBy:
        <T extends Record<string, unknown>>(key: keyof T, formatter?: (value: unknown) => string) =>
        (array: T[]): Record<string, T[]> => {
            return array.reduce<Record<string, T[]>>((acc, item) => {
                const rawValue = item[key];
                const groupKey = formatter ? formatter(rawValue) : String(rawValue);
                acc[groupKey] = (acc[groupKey] ?? []).concat(item);
                return acc;
            }, {});
        },

    objectById:
        <T extends Record<string, unknown>>(key: keyof T) =>
        (array: T[]): Record<string, T> => {
            return array.reduce<Record<string, T>>((acc, item) => {
                acc[String(item[key])] = item;
                return acc;
            }, {});
        },

    chunkArray: <T>(array: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    },

    sortByKey: <T>(array: T[], key: keyof T, ascending = true): T[] => {
        return array.slice().sort((a, b) => {
            const valueA = a[key];
            const valueB = b[key];
            if (valueA < valueB) return ascending ? -1 : 1;
            if (valueA > valueB) return ascending ? 1 : -1;
            return 0;
        });
    },

    unique: <T>(array: T[]): T[] => {
        return Array.from(new Set(array));
    },

    uniqueBy: <T>(array: T[], key: keyof T): T[] => {
        const seen = new Set<T[keyof T]>();
        return array.filter(item => {
            const val = item[key];
            if (seen.has(val)) return false;
            seen.add(val);
            return true;
        });
    },

    flatten: <T>(array: T[][]): T[] => {
        return array.reduce<T[]>((acc, val) => acc.concat(val), []);
    },

    intersection: <T>(array1: T[], array2: T[]): T[] => {
        const set = new Set(array2);
        return array1.filter(item => set.has(item));
    },

    difference: <T>(array1: T[], array2: T[]): T[] => {
        const set = new Set(array2);
        return array1.filter(item => !set.has(item));
    },

    shuffle: <T>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    randomElement: <T>(array: T[]): T | undefined => {
        if (!array.length) return undefined;
        const index = Math.floor(Math.random() * array.length);
        return array[index];
    }
};
