
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    ArrowRight,
    GripVertical,
    Settings2,
    Trash2,
    Plus,
    Zap,
    Database,
    Brain,
    UploadCloud,
    CheckCircle2,
    AlertTriangle,
    GitBranch,
    X,
    Code2,
    Save,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type Param = {
    key: string;
    label: string;
    value: string;
    type: 'text' | 'number' | 'boolean' | 'select';
};

type LogicNode = {
    id: string;
    title: string;
    description: string;
    type: 'trigger' | 'action' | 'condition';
    icon: React.ElementType;
    enabled: boolean;
    params: Param[];
};

// Map config keys to node parameters
const NODE_CONFIG_MAP: Record<string, string[]> = {
    '1': ['EXCEL_FILE', 'BATCH_SIZE'],
    '2': ['SESSION_CHECK_INTERVAL'],
    '3': ['CHECK_NUMBER_COLUMN'],
    '4': ['GEMINI_MODEL', 'GEMINI_MAX_IMAGES_PER_BATCH'],
    '5': ['ZIP_FILE', 'UPLOAD_MAX_RETRIES'],
    '6': ['SUBMIT_URL', 'REQUEST_DELAY'],
};

const INITIAL_NODES: LogicNode[] = [
    {
        id: '1',
        title: 'Start Batch',
        description: 'Triggered when new Excel file is loaded',
        type: 'trigger',
        icon: Zap,
        enabled: true,
        params: [
            { key: 'EXCEL_FILE', label: 'Excel File Name', value: '', type: 'text' },
            { key: 'BATCH_SIZE', label: 'Batch Size', value: '50', type: 'number' }
        ]
    },
    {
        id: '2',
        title: 'Verify Session',
        description: 'Check if cookies are valid',
        type: 'condition',
        icon: CheckCircle2,
        enabled: true,
        params: [
            { key: 'SESSION_CHECK_INTERVAL', label: 'Check Interval (mins)', value: '20', type: 'number' }
        ]
    },
    {
        id: '3',
        title: 'Fetch Check Data',
        description: 'Get next pending check from Database',
        type: 'action',
        icon: Database,
        enabled: true,
        params: [
            { key: 'CHECK_NUMBER_COLUMN', label: 'Check # ID Column', value: 'receipt_id', type: 'text' }
        ]
    },
    {
        id: '4',
        title: 'Solve CAPTCHA',
        description: 'Send image to Gemini Flash',
        type: 'action',
        icon: Brain,
        enabled: true,
        params: [
            { key: 'GEMINI_MODEL', label: 'Model Name', value: 'gemini-2.5-flash-lite', type: 'text' },
            { key: 'GEMINI_MAX_IMAGES_PER_BATCH', label: 'Images per Batch', value: '20', type: 'number' }
        ]
    },
    {
        id: '5',
        title: 'Upload ZIP',
        description: 'Upload attachment to Soliq Repo',
        type: 'action',
        icon: UploadCloud,
        enabled: true,
        params: [
            { key: 'ZIP_FILE', label: 'Zip Archive', value: 'АСИЛБЕКОВА.zip', type: 'text' },
            { key: 'UPLOAD_MAX_RETRIES', label: 'Max Retries', value: '3', type: 'number' }
        ]
    },
    {
        id: '6',
        title: 'Submit Check',
        description: 'POST data to /api/cashregister-edit-api',
        type: 'action',
        icon: Zap,
        enabled: true,
        params: [
            { key: 'SUBMIT_URL', label: 'API Endpoint', value: '/api/cashregister-edit-api/check-edit/set-payment', type: 'text' },
            { key: 'REQUEST_DELAY', label: 'Delay (sec)', value: '0.05', type: 'number' }
        ]
    },
];

