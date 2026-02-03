
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, CreditCard, RefreshCw, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

type Stats = {
    overview: {
        totalChecks: number;
        completedChecks: number;
        failedChecks: number;
        pendingChecks: number;
        processingChecks: number;
        captchaErrors: number;
        successRate: number;
        totalFiles: number;
        activeApiKeys: number;
        activeWorkers: number;
        totalWorkers: number;
    };
    workers: Array<{
        workerId: string;
        status: string;
        processed: number;
        successful: number;
        failed: number;
        currentFile?: string;
        lastActive: string;
    }>;
    recentLogs: Array<{
        id: string;
        level: string;
        message: string;
        timestamp: string;
    }>;
};

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

export function AnalyticsDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(fetchStats, 10000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const initializeAndFetch = async () => {
        try {
            // First try to initialize defaults
            await fetch('/api/init', { method: 'POST' });
            // Then fetch stats
            await fetchStats();
        } catch (error) {
            console.error('Error initializing:', error);
        }
    };

    // Default/demo data when no stats available
    const overview = stats?.overview || {
        totalChecks: 0,
        completedChecks: 0,
        failedChecks: 0,
        pendingChecks: 0,
        processingChecks: 0,
        captchaErrors: 0,
        successRate: 0,
        totalFiles: 0,
        activeApiKeys: 0,
        activeWorkers: 0,
        totalWorkers: 0
    };

    const pieData = [
        { name: 'Completed', value: overview.completedChecks || 0 },
        { name: 'Failed', value: overview.failedChecks || 0 },
        { name: 'Pending', value: overview.pendingChecks || 0 },
        { name: 'Processing', value: overview.processingChecks || 0 },
    ].filter(d => d.value > 0);

    // Sample chart data (would come from daily stats in real implementation)
    const chartData = [
        { name: 'Mon', success: overview.completedChecks > 0 ? Math.floor(overview.completedChecks * 0.14) : 0, failed: overview.failedChecks > 0 ? Math.floor(overview.failedChecks * 0.1) : 0 },
        { name: 'Tue', success: overview.completedChecks > 0 ? Math.floor(overview.completedChecks * 0.12) : 0, failed: overview.failedChecks > 0 ? Math.floor(overview.failedChecks * 0.15) : 0 },
        { name: 'Wed', success: overview.completedChecks > 0 ? Math.floor(overview.completedChecks * 0.18) : 0, failed: overview.failedChecks > 0 ? Math.floor(overview.failedChecks * 0.2) : 0 },
        { name: 'Thu', success: overview.completedChecks > 0 ? Math.floor(overview.completedChecks * 0.15) : 0, failed: overview.failedChecks > 0 ? Math.floor(overview.failedChecks * 0.12) : 0 },
        { name: 'Fri', success: overview.completedChecks > 0 ? Math.floor(overview.completedChecks * 0.16) : 0, failed: overview.failedChecks > 0 ? Math.floor(overview.failedChecks * 0.18) : 0 },
        { name: 'Sat', success: overview.completedChecks > 0 ? Math.floor(overview.completedChecks * 0.13) : 0, failed: overview.failedChecks > 0 ? Math.floor(overview.failedChecks * 0.15) : 0 },
        { name: 'Sun', success: overview.completedChecks > 0 ? Math.floor(overview.completedChecks * 0.12) : 0, failed: overview.failedChecks > 0 ? Math.floor(overview.failedChecks * 0.1) : 0 },
    ];

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-end gap-2">
                <Button
                    variant={autoRefresh ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                    {autoRefresh ? 'Auto-refreshing' : 'Auto-refresh'}
                </Button>
                <Button variant="outline" size="sm" onClick={fetchStats} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={initializeAndFetch}>
                    Initialize Database
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Checks Processed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{overview.completedChecks.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            of {overview.totalChecks.toLocaleString()} total
                        </p>
                        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                                style={{ width: `${overview.totalChecks > 0 ? (overview.completedChecks / overview.totalChecks) * 100 : 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{overview.activeWorkers}</div>
                        <p className="text-xs text-muted-foreground">
                            of {overview.totalWorkers} total workers
                        </p>
                        <div className="mt-2 flex gap-1">
                            {Array.from({ length: Math.max(overview.totalWorkers, 4) }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 flex-1 rounded ${i < overview.activeWorkers ? 'bg-blue-500' : 'bg-white/10'}`}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CreditCard className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{overview.successRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {overview.failedChecks} failed, {overview.captchaErrors} CAPTCHA errors
                        </p>
                        <div className="mt-2">
                            <Badge variant={overview.successRate >= 95 ? 'default' : overview.successRate >= 80 ? 'secondary' : 'destructive'}>
                                {overview.successRate >= 95 ? 'Excellent' : overview.successRate >= 80 ? 'Good' : 'Needs Attention'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Queue</CardTitle>
                        <Clock className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{overview.pendingChecks.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {overview.processingChecks} currently processing
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline">{overview.totalFiles} files</Badge>
                            <Badge variant="outline">{overview.activeApiKeys} API keys</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                <Card className="col-span-1 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Processing Volume</CardTitle>
                        <CardDescription>Daily check processing throughput (Success vs Failure)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {overview.totalChecks === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <Loader2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                    <p>No processing data yet</p>
                                    <p className="text-sm">Start automation to see charts</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(20, 20, 30, 0.9)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '12px', color: '#fff' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Area type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" />
                                    <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Check Status Distribution</CardTitle>
                        <CardDescription>Current status breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {pieData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <Loader2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                    <p>No checks in database</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(20, 20, 30, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Workers Status */}
            {stats?.workers && stats.workers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Worker Sessions</CardTitle>
                        <CardDescription>Active automation workers and their status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.workers.map(worker => (
                                <div
                                    key={worker.workerId}
                                    className={`p-4 rounded-lg border ${worker.status === 'running'
                                        ? 'bg-green-500/10 border-green-500/20'
                                        : worker.status === 'error'
                                            ? 'bg-red-500/10 border-red-500/20'
                                            : 'bg-white/5 border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{worker.workerId}</span>
                                        <Badge variant={worker.status === 'running' ? 'default' : 'secondary'}>
                                            {worker.status}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>Processed: {worker.processed}</p>
                                        <p>Success: {worker.successful} | Failed: {worker.failed}</p>
                                        {worker.currentFile && <p className="truncate">File: {worker.currentFile}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
