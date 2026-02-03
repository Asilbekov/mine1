"use server";

import prisma from './prisma';
import { DEFAULT_CONFIG } from './config-defaults';

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
        where: { id: name },
        update: { value, updatedAt: new Date() },
        create: { name, value, isActive: true }
    });
}

export async function bulkUpdateSessionCookies(cookies: { name: string; value: string }[]) {
    await prisma.sessionCookie.deleteMany({});
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
