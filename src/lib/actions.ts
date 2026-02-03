"use server";

import prisma from './prisma';

// ===== Configuration Actions =====

export async function getConfig(category?: string) {
    const where = category ? { category } : {};
    const configs = await prisma.projectConfig.findMany({ where, orderBy: { key: 'asc' } });
    return configs;
}

export async function updateConfig(key: string, value: string) {
    const config = await prisma.projectConfig.upsert({
        where: { key },
        update: { value, updatedAt: new Date() },
        create: { key, value, type: 'string', category: 'general' }
    });
    return config;
}

export async function bulkUpdateConfig(configs: { key: string; value: string; type?: string; category?: string; label?: string; description?: string }[]) {
    const results = await Promise.all(
        configs.map(c =>
            prisma.projectConfig.upsert({
                where: { key: c.key },
                update: { value: c.value, updatedAt: new Date() },
                create: {
                    key: c.key,
                    value: c.value,
                    type: c.type || 'string',
                    category: c.category || 'general',
                    label: c.label,
                    description: c.description
                }
            })
        )
    );
    return results;
}

// Default configuration values from config.py
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

export async function initializeDefaultConfig() {
    const existingCount = await prisma.projectConfig.count();
    if (existingCount === 0) {
        const configs = Object.entries(DEFAULT_CONFIG).map(([key, config]) => ({
            key,
            value: config.value,
            type: config.type,
            category: config.category,
            label: config.label,
            description: (config as any).description || null,
        }));
        await prisma.projectConfig.createMany({ data: configs });
        return true;
    }
    return false;
}

// ===== API Keys Actions =====

export async function getApiKeys(service?: string) {
    const where = service ? { service } : {};
    return prisma.apiKey.findMany({ where, orderBy: { createdAt: 'asc' } });
}

export async function addApiKey(service: string, key: string, label?: string) {
    return prisma.apiKey.create({
        data: { service, key, label, isActive: true }
    });
}

export async function updateApiKey(id: string, data: { key?: string; isActive?: boolean; isSuspended?: boolean }) {
    return prisma.apiKey.update({ where: { id }, data });
}

export async function deleteApiKey(id: string) {
    return prisma.apiKey.delete({ where: { id } });
}

// ===== Session Cookies Actions =====

export async function getSessionCookies() {
    return prisma.sessionCookie.findMany({ where: { isActive: true } });
}

export async function updateSessionCookie(name: string, value: string) {
    return prisma.sessionCookie.upsert({
        where: { id: name }, // Using name as a pseudo-unique for upsert
        update: { value, updatedAt: new Date() },
        create: { name, value, isActive: true }
    });
}

export async function bulkUpdateSessionCookies(cookies: { name: string; value: string }[]) {
    // First, delete all existing cookies
    await prisma.sessionCookie.deleteMany({});
    // Then create new ones
    return prisma.sessionCookie.createMany({
        data: cookies.map(c => ({ name: c.name, value: c.value, isActive: true }))
    });
}

// ===== Uploaded Files Actions =====

export async function getUploadedFiles() {
    return prisma.uploadedFile.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            originalName: true,
            type: true,
            size: true,
            mimeType: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            // Don't select data (bytes) to keep response small
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function uploadFile(
    name: string,
    originalName: string,
    type: string,
    size: number,
    mimeType: string,
    data: Buffer
) {
    return prisma.uploadedFile.create({
        data: {
            name,
            originalName,
            type,
            size,
            mimeType,
            data,
            isActive: true
        }
    });
}

export async function deleteFile(id: string) {
    return prisma.uploadedFile.update({
        where: { id },
        data: { isActive: false }
    });
}

export async function setActiveExcelFile(fileId: string) {
    const file = await prisma.uploadedFile.findUnique({ where: { id: fileId } });
    if (file) {
        await updateConfig('EXCEL_FILE', file.originalName);
        return true;
    }
    return false;
}

// ===== Logs Actions =====

export async function getLogs(limit = 100, level?: string) {
    const where = level ? { level } : {};
    return prisma.automationLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit
    });
}

export async function addLog(level: string, message: string, details?: any, checkId?: string, workerId?: string) {
    return prisma.automationLog.create({
        data: { level, message, details, checkId, workerId }
    });
}

export async function clearLogs() {
    return prisma.automationLog.deleteMany({});
}

// ===== Checks/Progress Actions =====

export async function getChecksStats() {
    const [total, completed, failed, pending, processing] = await Promise.all([
        prisma.check.count(),
        prisma.check.count({ where: { status: 'completed' } }),
        prisma.check.count({ where: { status: 'failed' } }),
        prisma.check.count({ where: { status: 'pending' } }),
        prisma.check.count({ where: { status: 'processing' } })
    ]);
    return { total, completed, failed, pending, processing };
}

export async function getRecentChecks(limit = 50) {
    return prisma.check.findMany({
        orderBy: { updatedAt: 'desc' },
        take: limit
    });
}

// ===== Worker Sessions Actions =====

export async function getWorkerSessions() {
    return prisma.workerSession.findMany({
        orderBy: { lastActive: 'desc' }
    });
}

export async function updateWorkerSession(workerId: string, data: {
    status?: string;
    currentFile?: string;
    processed?: number;
    successful?: number;
    failed?: number;
    startedAt?: Date;
}) {
    return prisma.workerSession.upsert({
        where: { workerId },
        update: { ...data, lastActive: new Date() },
        create: { workerId, status: 'idle', ...data }
    });
}
