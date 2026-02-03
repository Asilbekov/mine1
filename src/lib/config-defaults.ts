// Default configuration values from config.py
// This file is separate from actions.ts because "use server" files can only export async functions

export const DEFAULT_CONFIG = {
    // API URLs
    BASE_URL: { value: 'https://my3.soliq.uz', category: 'api', type: 'string', label: 'Base URL', description: 'Main API base URL' },
    CAPTCHA_URL: { value: '/api/cashregister-edit-api/home/get-captcha', category: 'api', type: 'string', label: 'CAPTCHA Endpoint' },
    SUBMIT_URL: { value: '/api/cashregister-edit-api/check-edit/set-payment', category: 'api', type: 'string', label: 'Submit Endpoint' },
    FILE_UPLOAD_URL: { value: '/api/general-api/file/repository-set-file', category: 'api', type: 'string', label: 'File Upload Endpoint' },

    // Session
    REPOSITORY_ID: { value: 'd8069e78bf077b43a2bbf7db3a7b78e3', category: 'session', type: 'string', label: 'Repository ID' },
    DEFAULT_TIN: { value: '62409036610049', category: 'session', type: 'string', label: 'Default TIN' },
    DEFAULT_PIN_CODE: { value: '123456', category: 'session', type: 'string', label: 'PIN Code' },
    INTERACTIVE_ID: { value: '58', category: 'session', type: 'number', label: 'Interactive ID' },

    // Request Configuration
    REQUEST_TIMEOUT: { value: '120', category: 'performance', type: 'number', label: 'Request Timeout (sec)' },
    REQUEST_DELAY: { value: '0.05', category: 'performance', type: 'number', label: 'Request Delay (sec)' },
    MAX_RETRIES: { value: '3', category: 'performance', type: 'number', label: 'Max Retries' },
    UPLOAD_MAX_RETRIES: { value: '3', category: 'performance', type: 'number', label: 'Upload Max Retries' },
    CAPTCHA_MAX_RETRIES: { value: '2', category: 'performance', type: 'number', label: 'CAPTCHA Max Retries' },
    BATCH_SIZE: { value: '50', category: 'performance', type: 'number', label: 'Batch Size' },

    // Files
    EXCEL_FILE: { value: 'Асилбекова Июнь тахрирлаш 20303 та.xlsx', category: 'files', type: 'string', label: 'Active Excel File' },
    ZIP_FILE: { value: 'АСИЛБЕКОВА.zip', category: 'files', type: 'string', label: 'ZIP Archive' },
    CHECK_NUMBER_COLUMN: { value: 'receipt_id', category: 'files', type: 'string', label: 'Check Number Column' },

    // Gemini OCR
    OCR_ENGINE: { value: 'gemini', category: 'gemini', type: 'string', label: 'OCR Engine' },
    GEMINI_MODEL: { value: 'gemini-2.5-flash-lite', category: 'gemini', type: 'string', label: 'Gemini Model' },
    GEMINI_RPM_PER_KEY: { value: '14', category: 'gemini', type: 'number', label: 'RPM Per Key' },
    GEMINI_DELAY_BETWEEN_REQUESTS: { value: '3.0', category: 'gemini', type: 'number', label: 'Delay Between Requests (sec)' },
    GEMINI_BATCH_COOLDOWN: { value: '0.5', category: 'gemini', type: 'number', label: 'Batch Cooldown (sec)' },
    GEMINI_MAX_IMAGES_PER_BATCH: { value: '20', category: 'gemini', type: 'number', label: 'Max Images Per Batch' },

    // Performance
    MAX_WORKERS_FILE_UPLOAD: { value: '20', category: 'performance', type: 'number', label: 'Parallel Uploads' },
    MAX_WORKERS_CHECK_SUBMIT: { value: '20', category: 'performance', type: 'number', label: 'Parallel Submissions' },
    CONNECTION_POOL_SIZE: { value: '20', category: 'performance', type: 'number', label: 'Connection Pool Size' },
    SUBMISSION_STAGGER_DELAY: { value: '0.15', category: 'performance', type: 'number', label: 'Submission Stagger (sec)' },
    FILE_UPLOAD_STAGGER_DELAY: { value: '0.2', category: 'performance', type: 'number', label: 'Upload Stagger (sec)' },

    // Server Error Handling
    SERVER_ERROR_MAX_RETRIES: { value: '5', category: 'limits', type: 'number', label: 'Server Error Max Retries' },
    SERVER_ERROR_BASE_DELAY: { value: '2.0', category: 'limits', type: 'number', label: 'Server Error Base Delay (sec)' },
    SERVER_ERROR_MAX_DELAY: { value: '30.0', category: 'limits', type: 'number', label: 'Server Error Max Delay (sec)' },
};
