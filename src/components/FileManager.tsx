
"use client";

import React, { useState, useRef } from 'react';
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
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type UploadedFile = {
    id: string;
    name: string;
    size: string;
    type: 'excel' | 'zip';
    status: 'uploading' | 'complete' | 'error';
    progress: number;
};

export function FileManager() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                id: Math.random().toString(36).substring(7),
                name: file.name,
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                type: file.name.endsWith('.zip') ? 'zip' : 'excel' as 'excel' | 'zip',
                status: 'uploading' as const,
                progress: 0
            }));

            setFiles(prev => [...prev, ...newFiles]);

            // Simulate upload progress
            newFiles.forEach(file => {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    setFiles(prev => prev.map(f => {
                        if (f.id === file.id) {
                            if (progress >= 100) {
                                clearInterval(interval);
                                return { ...f, status: 'complete', progress: 100 };
                            }
                            return { ...f, progress };
                        }
                        return f;
                    }));
                }, 500);
            });
        }
    };

    const handleDelete = (id: string) => {
        setFiles(files.filter(f => f.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Zone */}
                <Card className="border-2 border-dashed border-muted hover:border-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <CardContent className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <UploadCloud className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Drop files here or click to upload</h3>
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
                        <Button variant="secondary">Select Files</Button>
                    </CardContent>
                </Card>

                {/* File List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Project Files</CardTitle>
                        <CardDescription>Manage your automation assets</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
                        <AnimatePresence>
                            {files.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No files uploaded yet.
                                </div>
                            )}
                            {files.map(file => (
                                <motion.div
                                    key={file.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-4 p-3 bg-accent/20 rounded-lg border"
                                >
                                    <div className={`p-2 rounded-md ${file.type === 'excel' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                        {file.type === 'excel' ? <FileSpreadsheet className="h-5 w-5" /> : <FileArchive className="h-5 w-5" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between mb-1">
                                            <p className="font-medium text-sm truncate">{file.name}</p>
                                            <span className="text-xs text-muted-foreground">{file.size}</span>
                                        </div>

                                        {file.status === 'uploading' ? (
                                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-300"
                                                    style={{ width: `${file.progress}%` }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-xs text-green-500">
                                                <CheckCircle2 className="h-3 w-3" /> Ready
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(file.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20 flex gap-3 text-blue-500 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>
                    Files uploaded here will be available to all automation workers.
                    Ensure Excel files follow the standard "receipt_id" column format.
                </p>
            </div>
        </div>
    );
}
