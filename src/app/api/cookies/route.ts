import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch session cookies
export async function GET() {
    try {
        const cookies = await prisma.sessionCookie.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        // Mask values for security
        const maskedCookies = cookies.map(c => ({
            ...c,
            value: c.value.length > 20 ? c.value.substring(0, 20) + '...' : c.value
        }));

        return NextResponse.json({ success: true, data: maskedCookies });
    } catch (error) {
        console.error('Error fetching cookies:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch cookies' }, { status: 500 });
    }
}

// POST - Update session cookies (bulk)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { cookies } = body;

        if (!Array.isArray(cookies)) {
            return NextResponse.json({ success: false, error: 'Cookies array is required' }, { status: 400 });
        }

        // Delete all existing and create new ones
        await prisma.sessionCookie.deleteMany({});

        if (cookies.length > 0) {
            await prisma.sessionCookie.createMany({
                data: cookies.map((c: any) => ({
                    name: c.name,
                    value: c.value,
                    isActive: true
                }))
            });
        }

        return NextResponse.json({ success: true, message: 'Cookies updated successfully' });
    } catch (error) {
        console.error('Error updating cookies:', error);
        return NextResponse.json({ success: false, error: 'Failed to update cookies' }, { status: 500 });
    }
}
