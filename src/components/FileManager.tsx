
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    UploadCloud,
    FileSpreadsheet,
    FileArchive,
    Trash2,
    CheckCircle2,
    Loader2,
    AlertCircle,
    RefreshCw,
    Star,
    StarOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type UploadedFile = {
    id: string;
    name: string;
    originalName: string;
    size: number;
    type: 'excel' | 'zip';
    status: 'uploading' | 'complete' | 'error';
    progress: number;
    createdAt?: string;
    isActive?: boolean;
};

export function FileManager() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeExcelFile, setActiveExcelFile] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch files from API on mount
    useEffect(() => {
        fetchFiles();
        fetchActiveFile();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await fetch('/api/files');
            const data = await response.json();
            if (data.success) {
                setFiles(data.data.map((f: any) => ({
                    ...f,
                    status: 'complete',
                    progress: 100
                })));
            }
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActiveFile = async () => {
        try {
            const response = await fetch('/api/config?category=files');
            const data = await response.json();
            if (data.success) {
                const excelConfig = data.data.find((c: any) => c.key === 'EXCEL_FILE');
                if (excelConfig) {
                    setActiveExcelFile(excelConfig.value);
                }
            }
        } catch (error) {
            console.error('Error fetching active file:', error);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);

            for (const file of selectedFiles) {
                const tempId = Math.random().toString(36).substring(7);
                const newFile: UploadedFile = {
                    id: tempId,
                    name: file.name,
                    originalName: file.name,
                    size: file.size,
                    type: file.name.endsWith('.zip') ? 'zip' : 'excel',
                    status: 'uploading',
                    progress: 0
                };

                setFiles(prev => [...prev, newFile]);

                // Upload to API
                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    // Simulate progress
                    const progressInterval = setInterval(() => {
                        setFiles(prev => prev.map(f => {
                            if (f.id === tempId && f.progress < 90) {
                                return { ...f, progress: f.progress + 10 };
                            }
                            return f;
                        }));
                    }, 200);

                    const response = await fetch('/api/files', {
                        method: 'POST',
                        body: formData
                    });

                    clearInterval(progressInterval);

                    const data = await response.json();

                    if (data.success) {
                        setFiles(prev => prev.map(f => {
                            if (f.id === tempId) {
                                return {
                                    ...data.data,
                                    status: 'complete',
                                    progress: 100
                                };
                            }
                            return f;
                        }));
                    } else {
                        setFiles(prev => prev.map(f => {
                            if (f.id === tempId) {
                                return { ...f, status: 'error', progress: 0 };
                            }
                            return f;
                        }));
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    setFiles(prev => prev.map(f => {
                        if (f.id === tempId) {
                            return { ...f, status: 'error', progress: 0 };
                        }
                        return f;
                    }));
                }
            }
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/files?id=${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                setFiles(files.filter(f => f.id !== id));
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleSetActive = async (file: UploadedFile) => {
        if (file.type !== 'excel') return;

        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'EXCEL_FILE',
                    value: file.originalName,
                    type: 'string',
                    category: 'files'
                })
            });

            if (response.ok) {
                setActiveExcelFile(file.originalName);
            }
        } catch (error) {
            console.error('Error setting active file:', error);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Zone */}
                <Card className="border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all duration-300 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                    <CardContent className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                        <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_-5px_rgba(124,58,237,0.3)]">
                            <UploadCloud className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">Drop files here or click to upload</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Support for Excel (.xlsx) and Archives (.zip)
                            </p>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            multiple
                            accept=".xlsx,.xls,.zip"
                            onChange={handleFileSelect}
                        />
                        <Button variant="secondary" className="group-hover:bg-primary group-hover:text-white transition-colors" onClick={(e: React.MouseEvent) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Select Files</Button>
                    </CardContent>
                </Card>

                {/* File List */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Project Files</CardTitle>
                            <CardDescription>Manage your automation assets</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={fetchFiles} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
                        <AnimatePresence>
                            {isLoading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    Loading files...
                                </div>
                            ) : files.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No files uploaded yet.
                                </div>
                            ) : files.map(file => (
                                <motion.div
                                    key={file.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg border transition-colors group ${activeExcelFile === file.originalName ? 'border-primary/50 bg-primary/5' : 'border-white/5'}`}
                                >
                                    <div className={`p-2 rounded-md ${file.type === 'excel' ? 'bg-green-500/10 text-green-400 shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]' : 'bg-yellow-500/10 text-yellow-400 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]'}`}>
                                        {file.type === 'excel' ? <FileSpreadsheet className="h-5 w-5" /> : <FileArchive className="h-5 w-5" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-medium text-sm truncate text-foreground/90">{file.originalName}</p>
                                            <div className="flex items-center gap-2">
                                                {activeExcelFile === file.originalName && (
                                                    <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">Active</Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                                            </div>
                                        </div>

                                        {file.status === 'uploading' ? (
                                            <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                                                    style={{ width: `${file.progress}%` }}
                                                />
                                            </div>
                                        ) : file.status === 'error' ? (
                                            <div className="flex items-center gap-1 text-xs text-red-500">
                                                <AlertCircle className="h-3 w-3" /> Upload failed
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-xs text-green-500">
                                                <CheckCircle2 className="h-3 w-3" /> Ready
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {file.type === 'excel' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${activeExcelFile === file.originalName ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSetActive(file);
                                                }}
                                                title="Set as active Excel file"
                                            >
                                                {activeExcelFile === file.originalName ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(file.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20 flex gap-3 text-blue-500 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>
                    Files uploaded here are stored in the cloud database and available to all automation workers.
                    Click the star icon to set an Excel file as the active source for processing.
                </p>
            </div>
        </div>
    );
}
