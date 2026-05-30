type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const ObjectUtils = {
    deepMerge: (base: PlainObject, newObj: PlainObject): PlainObject => {
        const result: PlainObject = { ...base };

        for (const [key, value] of Object.entries(newObj)) {
            if (isPlainObject(value) && isPlainObject(result[key])) {
                result[key] = ObjectUtils.deepMerge(result[key] as PlainObject, value);
            } else {
                result[key] = value;
            }
        }

        return result;
    },

    deepClone: <T>(obj: T): T => {
        return JSON.parse(JSON.stringify(obj)) as T;
    },

    isObject: (value: unknown): boolean => {
        return isPlainObject(value);
    },

    isFunction: (value: unknown): boolean => {
        return typeof value === 'function';
    },

    isObjectEmpty: (obj: object): boolean => {
        return Object.keys(obj).length === 0;
    },

    getObjectKeys: (obj: object): string[] => {
        return Object.keys(obj);
    },

    getObjectValues: (obj: object): unknown[] => {
        return Object.values(obj);
    },

    pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
        const result = {} as Pick<T, K>;
        for (const key of keys) {
            if (key in obj) {
                result[key] = obj[key];
            }
        }
        return result;
    },

    omit: <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
        const result = { ...(obj as Record<string, unknown>) } as Omit<T, K>;
        for (const key of keys) {
            delete (result as Record<string, unknown>)[String(key)];
        }
        return result;
    },

    flattenObject: (obj: PlainObject, prefix = ''): PlainObject => {
        const result: PlainObject = {};
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (isPlainObject(value)) {
                Object.assign(result, ObjectUtils.flattenObject(value, newKey));
            } else {
                result[newKey] = value;
            }
        }
        return result;
    },

    unflattenObject: (obj: PlainObject): PlainObject => {
        const result: PlainObject = {};

        for (const [key, value] of Object.entries(obj)) {
            const parts = key.split('.');
            let current: PlainObject = result;

            for (let index = 0; index < parts.length; index++) {
                const part = parts[index];
                const isLeaf = index === parts.length - 1;

                if (isLeaf) {
                    current[part] = value;
                } else {
                    const next = current[part];
                    if (!isPlainObject(next)) {
                        current[part] = {};
                    }
                    current = current[part] as PlainObject;
                }
            }
        }

        return result;
    }
};
