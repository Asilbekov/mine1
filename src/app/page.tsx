"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogicEditor } from "@/components/LogicEditor";
import { FileManager } from "@/components/FileManager";
import { LogsViewer } from "@/components/LogsViewer";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CookieHelper } from "@/components/CookieHelper";
import {
    Activity,
    Bot,
    Settings,
    Cpu,
    Play,
    Pause,
    Square,
    Save,
    Database,
    Code,
    CheckCircle,
    AlertCircle,
    Files,
    BarChart3,
    Settings2,
    Cookie,
    RefreshCw,
    Loader2,
    Timer,
    Zap,
    TrendingUp,
    Clock,
    AlertTriangle,
    XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AutomationStatus = 'idle' | 'running' | 'paused' | 'error' | 'session_expired';

type AutomationStats = {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
};

export default function Dashboard() {
    const [automationStatus, setAutomationStatus] = useState<AutomationStatus>('idle');
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState<AutomationStats>({ pending: 0, processing: 0, completed: 0, failed: 0, total: 0 });
    const [loopCount, setLoopCount] = useState(0);
    const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loopRef = useRef<NodeJS.Timeout | null>(null);
    const isRunningRef = useRef(false);

    // Fetch current stats
    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            if (data.success && data.data) {
                setStats({
                    pending: data.data.pending || 0,
                    processing: data.data.processing || 0,
                    completed: data.data.completed || 0,
                    failed: data.data.failed || 0,
                    total: data.data.total || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    // Initialize database with defaults
    const initializeDatabase = async () => {
        try {
            const response = await fetch('/api/init', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                setIsInitialized(true);
                fetchStats();
            }
        } catch (error) {
            console.error('Init error:', error);
        }
    };

    // Parse Excel and create check records  
    const parseExcel = async () => {
        try {
            const response = await fetch('/api/py/parse_excel', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                fetchStats();
                return data;
            }
            return null;
        } catch (error) {
            console.error('Parse error:', error);
            return null;
        }
    };

    // Run a single automation batch
    const runBatch = async (): Promise<boolean> => {
        try {
            const response = await fetch('/api/py/automation', { method: 'POST' });
            const data = await response.json();

            setLastRunTime(new Date());
            fetchStats();

            if (data.success) {
                if (data.session_expired) {
                    setAutomationStatus('session_expired');
                    setError('Session expired - please update cookies');
                    return false;
                }
                setLoopCount(prev => prev + 1);
                return true;
            } else {
                setError(data.error || 'Batch failed');
                return false;
            }
        } catch (error) {
            console.error('Automation error:', error);
            setError(String(error));
            return false;
        }
    };

    // Continuous automation loop
    const startAutomation = async () => {
        setAutomationStatus('running');
        setError(null);
        isRunningRef.current = true;

        // First, parse Excel if needed
        if (stats.total === 0) {
            await parseExcel();
        }

        // Run loop
        const runLoop = async () => {
            if (!isRunningRef.current) return;

            const success = await runBatch();

            if (!success || !isRunningRef.current) {
                if (isRunningRef.current && automationStatus !== 'session_expired') {
                    setAutomationStatus('error');
                }
                return;
            }

            // Check if there are more pending
            await fetchStats();

            if (stats.pending > 0 && isRunningRef.current) {
                // Continue with delay (5 seconds between batches)
                loopRef.current = setTimeout(runLoop, 5000);
            } else if (stats.pending === 0) {
                setAutomationStatus('idle');
                isRunningRef.current = false;
            }
        };

        runLoop();
    };

    const pauseAutomation = () => {
        isRunningRef.current = false;
        if (loopRef.current) {
            clearTimeout(loopRef.current);
            loopRef.current = null;
        }
        setAutomationStatus('paused');
    };

    const stopAutomation = () => {
        isRunningRef.current = false;
        if (loopRef.current) {
            clearTimeout(loopRef.current);
            loopRef.current = null;
        }
        setAutomationStatus('idle');
        setLoopCount(0);
    };

    const resumeAutomation = () => {
        startAutomation();
    };

    // Fetch stats on mount and periodically
    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (loopRef.current) {
                clearTimeout(loopRef.current);
            }
        };
    }, []);

    const getStatusBadge = () => {
        switch (automationStatus) {
            case 'running':
                return <Badge className="bg-green-500/10 text-green-400 border-green-500/20"><Activity className="h-3 w-3 mr-1 animate-pulse" /> Running</Badge>;
            case 'paused':
                return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"><Pause className="h-3 w-3 mr-1" /> Paused</Badge>;
            case 'error':
                return <Badge className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="h-3 w-3 mr-1" /> Error</Badge>;
            case 'session_expired':
                return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20"><AlertTriangle className="h-3 w-3 mr-1" /> Session Expired</Badge>;
            default:
                return <Badge className="bg-white/5 text-muted-foreground border-white/10"><Timer className="h-3 w-3 mr-1" /> Idle</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans selection:bg-primary/30">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] animate-blob pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[128px] animate-blob animation-delay-2000 pointer-events-none" />
            <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-screen filter blur-[128px] animate-blob animation-delay-4000 pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 container mx-auto p-6 md:p-8 lg:p-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent drop-shadow-sm">
                            Automate AI
                        </h1>
                        <p className="text-lg text-muted-foreground mt-2 max-w-lg">
                            Orchestrate check automation with Gemini CAPTCHA solving
                        </p>
                    </div>

                    {/* Automation Control Panel */}
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-3 flex-wrap">
                            {getStatusBadge()}
                            {loopCount > 0 && (
                                <Badge variant="secondary" className="font-mono">
                                    <RefreshCw className="h-3 w-3 mr-1" /> Loop #{loopCount}
                                </Badge>
                            )}
                            {lastRunTime && (
                                <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {lastRunTime.toLocaleTimeString()}
                                </Badge>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {automationStatus === 'idle' && (
                                <Button variant="premium" size="lg" onClick={startAutomation} className="flex-1">
                                    <Play className="h-5 w-5 mr-2" />
                                    Start Automation
                                </Button>
                            )}
                            {automationStatus === 'running' && (
                                <>
                                    <Button variant="secondary" size="lg" onClick={pauseAutomation} className="flex-1">
                                        <Pause className="h-5 w-5 mr-2" />
                                        Pause
                                    </Button>
                                    <Button variant="destructive" size="lg" onClick={stopAutomation}>
                                        <Square className="h-5 w-5" />
                                    </Button>
                                </>
                            )}
                            {automationStatus === 'paused' && (
                                <>
                                    <Button variant="premium" size="lg" onClick={resumeAutomation} className="flex-1">
                                        <Play className="h-5 w-5 mr-2" />
                                        Resume
                                    </Button>
                                    <Button variant="destructive" size="lg" onClick={stopAutomation}>
                                        <Square className="h-5 w-5" />
                                    </Button>
                                </>
                            )}
                            {(automationStatus === 'error' || automationStatus === 'session_expired') && (
                                <Button variant="premium" size="lg" onClick={startAutomation} className="flex-1">
                                    <RefreshCw className="h-5 w-5 mr-2" />
                                    Retry
                                </Button>
                            )}
                        </div>

                        {error && (
                            <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                                {error}
                            </div>
                        )}
                    </div>
                </header>

                {/* Quick Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Total', value: stats.total, icon: Database, color: 'text-blue-400' },
                        { label: 'Pending', value: stats.pending, icon: Timer, color: 'text-yellow-400' },
                        { label: 'Processing', value: stats.processing, icon: Loader2, color: 'text-purple-400' },
                        { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-400' },
                        { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-400' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                <span className="text-xs text-muted-foreground">{stat.label}</span>
                            </div>
                            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Navigation Sidebar */}
                    <nav className="col-span-1 space-y-3">
                        <p className="text-sm font-semibold text-muted-foreground mb-4 pl-2 tracking-wider uppercase">Menu</p>
                        <div className="space-y-2">
                            {[
                                { id: 'overview', icon: BarChart3, label: 'Dashboard', desc: 'Real-time Analytics' },
                                { id: 'logic', icon: Code, label: 'Pipeline', desc: 'Automation Flow' },
                                { id: 'files', icon: Files, label: 'File Manager', desc: 'Excel & ZIP Files' },
                                { id: 'cookies', icon: Cookie, label: 'Session', desc: 'Login Cookies' },
                                { id: 'settings', icon: Settings2, label: 'Settings', desc: 'Full Configuration' },
                                { id: 'db', icon: Database, label: 'Logs', desc: 'System Records' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full text-left group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border ${activeTab === item.id
                                        ? 'bg-primary/10 border-primary/20 shadow-lg shadow-primary/10'
                                        : 'bg-card/30 border-transparent hover:bg-card/50 hover:border-white/5'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg transition-colors ${activeTab === item.id ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground group-hover:text-primary'}`}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className={`font-semibold transition-colors ${activeTab === item.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                            {item.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground/60">{item.desc}</div>
                                    </div>

                                    {activeTab === item.id && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div className="pt-6 space-y-2">
                            <p className="text-sm font-semibold text-muted-foreground mb-2 pl-2 tracking-wider uppercase">Quick Actions</p>
                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={initializeDatabase}>
                                <Zap className="h-4 w-4 mr-2" /> Initialize Defaults
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={parseExcel}>
                                <Files className="h-4 w-4 mr-2" /> Parse Excel File
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={fetchStats}>
                                <RefreshCw className="h-4 w-4 mr-2" /> Refresh Stats
                            </Button>
                        </div>
                    </nav>

                    {/* Main Content Area */}
                    <main className="col-span-1 md:col-span-3 space-y-6">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="h-full"
                        >
                            {activeTab === "overview" && <AnalyticsDashboard />}
                            {activeTab === "db" && <LogsViewer />}
                            {activeTab === "files" && <FileManager />}
                            {activeTab === "settings" && <SettingsPanel />}
                            {activeTab === "cookies" && <CookieHelper />}

                            {activeTab === "logic" && (
                                <Card className="h-full border-none shadow-none bg-transparent">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-2xl">Automation Pipeline</CardTitle>
                                        <CardDescription>Configure the automation workflow - all settings from config.py</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0 h-[600px] rounded-xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-sm">
                                        <LogicEditor />
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    </main>
                </div>
            </div>
        </div>
    );
}
