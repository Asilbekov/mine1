"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Chrome,
    Cookie,
    Copy,
    Check,
    ExternalLink,
    Key,
    Shield,
    AlertCircle,
    RefreshCw,
    ChevronRight,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CookieData = {
    name: string;
    value: string;
};

const REQUIRED_COOKIES = [
    { name: 'TICKET_SESSION_ID', description: 'Main session ID from browser cookies' },
    { name: 'bearer_token', description: 'Authorization Bearer token from Network tab' },
    { name: 'smart_top', description: 'Optional: Smart top preference' },
    { name: 'ADRUM_BTa', description: 'Optional: AppDynamics tracking' },
    { name: 'ADRUM_BT1', description: 'Optional: AppDynamics tracking' },
];

export function CookieHelper() {
    const [step, setStep] = useState(1);
    const [cookies, setCookies] = useState<CookieData[]>([
        { name: 'TICKET_SESSION_ID', value: '' },
        { name: 'bearer_token', value: '' },
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const [showValues, setShowValues] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleCookieChange = (name: string, value: string) => {
        setCookies(prev => {
            const existing = prev.find(c => c.name === name);
            if (existing) {
                return prev.map(c => c.name === name ? { ...c, value } : c);
            }
            return [...prev, { name, value }];
        });
    };

    const handleParseCookies = (text: string) => {
        // Parse cookies from different formats
        const parsed: CookieData[] = [];

        // Try JSON format first
        try {
            const json = JSON.parse(text);
            if (typeof json === 'object') {
                Object.entries(json).forEach(([name, value]) => {
                    parsed.push({ name, value: String(value) });
                });
            }
        } catch {
            // Try cookie string format: name=value; name2=value2
            const parts = text.split(/[;\n]/);
            parts.forEach(part => {
                const [name, ...valueParts] = part.split('=');
                if (name && valueParts.length) {
                    parsed.push({
                        name: name.trim(),
                        value: valueParts.join('=').trim().replace(/^["']|["']$/g, '')
                    });
                }
            });
        }

        if (parsed.length > 0) {
            setCookies(prev => {
                const updated = [...prev];
                parsed.forEach(p => {
                    const existing = updated.find(c => c.name === p.name);
                    if (existing) {
                        existing.value = p.value;
                    } else {
                        updated.push(p);
                    }
                });
                return updated;
            });
        }
    };

    const saveCookies = async () => {
        setIsSaving(true);
        try {
            const validCookies = cookies.filter(c => c.value.trim() !== '');

            const response = await fetch('/api/cookies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validCookies)
            });

            if (response.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Error saving cookies:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const openSoliq = () => {
        window.open('https://my3.soliq.uz', '_blank');
    };

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Cookie className="h-5 w-5 text-primary" />
                    Session Cookie Helper
                </CardTitle>
                <CardDescription>
                    Extract login cookies from your browser to enable automation
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-6">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'}`}>
                                {s}
                            </div>
                            {s < 3 && (
                                <div className={`w-16 md:w-24 h-0.5 mx-2 ${step > s ? 'bg-primary' : 'bg-white/10'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h3 className="text-lg font-semibold">Step 1: Login to Soliq</h3>
                            <p className="text-muted-foreground">
                                Open my3.soliq.uz in your browser and login with your credentials.
                            </p>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                                <Chrome className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-blue-400">Use Chrome or Edge</p>
                                    <p className="text-muted-foreground">DevTools work best in Chromium browsers</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={openSoliq} className="flex-1">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open my3.soliq.uz
                                </Button>
                                <Button variant="outline" onClick={() => setStep(2)}>
                                    Next <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h3 className="text-lg font-semibold">Step 2: Extract Cookies</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex gap-3 p-3 bg-white/5 rounded-lg">
                                    <Badge className="shrink-0">1</Badge>
                                    <p>Press <kbd className="px-2 py-0.5 bg-black/50 rounded text-xs">F12</kbd> to open Developer Tools</p>
                                </div>
                                <div className="flex gap-3 p-3 bg-white/5 rounded-lg">
                                    <Badge className="shrink-0">2</Badge>
                                    <p>Go to <strong>Application</strong> tab → <strong>Cookies</strong> → <strong>my3.soliq.uz</strong></p>
                                </div>
                                <div className="flex gap-3 p-3 bg-white/5 rounded-lg">
                                    <Badge className="shrink-0">3</Badge>
                                    <p>Find <code className="text-primary">TICKET_SESSION_ID</code> and copy its value</p>
                                </div>
                                <div className="flex gap-3 p-3 bg-white/5 rounded-lg">
                                    <Badge className="shrink-0">4</Badge>
                                    <div>
                                        <p>Go to <strong>Network</strong> tab, find any request to soliq.uz</p>
                                        <p className="text-muted-foreground mt-1">Look for <code>Authorization: Bearer ...</code> in request headers</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-yellow-400">Important</p>
                                    <p className="text-muted-foreground">The Bearer token is required for file uploads. Include the full token starting with "Bearer "</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button onClick={() => setStep(3)} className="flex-1">
                                    I have the cookies <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Step 3: Enter Cookies</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowValues(!showValues)}
                                >
                                    {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>

                            {/* Paste area */}
                            <div className="space-y-2">
                                <Label>Paste cookies (JSON or cookie string format)</Label>
                                <textarea
                                    className="w-full h-20 bg-background border border-white/10 rounded-lg px-3 py-2 text-sm font-mono resize-none"
                                    placeholder='{"TICKET_SESSION_ID": "...", "bearer_token": "Bearer ..."}'
                                    onChange={(e) => handleParseCookies(e.target.value)}
                                />
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-2 bg-card text-xs text-muted-foreground">OR enter manually</span>
                                </div>
                            </div>

                            <ScrollArea className="h-[200px] pr-4">
                                <div className="space-y-3">
                                    {REQUIRED_COOKIES.map((cookie) => (
                                        <div key={cookie.name} className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Label className="font-mono text-xs">{cookie.name}</Label>
                                                {cookies.find(c => c.name === cookie.name)?.value && (
                                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                )}
                                            </div>
                                            <Input
                                                type={showValues ? 'text' : 'password'}
                                                placeholder={cookie.description}
                                                value={cookies.find(c => c.name === cookie.name)?.value || ''}
                                                onChange={(e) => handleCookieChange(cookie.name, e.target.value)}
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(2)}>
                                    Back
                                </Button>
                                <Button
                                    onClick={saveCookies}
                                    className="flex-1"
                                    disabled={isSaving || !cookies.find(c => c.name === 'TICKET_SESSION_ID')?.value}
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : saved ? (
                                        <Check className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Shield className="h-4 w-4 mr-2" />
                                    )}
                                    {saved ? 'Saved!' : 'Save Cookies to Database'}
                                </Button>
                            </div>

                            {saved && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex gap-3"
                                >
                                    <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-medium text-green-400">Cookies saved successfully!</p>
                                        <p className="text-muted-foreground">You can now start the automation</p>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
