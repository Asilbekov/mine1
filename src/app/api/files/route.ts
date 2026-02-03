import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch uploaded files
export async function GET() {
    try {
        const files = await prisma.uploadedFile.findMany({
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

        return NextResponse.json({ success: true, data: files });
    } catch (error) {
        console.error('Error fetching files:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch files' }, { status: 500 });
    }
}

// POST - Upload new file
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const type = file.name.endsWith('.zip') ? 'zip' : 'excel';
        const name = `${Date.now()}_${file.name}`;

        const uploadedFile = await prisma.uploadedFile.create({
            data: {
                name,
                originalName: file.name,
                type,
                size: file.size,
                mimeType: file.type,
                data: buffer,
                isActive: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                id: uploadedFile.id,
                name: uploadedFile.name,
                originalName: uploadedFile.originalName,
                type: uploadedFile.type,
                size: uploadedFile.size,
                createdAt: uploadedFile.createdAt
            }
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
    }
}

// DELETE - Delete file (soft delete)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        await prisma.uploadedFile.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 500 });
    }
}
