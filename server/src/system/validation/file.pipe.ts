import { z } from 'zod';
import { ALL_FILE_TYPES } from '~/shared/constants/file-types.constants';
import { appConfig } from '~/system/config';

const KB = 1024n;
const MB = 1024n * 1024n;

const toBigInt = (value: bigint | number): bigint => {
    if (typeof value === 'bigint') {
        return value;
    }

    return BigInt(value);
};

const formatSizeLabel = (sizeInBytes: bigint): string => {
    if (sizeInBytes < KB) {
        return `${sizeInBytes.toString()} B`;
    }

    if (sizeInBytes < MB) {
        return `${(sizeInBytes / KB).toString()} KB`;
    }

    const whole = sizeInBytes / MB;
    const remainder = sizeInBytes % MB;
    const decimal = (remainder * 100n) / MB;
    const decimalText = decimal === 0n ? '' : `.${decimal.toString().padStart(2, '0').replace(/0+$/, '')}`;

    return `${whole.toString()}${decimalText} MB`;
};

export interface FileSchemaOverrides {
    allowedMimeTypes?: string[];
    minFileSize?: bigint | number; // Minimum file size in bytes
    maxFileSize?: bigint | number; // Maximum file size in bytes
    required?: boolean;
    fieldName?: string | null;
    includeBuffer?: boolean; // Flag to include buffer in the schema
}

export const createFileRule = (overrides: FileSchemaOverrides = {}) => {
    const {
        allowedMimeTypes = ALL_FILE_TYPES,
        minFileSize = KB,
        maxFileSize = BigInt(appConfig.plugins.multipart.limits.fileSize),
        required = false,
        fieldName = null,
        includeBuffer = false // Default to not including buffer
    } = overrides;

    const minBytes = toBigInt(minFileSize);
    const maxBytes = toBigInt(maxFileSize);

    const withFieldName = (message: string) => (fieldName ? `${fieldName}: ${message}` : message);

    // Define the file schema
    const fileSchema = z.object({
        mimetype: z
            .string()
            .refine(value => allowedMimeTypes.includes(value), {
                message: withFieldName('The file type is not supported.')
            }),
        fileId: z.string().nullable().default(null),
        fileName: z.string().nonempty(withFieldName('The file name cannot be empty.')),
        filePath: z.string().nonempty(withFieldName('The file path is required.')),
        fileSize: z
            .bigint()
            .min(minBytes, {
                message: withFieldName('The selected file appears to be empty. Please choose a valid file.')
            })
            .max(maxBytes, {
                message: withFieldName(`The file is too large. Maximum allowed size is ${formatSizeLabel(maxBytes)}.`)
            })
            .refine(value => value > 0n, {
                message: withFieldName('We could not read the file size. Please upload the file again.')
            }),
        ...(includeBuffer ? { buffer: z.instanceof(Buffer) } : {}) // Include buffer if requested
    });

    // Define the array schema dynamically based on the `required` flag
    const fileArraySchema = required
        ? z.array(fileSchema).min(1, withFieldName('At least one file must be uploaded.'))
        : z.array(fileSchema).optional(); // Make the array optional if not required

    return fileArraySchema;
};
