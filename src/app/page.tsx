"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogicEditor } from "@/components/LogicEditor";
import { FileManager } from "@/components/FileManager";
import { LogsViewer } from "@/components/LogsViewer";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import {
    Activity,
    Bot,
    Settings,
    Cpu,
    Play,
    Pause,
    Save,
    Database,
    Code,
    CheckCircle,
    AlertCircle,
    Files,
    BarChart3,
    Settings2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    const toggleProcessing = () => setIsProcessing(!isProcessing);

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans selection:bg-primary/30">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] animate-blob pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[128px] animate-blob animation-delay-2000 pointer-events-none" />
            <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-screen filter blur-[128px] animate-blob animation-delay-4000 pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 container mx-auto p-6 md:p-8 lg:p-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent drop-shadow-sm">
                            Automate AI
                        </h1>
                        <p className="text-lg text-muted-foreground mt-2 max-w-lg">
                            Orchestrate your intelligent agents, visualize performance, and optimize logic flows in real-time.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                        <Badge
                            variant={isProcessing ? "success" : "secondary"}
                            className={`text-sm px-4 py-1.5 h-9 backdrop-blur-md border ${isProcessing ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10'}`}
                        >
                            <span className={`relative flex h-2 w-2 mr-2 ${isProcessing ? '' : 'hidden'}`}>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            {isProcessing ? "System Operational" : "System Idle"}
                        </Badge>
                        <Button variant="premium" size="lg" onClick={toggleProcessing} className="w-full sm:w-auto">
                            {isProcessing ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                            {isProcessing ? "Pause Automation" : "Start Automation"}
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Navigation Sidebar */}
                    <nav className="col-span-1 space-y-3">
                        <p className="text-sm font-semibold text-muted-foreground mb-4 pl-2 tracking-wider uppercase">Menu</p>
                        <div className="space-y-2">
                            {[
                                { id: 'overview', icon: BarChart3, label: 'Dashboard', desc: 'Real-time Analytics' },
                                { id: 'logic', icon: Code, label: 'Logic Editor', desc: 'Flow Builder' },
                                { id: 'files', icon: Files, label: 'File Manager', desc: 'Assets & Data' },
                                { id: 'settings', icon: Settings2, label: 'Settings', desc: 'Full Configuration' },
                                { id: 'models', icon: Bot, label: 'AI Models', desc: 'LLM Configuration' },
                                { id: 'db', icon: Database, label: 'Data & Logs', desc: 'System Records' },
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

                            {activeTab === "models" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>AI Service Configuration</CardTitle>
                                        <CardDescription>
                                            Quick access to API keys. For full configuration, use the Settings tab.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20 flex gap-3 text-blue-500 text-sm">
                                            <AlertCircle className="h-5 w-5 shrink-0" />
                                            <p>
                                                API keys and session configuration have been moved to the <strong>Settings</strong> tab
                                                for a more comprehensive management experience. Click on Settings in the sidebar to
                                                manage all configuration including API keys, session cookies, and system parameters.
                                            </p>
                                        </div>
                                        <Button onClick={() => setActiveTab('settings')} className="w-full">
                                            <Settings2 className="mr-2 h-4 w-4" />
                                            Open Full Settings Panel
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === "logic" && (
                                <Card className="h-full border-none shadow-none bg-transparent">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-2xl">Logic Flow Editor</CardTitle>
                                        <CardDescription>Drag and drop nodes to design your automation workflow. Changes are saved to the database.</CardDescription>
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
