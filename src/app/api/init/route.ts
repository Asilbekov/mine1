import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_CONFIG } from '@/lib/config-defaults';

// POST - Initialize default configuration
export async function POST() {
    try {
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

            // Also add default Gemini API keys
            const defaultGeminiKeys = [
                { service: 'gemini', key: 'AIzaSyBaUmjiYmm3KGj_T8__ECnebI7dj6JuA8s', label: 'Gemini Key #1' },
                { service: 'gemini', key: 'AIzaSyAY3Zs8ntokqZSuRHcfr7ZR4_bzD0FRCOs', label: 'Gemini Key #2' },
            ];

            await prisma.apiKey.createMany({ data: defaultGeminiKeys });

            // Add default session cookies
            const defaultCookies = [
                { name: 'smart_top', value: '1' },
                { name: 'TICKET_SESSION_ID', value: '5CEB44E46FD740E781DE500004620BD9' },
                { name: 'bearer_token', value: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJNeXNvbGlxLWF1dGhvcml6YXRpb24iLCJzdWIiOiJlNGU0MDFiYjlhYjVmZjg5MDE5YjAyOGVhMDcwNTcwZSIsImp0aSI6ImU0ZTQwMWJiOWFiNWZmODkwMTliMDI4ZWEwNzA1NzBlIiwiZXhwIjo0MTMyMDI5NjYwfQ.cpgI59iiKSi-Y-SIWI87s3bc1S7NaI1KDZqbUgJPMLU' },
            ];

            await prisma.sessionCookie.createMany({
                data: defaultCookies.map(c => ({ ...c, isActive: true }))
            });

            return NextResponse.json({
                success: true,
                message: 'Default configuration initialized',
                counts: {
                    configs: configs.length,
                    apiKeys: defaultGeminiKeys.length,
                    cookies: defaultCookies.length
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Configuration already exists',
            existingCount
        });
    } catch (error) {
        console.error('Error initializing config:', error);
        return NextResponse.json({ success: false, error: 'Failed to initialize config' }, { status: 500 });
    }
}
