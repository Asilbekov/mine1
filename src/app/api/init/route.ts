import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_CONFIG, DEFAULT_SESSION_COOKIES, DEFAULT_API_KEYS } from '@/lib/config-defaults';

// Demo check records for testing
const DEMO_CHECKS = [
    { receiptId: '1001', terminalId: 'EP000000000551', tin: '62409036610049', paymentDate: '01.01.2024' },
    { receiptId: '1002', terminalId: 'EP000000000551', tin: '62409036610049', paymentDate: '01.01.2024' },
    { receiptId: '1003', terminalId: 'EP000000000551', tin: '62409036610049', paymentDate: '01.01.2024' },
    { receiptId: '1004', terminalId: 'EP000000000551', tin: '62409036610049', paymentDate: '01.01.2024' },
    { receiptId: '1005', terminalId: 'EP000000000551', tin: '62409036610049', paymentDate: '01.01.2024' },
];

// POST - Initialize default configuration, cookies, API keys, and demo data
export async function POST() {
    try {
        const results = {
            config: { created: 0, skipped: 0 },
            cookies: { created: 0, skipped: 0 },
            keys: { created: 0, skipped: 0 },
            checks: { created: 0, skipped: 0 },
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

        // 4. Initialize Demo Checks (for testing)
        for (const check of DEMO_CHECKS) {
            const existing = await prisma.check.findFirst({
                where: { receiptId: check.receiptId }
            });
            if (!existing) {
                const paymentId = `${check.terminalId}${check.receiptId.padStart(16, '0')}`;
                await prisma.check.create({
                    data: {
                        receiptId: check.receiptId,
                        paymentId: paymentId,
                        terminalId: check.terminalId,
                        tin: check.tin,
                        paymentDate: check.paymentDate,
                        status: 'pending',
                    }
                });
                results.checks.created++;
            } else {
                results.checks.skipped++;
            }
        }

        // Add initialization log
        await prisma.automationLog.create({
            data: {
                level: 'INFO',
                message: `Database initialized: ${results.config.created} configs, ${results.cookies.created} cookies, ${results.keys.created} keys, ${results.checks.created} demo checks`,
            }
        });

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

// GET - Check if initialized
export async function GET() {
    try {
        const configCount = await prisma.projectConfig.count();
        const cookieCount = await prisma.sessionCookie.count();
        const keyCount = await prisma.apiKey.count();
        const checkCount = await prisma.check.count();

        return NextResponse.json({
            success: true,
            initialized: configCount > 0,
            counts: {
                config: configCount,
                cookies: cookieCount,
                keys: keyCount,
                checks: checkCount
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            initialized: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
