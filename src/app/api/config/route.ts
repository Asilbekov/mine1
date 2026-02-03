import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch all configurations
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        const where = category ? { category } : {};
        const configs = await prisma.projectConfig.findMany({
            where,
            orderBy: { key: 'asc' }
        });

        return NextResponse.json({ success: true, data: configs });
    } catch (error) {
        console.error('Error fetching configs:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch configs' }, { status: 500 });
    }
}

// POST - Update or create configuration
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (Array.isArray(body)) {
            // Bulk update
            const results = await Promise.all(
                body.map((c: any) =>
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
            return NextResponse.json({ success: true, data: results });
        } else {
            // Single update
            const config = await prisma.projectConfig.upsert({
                where: { key: body.key },
                update: { value: body.value, updatedAt: new Date() },
                create: {
                    key: body.key,
                    value: body.value,
                    type: body.type || 'string',
                    category: body.category || 'general',
                    label: body.label,
                    description: body.description
                }
            });
            return NextResponse.json({ success: true, data: config });
        }
    } catch (error) {
        console.error('Error updating config:', error);
        return NextResponse.json({ success: false, error: 'Failed to update config' }, { status: 500 });
    }
}
