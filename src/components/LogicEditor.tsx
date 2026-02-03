
"use client";

import React, { useState } from 'react';
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
    Code2
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

const INITIAL_NODES: LogicNode[] = [
    {
        id: '1',
        title: 'Start Batch',
        description: 'Triggered when new Excel file is loaded',
        type: 'trigger',
        icon: Zap,
        enabled: true,
        params: [
            { key: 'EXCEL_FILE', label: 'Excel File Name', value: 'Асилбекова Июнь тахрирлаш 20303 та.xlsx', type: 'text' },
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
        description: 'Send image to Gemini 1.5 Flash',
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
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-primary" />
                        Automation Pipeline
                    </h3>
                    <p className="text-muted-foreground">Define the execution flow for your Python workers</p>
                </div>
                <div className="flex gap-2">
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
                    <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Add Node</Button>
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

                            {nodes.map((node, index) => (
                                <div key={node.id} className="relative z-10" onClick={() => setSelectedNode(node)}>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className={`
                                w-72 p-4 rounded-xl border bg-card shadow-lg flex items-center gap-3 cursor-pointer
                                ${node.type === 'trigger' ? 'border-yellow-500/50 shadow-yellow-500/10' : node.type === 'condition' ? 'border-purple-500/50 shadow-purple-500/10' : 'border-blue-500/50 shadow-blue-500/10'}
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedNode && <selectedNode.icon className="w-5 h-5 text-primary" />}
                            Edit {selectedNode?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Configure input parameters for this step.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {selectedNode?.params.map((param) => (
                            <div key={param.key} className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={param.key} className="text-right text-xs uppercase text-muted-foreground font-bold col-span-1">
                                    {param.label}
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id={param.key}
                                        value={nodes.find(n => n.id === selectedNode.id)?.params.find(p => p.key === param.key)?.value || ''}
                                        onChange={(e) => handleUpdateParam(selectedNode.id, param.key, e.target.value)}
                                        className="font-mono text-xs"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">Config Key: {param.key}</p>
                                </div>
                            </div>
                        ))}
                        {(!selectedNode?.params || selectedNode.params.length === 0) && (
                            <div className="text-center py-8 text-muted-foreground text-sm italic">
                                No configurable parameters for this node.
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={() => setSelectedNode(null)}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