export function LogicEditor() {
    const [nodes, setNodes] = useState<LogicNode[]>(INITIAL_NODES);
    const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
    const [selectedNode, setSelectedNode] = useState<LogicNode | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load config values from API on mount
    useEffect(() => {
        loadConfigValues();
    }, []);

    const loadConfigValues = async () => {
        try {
            const response = await fetch('/api/config');
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                // Update nodes with values from database
                setNodes(prevNodes => prevNodes.map(node => ({
                    ...node,
                    params: node.params.map(param => {
                        const configItem = data.data.find((c: any) => c.key === param.key);
                        if (configItem) {
                            return { ...param, value: configItem.value };
                        }
                        return param;
                    })
                })));
            }
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateParam = (nodeId: string, paramKey: string, newValue: string) => {
        setNodes(nodes.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    params: node.params.map(p => p.key === paramKey ? { ...p, value: newValue } : p)
                };
            }
            return node;
        }));
        setHasChanges(true);
    };

    const saveToDatabase = async () => {
        setIsSaving(true);
        try {
            // Collect all params from all nodes
            const configUpdates: any[] = [];
            nodes.forEach(node => {
                node.params.forEach(param => {
                    configUpdates.push({
                        key: param.key,
                        value: param.value,
                        type: param.type === 'number' ? 'number' : 'string',
                        category: getCategoryForKey(param.key),
                        label: param.label
                    });
                });
            });

            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configUpdates)
            });

            if (response.ok) {
                setHasChanges(false);
                alert('Pipeline configuration saved to database!');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const getCategoryForKey = (key: string): string => {
        if (key.includes('GEMINI')) return 'gemini';
        if (key.includes('FILE') || key.includes('ZIP') || key.includes('EXCEL')) return 'files';
        if (key.includes('DELAY') || key.includes('RETRIES') || key.includes('BATCH')) return 'performance';
        if (key.includes('URL')) return 'api';
        return 'general';
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span>Loading pipeline configuration...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-primary" />
                        Automation Pipeline
                    </h3>
                    <p className="text-muted-foreground">Define the execution flow - changes sync to database</p>
                </div>
                <div className="flex gap-2">
                    {hasChanges && (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                            Unsaved changes
                        </Badge>
                    )}
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        onClick={() => setViewMode('list')}
                        size="sm"
                    >
                        List View
                    </Button>
                    <Button
                        variant={viewMode === 'graph' ? 'secondary' : 'ghost'}
                        onClick={() => setViewMode('graph')}
                        size="sm"
                    >
                        Graph View
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadConfigValues}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Reload
                    </Button>
                    <Button size="sm" onClick={saveToDatabase} disabled={isSaving || !hasChanges}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save to DB
                    </Button>
                </div>
            </div>

            <div className="flex-1 bg-accent/5 rounded-lg border-2 border-dashed border-accent/20 p-4 overflow-y-auto relative">
                {viewMode === 'list' ? (
                    <Reorder.Group axis="y" values={nodes} onReorder={setNodes} className="space-y-2 max-w-3xl mx-auto">
                        {nodes.map((node, index) => (
                            <Reorder.Item key={node.id} value={node}>
                                <motion.div layoutId={node.id}>
                                    <Card
                                        className={`group hover:shadow-md transition-all duration-300 border-l-4 ${node.enabled ? 'border-l-primary' : 'border-l-muted opacity-60'} cursor-pointer`}
                                        onClick={() => setSelectedNode(node)}
                                    >
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <GripVertical className="text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className={`p-2 rounded-full ${node.type === 'trigger' ? 'bg-yellow-500/10 text-yellow-500' : node.type === 'condition' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                <node.icon className="w-5 h-5" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-base">{node.title}</h4>
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{node.type}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{node.description}</p>
                                                {/* Show current param values */}
                                                <div className="flex gap-2 mt-1 flex-wrap">
                                                    {node.params.slice(0, 2).map(p => (
                                                        <Badge key={p.key} variant="secondary" className="text-[10px] font-mono">
                                                            {p.key}: {p.value.length > 20 ? p.value.substring(0, 20) + '...' : p.value}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Badge variant="secondary" className="font-mono text-xs hidden md:flex">
                                                    {node.params.length} Params
                                                </Badge>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><Settings2 className="w-4 h-4" /></Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    {index < nodes.length - 1 && (
                                        <div className="flex justify-center py-1">
                                            <div className="h-4 w-0.5 bg-border"></div>
                                        </div>
                                    )}
                                </motion.div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                ) : (
                    <div className="h-full flex items-center justify-center p-10 min-w-[800px] overflow-auto">
                        <div className="flex flex-col items-center gap-8 relative">
                            {/* SVG Connections Layer */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible -z-10">
                                {nodes.map((_, index) => {
                                    if (index === nodes.length - 1) return null;
                                    return (
                                        <line
                                            key={`line-${index}`}
                                            x1="50%"
                                            y1={`${(index * 130) + 80}px`}
                                            x2="50%"
                                            y2={`${((index + 1) * 130)}px`}
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="text-border"
                                            strokeDasharray="4 4"
                                        />
                                    );
                                })}
                            </svg>

                            {nodes.map((node) => (
                                <div key={node.id} className="relative z-10" onClick={() => setSelectedNode(node)}>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className={`
                                w-72 p-4 rounded-xl border backdrop-blur-md shadow-xl flex items-center gap-3 cursor-pointer transition-all duration-300
                                ${node.type === 'trigger' ? 'bg-yellow-500/10 border-yellow-500/30' : node.type === 'condition' ? 'bg-purple-500/10 border-purple-500/30' : 'bg-blue-500/10 border-blue-500/30'}
                                hover:shadow-2xl hover:brightness-110
                            `}>
                                        <div className={`p-3 rounded-lg ${node.type === 'trigger' ? 'bg-yellow-500/20' : node.type === 'condition' ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                                            <node.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm tracking-tight">{node.title}</div>
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold opacity-70">{node.type}</div>
                                        </div>
                                        <div className="ml-auto">
                                            <Settings2 className="w-4 h-4 text-muted-foreground opacity-50" />
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedNode && <selectedNode.icon className="w-5 h-5 text-primary" />}
                            Edit {selectedNode?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Configure parameters for this step. Changes are saved to the database.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {selectedNode?.params.map((param) => (
                            <div key={param.key} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor={param.key} className="font-medium">
                                        {param.label}
                                    </Label>
                                    <code className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
                                        {param.key}
                                    </code>
                                </div>
                                <Input
                                    id={param.key}
                                    value={nodes.find(n => n.id === selectedNode.id)?.params.find(p => p.key === param.key)?.value || ''}
                                    onChange={(e) => handleUpdateParam(selectedNode.id, param.key, e.target.value)}
                                    className="font-mono"
                                    type={param.type === 'number' ? 'number' : 'text'}
                                />
                            </div>
                        ))}
                        {(!selectedNode?.params || selectedNode.params.length === 0) && (
                            <div className="text-center py-8 text-muted-foreground text-sm italic">
                                No configurable parameters for this node.
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSelectedNode(null)}>Cancel</Button>
                        <Button onClick={() => { setSelectedNode(null); }}>
                            Apply Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
