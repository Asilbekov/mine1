
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, Info, Terminal } from 'lucide-react';

type LogEntry = {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
    message: string;
    source: string;
};

const MOCK_LOGS: LogEntry[] = [
    { id: '1', timestamp: '12:30:45', level: 'INFO', message: 'Worker #1 initialized and ready', source: 'System' },
    { id: '2', timestamp: '12:30:46', level: 'INFO', message: 'Connected to Neon DB instance', source: 'Database' },
    { id: '3', timestamp: '12:31:02', level: 'SUCCESS', message: 'Check #84920 processed successfully', source: 'Worker #1' },
    { id: '4', timestamp: '12:31:05', level: 'WARN', message: 'Response time high (1.2s)', source: 'Network' },
    { id: '5', timestamp: '12:31:10', level: 'INFO', message: 'Gemini AI processing image batch...', source: 'AI Service' },
    { id: '6', timestamp: '12:31:15', level: 'ERROR', message: 'Failed to upload attachment: Timeout', source: 'Worker #3' },
    { id: '7', timestamp: '12:31:16', level: 'INFO', message: 'Retrying upload (Attempt 2/3)', source: 'Worker #3' },
    { id: '8', timestamp: '12:32:00', level: 'SUCCESS', message: 'Batch #102 completed', source: 'Orchestrator' },
];

export function LogsViewer() {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    System Logs
                </CardTitle>
                <CardDescription>Real-time execution stream from Python workers</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[400px]">
                <div className="bg-black/80 backdrop-blur-md rounded-lg border border-white/10 p-4 font-mono text-xs h-full overflow-hidden flex flex-col shadow-inner">
                    <div className="flex justify-between items-center text-muted-foreground mb-2 pb-2 border-b border-white/10">
                        <span>Terminal Output</span>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Connected</span>
                        </div>
                    </div>
                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-1.5">
                            {MOCK_LOGS.map((log) => (
                                <div key={log.id} className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2 cursor-pointer transition-colors">
                                    <span className="text-zinc-500 shrink-0 select-none">[{log.timestamp}]</span>
                                    <Badge
                                        variant="outline"
                                        className={`
                                            h-5 text-[10px] px-1 uppercase shrink-0 w-16 justify-center border
                                            ${log.level === 'INFO' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : ''}
                                            ${log.level === 'WARN' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : ''}
                                            ${log.level === 'ERROR' ? 'text-red-400 border-red-500/30 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}
                                            ${log.level === 'SUCCESS' ? 'text-green-400 border-green-500/30 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : ''}
                                        `}
                                    >
                                        {log.level}
                                    </Badge>
                                    <span className="text-zinc-400 font-semibold shrink-0 w-24 truncate">[{log.source}]</span>
                                    <span className={`
                                        ${log.level === 'ERROR' ? 'text-red-300' : 'text-zinc-300'}
                                    `}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                            <div className="animate-pulse flex gap-3 px-2 mt-2">
                                <span className="text-zinc-600">_</span>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
