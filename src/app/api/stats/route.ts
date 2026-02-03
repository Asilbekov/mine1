import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch statistics
export async function GET() {
    try {
        const [
            totalChecks,
            completedChecks,
            failedChecks,
            pendingChecks,
            processingChecks,
            captchaErrors,
            totalFiles,
            activeApiKeys,
            recentLogs
        ] = await Promise.all([
            prisma.check.count(),
            prisma.check.count({ where: { status: 'completed' } }),
            prisma.check.count({ where: { status: 'failed' } }),
            prisma.check.count({ where: { status: 'pending' } }),
            prisma.check.count({ where: { status: 'processing' } }),
            prisma.check.count({ where: { status: 'captcha_error' } }),
            prisma.uploadedFile.count({ where: { isActive: true } }),
            prisma.apiKey.count({ where: { isActive: true, isSuspended: false } }),
            prisma.automationLog.findMany({ orderBy: { timestamp: 'desc' }, take: 10 })
        ]);

        // Get worker sessions
        const workers = await prisma.workerSession.findMany({
            orderBy: { lastActive: 'desc' }
        });

        const activeWorkers = workers.filter(w => w.status === 'running').length;

        // Calculate success rate
        const successRate = totalChecks > 0
            ? ((completedChecks / totalChecks) * 100).toFixed(1)
            : '0.0';

        // Get daily stats for chart (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyStats = await prisma.check.groupBy({
            by: ['status'],
            where: {
                updatedAt: { gte: sevenDaysAgo }
            },
            _count: true
        });

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    totalChecks,
                    completedChecks,
                    failedChecks,
                    pendingChecks,
                    processingChecks,
                    captchaErrors,
                    successRate: parseFloat(successRate),
                    totalFiles,
                    activeApiKeys,
                    activeWorkers,
                    totalWorkers: workers.length
                },
                workers,
                recentLogs,
                dailyStats
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
