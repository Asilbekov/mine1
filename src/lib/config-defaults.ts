// Default configuration values - ALL values from config.py
// This file is separate from actions.ts because "use server" files can only export async functions

export const DEFAULT_CONFIG: Record<string, {
    value: string;
    category: string;
    type: string;
    label: string;
    description?: string;
}> = {
    // === Base URLs and Endpoints ===
    BASE_URL: { value: 'https://my3.soliq.uz', category: 'api', type: 'string', label: 'Base URL', description: 'Main API base URL' },
    API_BASE: { value: 'https://my3.soliq.uz/api/cashregister-edit-api', category: 'api', type: 'string', label: 'API Base' },
    CAPTCHA_URL: { value: '/api/cashregister-edit-api/home/get-captcha', category: 'api', type: 'string', label: 'CAPTCHA Endpoint' },
    SUBMIT_URL: { value: '/api/cashregister-edit-api/check-edit/set-payment', category: 'api', type: 'string', label: 'Submit Endpoint' },
    FILE_UPLOAD_URL: { value: '/api/general-api/file/repository-set-file', category: 'api', type: 'string', label: 'File Upload Endpoint' },

    // === API Constants ===
    REPOSITORY_ID: { value: 'd8069e78bf077b43a2bbf7db3a7b78e3', category: 'session', type: 'string', label: 'Repository ID', description: 'From successful request' },
    DEFAULT_TIN: { value: '62409036610049', category: 'session', type: 'string', label: 'Commission TIN' },
    DEFAULT_PIN_CODE: { value: '123456', category: 'session', type: 'string', label: 'PIN Code', description: 'PIN code for file upload' },
    INTERACTIVE_ID: { value: '58', category: 'session', type: 'number', label: 'Interactive Session ID' },

    // === Request Configuration ===
    REQUEST_TIMEOUT: { value: '120', category: 'performance', type: 'number', label: 'Request Timeout (sec)', description: 'Increased for slow file uploads' },
    REQUEST_DELAY: { value: '0.05', category: 'performance', type: 'number', label: 'Request Delay (sec)', description: 'Minimal delay between requests (50ms)' },
    MAX_RETRIES: { value: '3', category: 'performance', type: 'number', label: 'Max Retries', description: 'Maximum retries for failed requests' },
    UPLOAD_MAX_RETRIES: { value: '3', category: 'performance', type: 'number', label: 'Upload Max Retries' },
    UPLOAD_RETRY_DELAY: { value: '5', category: 'performance', type: 'number', label: 'Upload Retry Delay (sec)' },
    CAPTCHA_MAX_RETRIES: { value: '2', category: 'performance', type: 'number', label: 'CAPTCHA Max Retries' },
    DELAY_BETWEEN_CHECKS: { value: '0.05', category: 'performance', type: 'number', label: 'Delay Between Checks (sec)', description: 'Minimal delay (50ms)' },

    // === User Agent ===
    USER_AGENT: { value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', category: 'session', type: 'string', label: 'User Agent' },

    // === File Paths ===
    EXCEL_FILE: { value: 'Асилбекова Июнь тахрирлаш 20303 та.xlsx', category: 'files', type: 'string', label: 'Active Excel File' },
    ZIP_FILE: { value: 'АСИЛБЕКОВА.zip', category: 'files', type: 'string', label: 'ZIP Archive' },
    LOG_FILE: { value: 'automation.log', category: 'files', type: 'string', label: 'Log File' },
    CHECK_NUMBER_COLUMN: { value: 'receipt_id', category: 'files', type: 'string', label: 'Check Number Column', description: 'Column name for check numbers in Excel' },

    // === Data Configuration ===
    DEFAULT_VAT_TOTAL: { value: '0', category: 'data', type: 'number', label: 'Default VAT Total' },
    DEFAULT_CASH_TOTAL: { value: '0', category: 'data', type: 'number', label: 'Default Cash Total' },
    DEFAULT_CARD_TOTAL: { value: '0', category: 'data', type: 'string', label: 'Default Card Total' },
    DEFAULT_NAME_STATUS: { value: 'true', category: 'data', type: 'boolean', label: 'Default Name Status' },
    CLIENT_IP: { value: '127.0.0.1', category: 'data', type: 'string', label: 'Client IP' },

    // === Logging ===
    LOG_LEVEL: { value: 'INFO', category: 'logging', type: 'string', label: 'Log Level', description: 'DEBUG, INFO, WARNING, ERROR' },
    CONSOLE_OUTPUT: { value: 'true', category: 'logging', type: 'boolean', label: 'Console Output' },

    // === Batch Processing ===
    BATCH_SIZE: { value: '50', category: 'performance', type: 'number', label: 'Batch Size', description: 'Process 50 checks per batch (larger = faster)' },

    // === Gemini OCR Configuration ===
    OCR_ENGINE: { value: 'gemini', category: 'gemini', type: 'string', label: 'OCR Engine', description: 'paddle, tesseract, easyocr, gemini' },
    GEMINI_MODEL: { value: 'gemini-2.5-flash-lite', category: 'gemini', type: 'string', label: 'Gemini Model' },
    GEMINI_RPM_PER_KEY: { value: '14', category: 'gemini', type: 'number', label: 'RPM Per Key', description: '93% of 15 RPM limit (safe with dedicated keys)' },
    GEMINI_DELAY_BETWEEN_REQUESTS: { value: '3.0', category: 'gemini', type: 'number', label: 'Delay Between Requests (sec)' },
    GEMINI_BATCH_COOLDOWN: { value: '0.5', category: 'gemini', type: 'number', label: 'Batch Cooldown (sec)', description: 'Minimal cooldown with dedicated keys' },
    GEMINI_RATE_LIMIT_BACKOFF: { value: '15.0', category: 'gemini', type: 'number', label: 'Rate Limit Backoff (sec)' },
    GEMINI_MAX_IMAGES_PER_BATCH: { value: '20', category: 'gemini', type: 'number', label: 'Max Images Per Batch', description: 'Larger batches = fewer API calls = faster' },

    // === Performance / Workers ===
    MAX_WORKERS_FILE_UPLOAD: { value: '20', category: 'performance', type: 'number', label: 'Parallel File Uploads' },
    MAX_WORKERS_CHECK_SUBMIT: { value: '20', category: 'performance', type: 'number', label: 'Parallel Check Submissions' },
    CONNECTION_POOL_SIZE: { value: '20', category: 'performance', type: 'number', label: 'Connection Pool Size' },
    CONNECTION_POOL_MAXSIZE: { value: '20', category: 'performance', type: 'number', label: 'Connection Pool Max Size' },

    // === Server Error 9999 Retry Configuration ===
    SERVER_ERROR_MAX_RETRIES: { value: '5', category: 'limits', type: 'number', label: 'Server Error Max Retries' },
    SERVER_ERROR_BASE_DELAY: { value: '2.0', category: 'limits', type: 'number', label: 'Server Error Base Delay (sec)', description: 'Doubles each retry' },
    SERVER_ERROR_MAX_DELAY: { value: '30.0', category: 'limits', type: 'number', label: 'Server Error Max Delay (sec)' },

    // === Staggered Submission Delays ===
    SUBMISSION_STAGGER_DELAY: { value: '0.15', category: 'performance', type: 'number', label: 'Submission Stagger Delay (sec)', description: '150ms between submissions' },
    FILE_UPLOAD_STAGGER_DELAY: { value: '0.2', category: 'performance', type: 'number', label: 'File Upload Stagger Delay (sec)', description: '200ms between file uploads' },

    // === Automation Loop Settings ===
    LOOP_ENABLED: { value: 'true', category: 'automation', type: 'boolean', label: 'Enable Loop', description: 'Continuously process batches' },
    LOOP_INTERVAL: { value: '5', category: 'automation', type: 'number', label: 'Loop Interval (sec)', description: 'Seconds between batch runs' },
    SESSION_CHECK_INTERVAL: { value: '20', category: 'automation', type: 'number', label: 'Session Check Interval (min)', description: 'Check session validity' },
    AUTO_REFRESH_SESSION: { value: 'false', category: 'automation', type: 'boolean', label: 'Auto Refresh Session', description: 'Automatically refresh on 401' },
};

// Default session cookies from config.py
export const DEFAULT_SESSION_COOKIES = [
    { name: 'smart_top', value: '1' },
    { name: 'TICKET_SESSION_ID', value: '5CEB44E46FD740E781DE500004620BD9' },
    { name: 'ADRUM_BTa', value: 'R:26|g:855c33f0-65e0-4c7e-87a9-e4f8d86523a3|n:customer1_9c28b63e-99cb-4969-b91e-d0d7809dc215' },
    { name: 'ADRUM_BT1', value: 'R:26|i:2902|e:4|t:1765275801137' },
    { name: 'bearer_token', value: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJNeXNvbGlxLWF1dGhvcml6YXRpb24iLCJzdWIiOiJlNGU0MDFiYjlhYjVmZjg5MDE5YjAyOGVhMDcwNTcwZSIsImp0aSI6ImU0ZTQwMWJiOWFiNWZmODkwMTliMDI4ZWEwNzA1NzBlIiwiZXhwIjo0MTMyMDI5NjYwfQ.cpgI59iiKSi-Y-SIWI87s3bc1S7NaI1KDZqbUgJPMLU' },
];

// Default Gemini API keys from config.py  
export const DEFAULT_API_KEYS = [
    { service: 'gemini', key: 'AIzaSyBaUmjiYmm3KGj_T8__ECnebI7dj6JuA8s', label: 'Key #1 (Active)', isActive: true },
    { service: 'gemini', key: 'AIzaSyAY3Zs8ntokqZSuRHcfr7ZR4_bzD0FRCOs', label: 'Key #2 (Active)', isActive: true },
];

// Suspended keys (for reference)
export const SUSPENDED_API_KEYS = [
    'AIzaSyA8jloi7aW_PTe9mSkiJ_2iLerIB6zcs8g',
    'AIzaSyB8W_uVdIwlH-PfCXPj5Kf72qtSmNBDjwA',
    'AIzaSyDCsackDnm4-xV9_Q_TueDQf-5-D_POiSE',
    'AIzaSyDxz-wFUIr5wTW44KLnn0rcgoenTDGJqZI',
    'AIzaSyCLGo5MWju_AsXKisLxNdABxvlHlrgIeTA',
    'AIzaSyAA_itbg2vCpl8ySp3BvlH5PQt_M4iZjWc',
    'AIzaSyBRAzInfe8ITroFlbwegSlucoueOnuKdBY',
    'AIzaSyC8KivZmBjiXqGl3IsNqC-5_lqLpUsgCoM',
    'AIzaSyClTwSWw6hIvMPsBmhENa60q55sExtk2ho',
];

// Excel files list
export const EXCEL_FILES = [
    'Асилбекова Июнь тахрирлаш 20303 та.xlsx',
    'Асилбекова Июль тахрирлаш 46430 та.xlsx',
    'Асилбекова_Август_тахрирлаш_48606_та.xlsx',
    'Асилбекова_Сентябрь_тахрирлаш_42930.xlsx',
    'Асилбекова_Октябрь_тахрирлаш_14626_та.xlsx',
];
