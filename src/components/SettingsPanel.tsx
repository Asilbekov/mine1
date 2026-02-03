
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Settings2, Key, Cookie, Globe, Zap, Database,
    Save, RefreshCw, Plus, Trash2, Eye, EyeOff,
    CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Config = {
    id: string;
    key: string;
    value: string;
    type: string;
    category: string;
    label?: string;
    description?: string;
};

type ApiKeyEntry = {
    id: string;
    service: string;
    key: string;
    label?: string;
    isActive: boolean;
    isSuspended: boolean;
    usageCount: number;
    lastUsed?: string;
};

type SessionCookie = {
    id: string;
    name: string;
    value: string;
};

const CATEGORIES = [
    { id: 'api', label: 'API Endpoints', icon: Globe },
    { id: 'session', label: 'Session', icon: Database },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'gemini', label: 'Gemini OCR', icon: Settings2 },
    { id: 'files', label: 'Files', icon: Database },
    { id: 'limits', label: 'Limits', icon: AlertCircle },
];

export function SettingsPanel() {
    const [configs, setConfigs] = useState<Config[]>([]);
    const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
    const [cookies, setCookies] = useState<SessionCookie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSecrets, setShowSecrets] = useState(false);
    const [activeCategory, setActiveCategory] = useState('api');
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    // New API key form
    const [newKeyService, setNewKeyService] = useState('gemini');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [newKeyLabel, setNewKeyLabel] = useState('');

    // New cookie form
    const [newCookieName, setNewCookieName] = useState('');
    const [newCookieValue, setNewCookieValue] = useState('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const [configRes, keysRes, cookiesRes] = await Promise.all([
                fetch('/api/config'),
                fetch('/api/keys'),
                fetch('/api/cookies')
            ]);

            const [configData, keysData, cookiesData] = await Promise.all([
                configRes.json(),
                keysRes.json(),
                cookiesRes.json()
            ]);

            if (configData.success) setConfigs(configData.data);
            if (keysData.success) setApiKeys(keysData.data);
            if (cookiesData.success) setCookies(cookiesData.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const initializeDefaults = async () => {
        try {
            const response = await fetch('/api/init', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                await fetchAllData();
                alert('Default configuration initialized successfully!');
            }
        } catch (error) {
            console.error('Error initializing defaults:', error);
        }
    };

    const updateConfigValue = (key: string, value: string) => {
        setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
        setUnsavedChanges(true);
    };

    const saveConfigs = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configs)
            });

            if (response.ok) {
                setUnsavedChanges(false);
                alert('Configuration saved successfully!');
            }
        } catch (error) {
            console.error('Error saving configs:', error);
            alert('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const addApiKey = async () => {
        if (!newKeyValue) return;
        try {
            const response = await fetch('/api/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service: newKeyService,
                    key: newKeyValue,
                    label: newKeyLabel || `${newKeyService} Key #${apiKeys.filter(k => k.service === newKeyService).length + 1}`
                })
            });

            if (response.ok) {
                setNewKeyValue('');
                setNewKeyLabel('');
                await fetchAllData();
            }
        } catch (error) {
            console.error('Error adding API key:', error);
        }
    };

    const toggleApiKey = async (id: string, isActive: boolean) => {
        try {
            await fetch('/api/keys', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !isActive })
            });
            await fetchAllData();
        } catch (error) {
            console.error('Error toggling API key:', error);
        }
    };

    const deleteApiKey = async (id: string) => {
        if (!confirm('Delete this API key?')) return;
        try {
            await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
            await fetchAllData();
        } catch (error) {
            console.error('Error deleting API key:', error);
        }
    };

    const addCookie = () => {
        if (!newCookieName || !newCookieValue) return;
        setCookies(prev => [...prev, { id: Date.now().toString(), name: newCookieName, value: newCookieValue }]);
        setNewCookieName('');
        setNewCookieValue('');
        setUnsavedChanges(true);
    };

    const removeCookie = (id: string) => {
        setCookies(prev => prev.filter(c => c.id !== id));
        setUnsavedChanges(true);
    };

    const saveCookies = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/cookies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cookies })
            });
            setUnsavedChanges(false);
            alert('Session cookies saved!');
        } catch (error) {
            console.error('Error saving cookies:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredConfigs = configs.filter(c => c.category === activeCategory);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                    <span className="text-lg">Loading settings...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="config" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-white/5">
                        <TabsTrigger value="config" className="gap-2">
                            <Settings2 className="h-4 w-4" /> Configuration
                        </TabsTrigger>
                        <TabsTrigger value="keys" className="gap-2">
                            <Key className="h-4 w-4" /> API Keys
                        </TabsTrigger>
                        <TabsTrigger value="session" className="gap-2">
                            <Cookie className="h-4 w-4" /> Session Cookies
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                        {unsavedChanges && (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                                Unsaved changes
                            </Badge>
                        )}
                        <Button variant="outline" size="sm" onClick={initializeDefaults}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Initialize Defaults
                        </Button>
                    </div>
                </div>

                {/* Configuration Tab */}
                <TabsContent value="config">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>System Configuration</CardTitle>
                                <CardDescription>
                                    All settings from config.py - modify and save to update automation behavior
                                </CardDescription>
                            </div>
                            <Button onClick={saveConfigs} disabled={isSaving || !unsavedChanges}>
                                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Configuration
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-6">
                                {/* Category Sidebar */}
                                <div className="w-48 space-y-1">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeCategory === cat.id
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'hover:bg-white/5 text-muted-foreground'
                                                }`}
                                        >
                                            <cat.icon className="h-4 w-4" />
                                            {cat.label}
                                            <Badge variant="secondary" className="ml-auto text-xs">
                                                {configs.filter(c => c.category === cat.id).length}
                                            </Badge>
                                        </button>
                                    ))}
                                </div>

                                {/* Config Editor */}
                                <div className="flex-1">
                                    <ScrollArea className="h-[400px] pr-4">
                                        <div className="space-y-4">
                                            {filteredConfigs.length === 0 ? (
                                                <div className="text-center py-10 text-muted-foreground">
                                                    No configuration items in this category.
                                                    Click "Initialize Defaults" to load config.py values.
                                                </div>
                                            ) : (
                                                filteredConfigs.map(config => (
                                                    <div key={config.key} className="grid grid-cols-3 gap-4 items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                        <div>
                                                            <Label className="font-medium">{config.label || config.key}</Label>
                                                            <p className="text-xs text-muted-foreground font-mono">{config.key}</p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <Input
                                                                value={config.value}
                                                                onChange={(e) => updateConfigValue(config.key, e.target.value)}
                                                                className="font-mono text-sm"
                                                                type={config.type === 'number' ? 'number' : 'text'}
                                                            />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* API Keys Tab */}
                <TabsContent value="keys">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" /> API Keys Management
                            </CardTitle>
                            <CardDescription>
                                Manage Gemini, Mistral, and other API keys for automation services
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add New Key */}
                            <div className="p-4 rounded-lg border border-dashed border-white/20 bg-white/5">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Add New API Key
                                </h4>
                                <div className="grid grid-cols-4 gap-3">
                                    <select
                                        value={newKeyService}
                                        onChange={(e) => setNewKeyService(e.target.value)}
                                        className="bg-background border border-white/10 rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="gemini">Gemini</option>
                                        <option value="mistral">Mistral</option>
                                        <option value="openrouter">OpenRouter</option>
                                        <option value="soliq">Soliq Bearer</option>
                                    </select>
                                    <Input
                                        placeholder="Label (optional)"
                                        value={newKeyLabel}
                                        onChange={(e) => setNewKeyLabel(e.target.value)}
                                    />
                                    <Input
                                        placeholder="API Key"
                                        type={showSecrets ? 'text' : 'password'}
                                        value={newKeyValue}
                                        onChange={(e) => setNewKeyValue(e.target.value)}
                                    />
                                    <Button onClick={addApiKey} disabled={!newKeyValue}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Key
                                    </Button>
                                </div>
                            </div>

                            {/* Keys List */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium">Stored API Keys ({apiKeys.length})</h4>
                                    <Button variant="ghost" size="sm" onClick={() => setShowSecrets(!showSecrets)}>
                                        {showSecrets ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                        {showSecrets ? 'Hide' : 'Show'}
                                    </Button>
                                </div>

                                <AnimatePresence>
                                    {apiKeys.map(key => (
                                        <motion.div
                                            key={key.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className={`flex items-center gap-4 p-3 rounded-lg border ${key.isSuspended
                                                ? 'bg-red-500/10 border-red-500/20'
                                                : key.isActive
                                                    ? 'bg-green-500/10 border-green-500/20'
                                                    : 'bg-white/5 border-white/10'
                                                }`}
                                        >
                                            <Badge variant={key.service === 'gemini' ? 'default' : 'secondary'}>
                                                {key.service}
                                            </Badge>
                                            <span className="font-medium">{key.label}</span>
                                            <code className="font-mono text-sm text-muted-foreground">{key.key}</code>
                                            <div className="ml-auto flex items-center gap-2">
                                                <Badge variant="outline">Used: {key.usageCount}</Badge>
                                                {key.isSuspended && <Badge variant="destructive">Suspended</Badge>}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleApiKey(key.id, key.isActive)}
                                                >
                                                    {key.isActive ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => deleteApiKey(key.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {apiKeys.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No API keys configured. Click "Initialize Defaults" to load default Gemini keys.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Session Cookies Tab */}
                <TabsContent value="session">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Cookie className="h-5 w-5" /> Session Cookies
                                </CardTitle>
                                <CardDescription>
                                    Authentication cookies for soliq.uz - equivalent to SESSION_COOKIES in config.py
                                </CardDescription>
                            </div>
                            <Button onClick={saveCookies} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Cookies
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add New Cookie */}
                            <div className="p-4 rounded-lg border border-dashed border-white/20 bg-white/5">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Add Session Cookie
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <Input
                                        placeholder="Cookie Name (e.g., TICKET_SESSION_ID)"
                                        value={newCookieName}
                                        onChange={(e) => setNewCookieName(e.target.value)}
                                    />
                                    <Input
                                        placeholder="Cookie Value"
                                        type={showSecrets ? 'text' : 'password'}
                                        value={newCookieValue}
                                        onChange={(e) => setNewCookieValue(e.target.value)}
                                    />
                                    <Button onClick={addCookie} disabled={!newCookieName || !newCookieValue}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Cookie
                                    </Button>
                                </div>
                            </div>

                            {/* Cookies List */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium">Active Cookies ({cookies.length})</h4>
                                    <Button variant="ghost" size="sm" onClick={() => setShowSecrets(!showSecrets)}>
                                        {showSecrets ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                        {showSecrets ? 'Hide Values' : 'Show Values'}
                                    </Button>
                                </div>

                                {cookies.map(cookie => (
                                    <div
                                        key={cookie.id}
                                        className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10"
                                    >
                                        <Badge variant="outline" className="font-mono">{cookie.name}</Badge>
                                        <code className="flex-1 font-mono text-sm text-muted-foreground truncate">
                                            {showSecrets ? cookie.value : '••••••••••••••••'}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeCookie(cookie.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                {cookies.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No session cookies configured. Click "Initialize Defaults" to load default cookies.
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg bg-yellow-500/10 p-4 border border-yellow-500/20 flex gap-3 text-yellow-500 text-sm">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <div>
                                    <strong>Important:</strong> Session cookies expire periodically. When automation fails with 401 errors,
                                    update the bearer_token and TICKET_SESSION_ID with fresh values from your browser.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
