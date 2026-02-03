import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch current automation status
export async function GET() {
    try {
        const [pending, processing, completed, failed, total] = await Promise.all([
            prisma.check.count({ where: { status: 'pending' } }),
            prisma.check.count({ where: { status: 'processing' } }),
            prisma.check.count({ where: { status: 'completed' } }),
            prisma.check.count({ where: { status: 'failed' } }),
            prisma.check.count(),
        ]);

        const recentLogs = await prisma.automationLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 5,
        });

        return NextResponse.json({
            success: true,
            status: {
                pending,
                processing,
                completed,
                failed,
                total,
            },
            recentLogs,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper to get config value
async function getConfig(key: string, defaultValue: string = ''): Promise<string> {
    const config = await prisma.projectConfig.findUnique({ where: { key } });
    return config?.value || defaultValue;
}

// Helper to add log
async function addLog(level: string, message: string, checkId?: string) {
    await prisma.automationLog.create({
        data: {
            level,
            message,
            checkId,
        }
    });
}

// POST - Run automation batch (TypeScript version)
export async function POST() {
    try {
        // Check if initialized
        const configCount = await prisma.projectConfig.count();
        if (configCount === 0) {
            return NextResponse.json({
                success: false,
                error: 'Not initialized. Click "Initialize Defaults" first.',
                needsInit: true,
            });
        }

        // Get API keys
        const apiKeys = await prisma.apiKey.findMany({
            where: { service: 'gemini', isActive: true, isSuspended: false }
        });

        if (apiKeys.length === 0) {
            await addLog('ERROR', 'No Gemini API keys available');
            return NextResponse.json({
                success: false,
                error: 'No Gemini API keys configured',
            });
        }

        // Get session cookies
        const cookies = await prisma.sessionCookie.findMany({ where: { isActive: true } });
        const bearerToken = cookies.find(c => c.name === 'bearer_token')?.value;

        if (!bearerToken) {
            await addLog('ERROR', 'No bearer token found in session cookies');
            return NextResponse.json({
                success: false,
                error: 'No bearer token. Add session cookies first.',
            });
        }

        // Get pending checks (batch of 10 for serverless timeout limits)
        const pendingChecks = await prisma.check.findMany({
            where: { status: 'pending' },
            take: 10,
            orderBy: { createdAt: 'asc' },
        });

        if (pendingChecks.length === 0) {
            await addLog('INFO', 'No pending checks to process');
            return NextResponse.json({
                success: true,
                message: 'No pending checks',
                processed: 0,
            });
        }

        await addLog('INFO', `Starting batch: ${pendingChecks.length} checks`);

        // Get config values
        const baseUrl = await getConfig('BASE_URL', 'https://my3.soliq.uz');
        const captchaUrl = await getConfig('CAPTCHA_URL', '/api/cashregister-edit-api/home/get-captcha');
        const submitUrl = await getConfig('SUBMIT_URL', '/api/cashregister-edit-api/check-edit/set-payment');
        const defaultTin = await getConfig('DEFAULT_TIN', '62409036610049');
        const geminiModel = await getConfig('GEMINI_MODEL', 'gemini-2.0-flash');

        // Cookie string for requests
        const cookieString = cookies
            .filter(c => c.name !== 'bearer_token')
            .map(c => `${c.name}=${c.value}`)
            .join('; ');

        // Authorization header
        const authHeader = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;

        let processed = 0;
        let successful = 0;
        let failed = 0;
        let sessionExpired = false;

        // Process each check
        for (const check of pendingChecks) {
            if (sessionExpired) break;

            try {
                // Mark as processing
                await prisma.check.update({
                    where: { id: check.id },
                    data: { status: 'processing' }
                });

                // Step 1: Fetch CAPTCHA
                const captchaResponse = await fetch(`${baseUrl}${captchaUrl}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': authHeader,
                        'Cookie': cookieString,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                });

                if (captchaResponse.status === 401) {
                    sessionExpired = true;
                    await addLog('ERROR', 'Session expired (401)', check.id);
                    await prisma.check.update({
                        where: { id: check.id },
                        data: { status: 'pending', error: 'Session expired' }
                    });
                    break;
                }

                if (!captchaResponse.ok) {
                    throw new Error(`CAPTCHA fetch failed: ${captchaResponse.status}`);
                }

                const captchaData = await captchaResponse.json();
                if (!captchaData.success || !captchaData.data) {
                    throw new Error('Invalid CAPTCHA response');
                }

                const captchaId = captchaData.data.id;
                const captchaImage = captchaData.data.image;

                // Step 2: Solve CAPTCHA with Gemini
                const apiKey = apiKeys[processed % apiKeys.length].key;
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

                const geminiResponse = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: "Read the CAPTCHA text in this image. Return ONLY the characters/numbers you see, nothing else." },
                                { inline_data: { mime_type: "image/png", data: captchaImage } }
                            ]
                        }],
                        generationConfig: { temperature: 0.1, maxOutputTokens: 50 }
                    }),
                });

                if (!geminiResponse.ok) {
                    if (geminiResponse.status === 429) {
                        await addLog('WARNING', `Rate limited on key, skipping check`, check.id);
                        await prisma.check.update({
                            where: { id: check.id },
                            data: { status: 'pending' }
                        });
                        continue;
                    }
                    throw new Error(`Gemini API error: ${geminiResponse.status}`);
                }

                const geminiData = await geminiResponse.json();
                const captchaValue = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

                if (!captchaValue) {
                    throw new Error('Failed to solve CAPTCHA');
                }

                await addLog('INFO', `CAPTCHA solved: ${captchaValue}`, check.id);

                // Step 3: Submit check
                const paymentId = check.paymentId;
                const submitPayload = {
                    paymentId,
                    vatTotal: 0,
                    cashTotal: 0,
                    cardTotal: "0",
                    attachedFile: "",
                    captchaId,
                    captchaValue,
                    cardType: "",
                    nameStatus: true,
                    clientIp: "127.0.0.1",
                    paymentDetails: [{
                        id: `${paymentId}-0`,
                        paymentId,
                        tin: check.tin || defaultTin,
                        pinfl: null,
                        name: `${check.receiptId}-check edit`,
                        price: 0,
                        vat: "0",
                        amount: 0,
                        discount: 0,
                        other: 0,
                        barCode: null,
                        label: null,
                        productCode: "10701001018000000",
                        unitCode: null,
                        unitName: null,
                        vatPercent: "0",
                        commissionTin: defaultTin,
                        commissionPinfl: null,
                        packageCode: "1495029",
                        paymentDate: check.paymentDate,
                        terminalId: null,
                        year: null,
                        month: null,
                        day: null,
                        terminalStateId: null,
                        isRefund: null,
                        existsCommission: null,
                        vaucher: 0,
                        isNotLabel: null
                    }],
                    tin: check.tin || defaultTin,
                    terminalId: check.terminalId,
                    paymentDate: check.paymentDate
                };

                const submitResponse = await fetch(`${baseUrl}${submitUrl}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': authHeader,
                        'Cookie': cookieString,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                    body: JSON.stringify(submitPayload),
                });

                if (submitResponse.status === 401) {
                    sessionExpired = true;
                    await addLog('ERROR', 'Session expired on submit (401)', check.id);
                    await prisma.check.update({
                        where: { id: check.id },
                        data: { status: 'pending', error: 'Session expired' }
                    });
                    break;
                }

                const submitData = await submitResponse.json();

                if (submitData.success) {
                    await prisma.check.update({
                        where: { id: check.id },
                        data: {
                            status: 'completed',
                            resultData: submitData,
                        }
                    });
                    await addLog('INFO', `Check ${check.receiptId} completed successfully`, check.id);
                    successful++;
                } else {
                    const errorCode = submitData.code;
                    const errorMsg = submitData.message || 'Unknown error';

                    if (errorCode === 9999) {
                        // Server error - can retry
                        await prisma.check.update({
                            where: { id: check.id },
                            data: { status: 'pending', error: `9999: ${errorMsg}` }
                        });
                        await addLog('WARNING', `Server error 9999, will retry: ${check.receiptId}`, check.id);
                    } else if (errorCode === -1002 || errorCode === 9098) {
                        // CAPTCHA error - retry
                        await prisma.check.update({
                            where: { id: check.id },
                            data: { status: 'pending', error: `CAPTCHA error: ${errorMsg}` }
                        });
                        await addLog('WARNING', `CAPTCHA error, will retry: ${check.receiptId}`, check.id);
                    } else if (errorCode === 9099) {
                        // Already submitted - mark as complete
                        await prisma.check.update({
                            where: { id: check.id },
                            data: { status: 'completed', error: 'Already submitted' }
                        });
                        await addLog('INFO', `Check ${check.receiptId} already submitted`, check.id);
                        successful++;
                    } else {
                        await prisma.check.update({
                            where: { id: check.id },
                            data: {
                                status: 'failed',
                                error: `${errorCode}: ${errorMsg}`,
                                resultData: submitData,
                            }
                        });
                        await addLog('ERROR', `Check ${check.receiptId} failed: ${errorCode}`, check.id);
                        failed++;
                    }
                }

                processed++;

                // Small delay between checks
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                await prisma.check.update({
                    where: { id: check.id },
                    data: { status: 'pending', error: errorMsg }
                });
                await addLog('ERROR', `Error processing ${check.receiptId}: ${errorMsg}`, check.id);
                processed++;
            }
        }

        await addLog('INFO', `Batch complete: ${successful}/${processed} successful, ${failed} failed`);

        return NextResponse.json({
            success: true,
            processed,
            successful,
            failed,
            sessionExpired,
        });

    } catch (error) {
        console.error('Automation error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
