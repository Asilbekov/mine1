import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch all API keys
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const service = searchParams.get('service');

        const where = service ? { service } : {};
        const keys = await prisma.apiKey.findMany({
            where,
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                service: true,
                key: true,
                label: true,
                isActive: true,
                isSuspended: true,
                usageCount: true,
                lastUsed: true,
                createdAt: true
            }
        });

        // Mask keys for security (show only last 6 chars)
        const maskedKeys = keys.map(k => ({
            ...k,
            key: '***' + k.key.slice(-6)
        }));

        return NextResponse.json({ success: true, data: maskedKeys });
    } catch (error) {
        console.error('Error fetching API keys:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch API keys' }, { status: 500 });
    }
}

// POST - Add new API key
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { service, key, label } = body;

        if (!service || !key) {
            return NextResponse.json({ success: false, error: 'Service and key are required' }, { status: 400 });
        }

        const apiKey = await prisma.apiKey.create({
            data: { service, key, label, isActive: true }
        });

        return NextResponse.json({
            success: true,
            data: { ...apiKey, key: '***' + apiKey.key.slice(-6) }
        });
    } catch (error) {
        console.error('Error adding API key:', error);
        return NextResponse.json({ success: false, error: 'Failed to add API key' }, { status: 500 });
    }
}

// PUT - Update API key
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, key, isActive, isSuspended, label } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (key !== undefined) updateData.key = key;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isSuspended !== undefined) updateData.isSuspended = isSuspended;
        if (label !== undefined) updateData.label = label;

        const apiKey = await prisma.apiKey.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            data: { ...apiKey, key: '***' + apiKey.key.slice(-6) }
        });
    } catch (error) {
        console.error('Error updating API key:', error);
        return NextResponse.json({ success: false, error: 'Failed to update API key' }, { status: 500 });
    }
}

// DELETE - Remove API key
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        await prisma.apiKey.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting API key:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete API key' }, { status: 500 });
    }
}
