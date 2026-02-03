
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';

type LogEntry = {
    id: string;
    timestamp: string;
    level: string;
    message: string;
    checkId?: string;
    workerId?: string;
    details?: any;
};

const LOG_LEVELS = ['ALL', 'INFO', 'WARNING', 'ERROR', 'DEBUG'];

export function LogsViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [autoRefresh, setAutoRefresh] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(fetchLogs, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, filter]);

    const fetchLogs = async () => {
        try {
            const levelParam = filter !== 'ALL' ? `&level=${filter}` : '';
            const response = await fetch(`/api/logs?limit=200${levelParam}`);
            const data = await response.json();
            if (data.success) {
                setLogs(data.data);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearLogs = async () => {
        if (!confirm('Are you sure you want to clear all logs?')) return;
        try {
            await fetch('/api/logs', { method: 'DELETE' });
            setLogs([]);
        } catch (error) {
            console.error('Error clearing logs:', error);
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level.toUpperCase()) {
            case 'INFO': return <Info className="h-4 w-4 text-blue-400" />;
            case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
            case 'ERROR': return <XCircle className="h-4 w-4 text-red-400" />;
            case 'DEBUG': return <CheckCircle2 className="h-4 w-4 text-gray-400" />;
            default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getLevelColor = (level: string) => {
        switch (level.toUpperCase()) {
            case 'INFO': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'WARNING': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'ERROR': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'DEBUG': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            default: return 'bg-white/5 text-muted-foreground border-white/10';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // If no logs from API, show demo data
    const displayLogs = logs.length > 0 ? logs : [
        { id: '1', timestamp: new Date().toISOString(), level: 'INFO', message: 'No logs yet. Start automation to see activity.' },
    ];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Automation Logs</CardTitle>
                    <CardDescription>Real-time system activity and check processing logs</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        {LOG_LEVELS.map(level => (
                            <Button
                                key={level}
                                variant={filter === level ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilter(level)}
                                className="text-xs"
                            >
                                {level}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant={autoRefresh ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                        Auto
                    </Button>
                    <Button variant="ghost" size="icon" onClick={fetchLogs} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={clearLogs} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[500px] rounded-lg border border-white/10 bg-black/20 p-4 font-mono text-sm">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading logs...
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {displayLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`flex items-start gap-3 p-2 rounded-md border ${getLevelColor(log.level)} transition-all hover:brightness-110`}
                                >
                                    {getLevelIcon(log.level)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                                            <Badge variant="outline" className="text-[10px] uppercase">{log.level}</Badge>
                                            {log.workerId && (
                                                <Badge variant="secondary" className="text-[10px]">Worker {log.workerId}</Badge>
                                            )}
                                            {log.checkId && (
                                                <Badge variant="secondary" className="text-[10px]">Check {log.checkId}</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm break-words">{log.message}</p>
                                        {log.details && (
                                            <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Showing {displayLogs.length} log entries</span>
                    {autoRefresh && <span className="text-green-500">● Auto-refreshing every 5s</span>}
                </div>
            </CardContent>
        </Card>
    );
}
