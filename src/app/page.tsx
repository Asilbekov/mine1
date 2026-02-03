"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LogicEditor } from "@/components/LogicEditor";
import { FileManager } from "@/components/FileManager";
import { LogsViewer } from "@/components/LogsViewer";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
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
    BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    const toggleProcessing = () => setIsProcessing(!isProcessing);

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Automate AI
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Control, Edit Logic, and Monitor Your AI Operations
                    </p>
                </div>
                <div className="flex gap-4 items-center">
                    <Badge variant={isProcessing ? "success" : "secondary"} className="text-lg px-4 py-1 h-10">
                        {isProcessing ? "System Active" : "System Idle"}
                    </Badge>
                    <Button variant="premium" size="lg" onClick={toggleProcessing}>
                        {isProcessing ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                        {isProcessing ? "Pause Automation" : "Start Automation"}
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar / Navigation */}
                <div className="col-span-1 space-y-4">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary" onClick={() => setActiveTab("overview")}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <BarChart3 className="h-6 w-6 text-primary" />
                            <div>
                                <CardTitle className="text-lg">Dashboard</CardTitle>
                                <CardDescription>Analytics & Stats</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-purple-500" onClick={() => setActiveTab("logic")}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Code className="h-6 w-6 text-purple-500" />
                            <div>
                                <CardTitle className="text-lg">Logic Editor</CardTitle>
                                <CardDescription>Edit automation flows</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-orange-500" onClick={() => setActiveTab("files")}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Files className="h-6 w-6 text-orange-500" />
                            <div>
                                <CardTitle className="text-lg">File Manager</CardTitle>
                                <CardDescription>Upload Excel & Zip</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500" onClick={() => setActiveTab("models")}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Bot className="h-6 w-6 text-blue-500" />
                            <div>
                                <CardTitle className="text-lg">AI Models</CardTitle>
                                <CardDescription>Connect Gemini/Mistral</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-green-500" onClick={() => setActiveTab("db")}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Database className="h-6 w-6 text-green-500" />
                            <div>
                                <CardTitle className="text-lg">Data & Logs</CardTitle>
                                <CardDescription>View processed checks</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="col-span-1 md:col-span-3 space-y-6">

                    {activeTab === "overview" && (
                        <AnalyticsDashboard />
                    )}

                    {activeTab === "db" && (
                        <LogsViewer />
                    )}

                    {activeTab === "files" && (
                        <FileManager />
                    )}

                    {activeTab === "models" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Service Configuration</CardTitle>
                                <CardDescription>Manage API keys and model preferences</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Gemini API Key</label>
                                    <div className="flex gap-2">
                                        <Input type="password" placeholder="AIzam..." className="flex-1" />
                                        <Button variant="secondary">Update</Button>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Mistral/OpenRouter Key</label>
                                    <div className="flex gap-2">
                                        <Input type="password" placeholder="sk-..." className="flex-1" />
                                        <Button variant="secondary">Update</Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pt-4">
                                    <Button>Save Configuration</Button>
                                    <Button variant="ghost">Test Connections</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "logic" && (
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Logic Flow Editor</CardTitle>
                                <CardDescription>Drag and drop nodes to change processing logic</CardDescription>
                            </CardHeader>
                            <CardContent className="min-h-[500px]">
                                <LogicEditor />
                            </CardContent>
                        </Card>
                    )}


                </div>
            </div>
        </div>
    );
}
