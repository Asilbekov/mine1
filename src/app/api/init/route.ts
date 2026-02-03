import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_CONFIG, DEFAULT_SESSION_COOKIES, DEFAULT_API_KEYS } from '@/lib/config-defaults';

// POST - Initialize default configuration, cookies, and API keys
export async function POST() {
    try {
        const results = {
            config: { created: 0, skipped: 0 },
            cookies: { created: 0, skipped: 0 },
            keys: { created: 0, skipped: 0 },
        };

        // 1. Initialize ProjectConfig
        for (const [key, config] of Object.entries(DEFAULT_CONFIG)) {
            const existing = await prisma.projectConfig.findUnique({ where: { key } });
            if (!existing) {
                await prisma.projectConfig.create({
                    data: {
                        key,
                        value: config.value,
                        type: config.type,
                        category: config.category,
                        label: config.label,
                        description: config.description || null,
                    }
                });
                results.config.created++;
            } else {
                results.config.skipped++;
            }
        }

        // 2. Initialize Session Cookies
        for (const cookie of DEFAULT_SESSION_COOKIES) {
            const existing = await prisma.sessionCookie.findFirst({
                where: { name: cookie.name }
            });
            if (!existing) {
                await prisma.sessionCookie.create({
                    data: {
                        name: cookie.name,
                        value: cookie.value,
                        isActive: true,
                    }
                });
                results.cookies.created++;
            } else {
                results.cookies.skipped++;
            }
        }

        // 3. Initialize API Keys
        for (const keyData of DEFAULT_API_KEYS) {
            const existing = await prisma.apiKey.findFirst({
                where: { key: keyData.key }
            });
            if (!existing) {
                await prisma.apiKey.create({
                    data: {
                        service: keyData.service,
                        key: keyData.key,
                        label: keyData.label,
                        isActive: keyData.isActive,
                        isSuspended: false,
                    }
                });
                results.keys.created++;
            } else {
                results.keys.skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Database initialized with defaults from config.py',
            results
        });

    } catch (error) {
        console.error('Init error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
