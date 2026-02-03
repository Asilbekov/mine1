
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ArrowRight,
    ArrowDown,
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
    Loader2,
    Play,
    Pause,
    Clock,
    Shield,
    FileSpreadsheet,
    FileArchive,
    Eye,
    Key,
    Repeat,
    Timer,
    AlertCircle,
    Download,
    Send,
    Image,
    Lock,
    Cpu,
    Network,
    Copy,
    LayoutGrid,
    List,
    ChevronDown,
    ChevronRight,
    Sparkles,
    Workflow
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type Param = {
    key: string;
    label: string;
    value: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    options?: string[];
    description?: string;
};

type LogicNode = {
    id: string;
    title: string;
    description: string;
    type: 'trigger' | 'action' | 'condition' | 'loop' | 'error_handler';
    icon: React.ElementType;
    enabled: boolean;
    collapsed?: boolean;
    params: Param[];
    category: string;
};

// Complete automation pipeline nodes based on automate_checks.py
const INITIAL_NODES: LogicNode[] = [
    // === INITIALIZATION PHASE ===
    {
        id: 'init_1',
        title: 'Initialize Session',
        description: 'Load cookies and create HTTP session with connection pooling',
        type: 'trigger',
        icon: Play,
        enabled: true,
        category: 'Initialization',
        params: [
            { key: 'CONNECTION_POOL_SIZE', label: 'Connection Pool Size', value: '20', type: 'number', description: 'Max concurrent connections' },
            { key: 'REQUEST_TIMEOUT', label: 'Request Timeout (sec)', value: '120', type: 'number' },
        ]
    },
    {
        id: 'init_2',
        title: 'Verify Session Cookies',
        description: 'Check if TICKET_SESSION_ID and bearer_token are valid',
        type: 'condition',
        icon: Shield,
        enabled: true,
        category: 'Initialization',
        params: [
            { key: 'SESSION_CHECK_INTERVAL', label: 'Check Interval (mins)', value: '20', type: 'number' },
            { key: 'AUTO_REFRESH', label: 'Auto Refresh on 401', value: 'true', type: 'boolean' },
        ]
    },
    // === DATA LOADING PHASE ===
    {
        id: 'data_1',
        title: 'Load Excel Data',
        description: 'Read check data from Excel file using openpyxl',
        type: 'action',
        icon: FileSpreadsheet,
        enabled: true,
        category: 'Data Loading',
        params: [
            { key: 'EXCEL_FILE', label: 'Excel File Name', value: 'Асилбекова Июнь тахрирлаш 20303 та.xlsx', type: 'text' },
            { key: 'CHECK_NUMBER_COLUMN', label: 'Check # Column', value: 'receipt_id', type: 'text' },
            { key: 'TERMINAL_ID_COLUMN', label: 'Terminal ID Column', value: 'terminalId', type: 'text' },
            { key: 'PAYMENT_DATE_COLUMN', label: 'Payment Date Column', value: 'paymentDate', type: 'text' },
        ]
    },
    {
        id: 'data_2',
        title: 'Load Progress DB',
        description: 'Load SQLite database to skip already processed checks',
        type: 'action',
        icon: Database,
        enabled: true,
        category: 'Data Loading',
        params: [
            { key: 'PROGRESS_DB_FILE', label: 'Progress DB Path', value: 'progress.db', type: 'text' },
            { key: 'SKIP_COMPLETED', label: 'Skip Completed', value: 'true', type: 'boolean' },
        ]
    },
    {
        id: 'data_3',
        title: 'Filter Pending Checks',
        description: 'Calculate remaining checks to process',
        type: 'condition',
        icon: Eye,
        enabled: true,
        category: 'Data Loading',
        params: [
            { key: 'MAX_CHECKS_LIMIT', label: 'Max Checks (0=all)', value: '0', type: 'number', description: 'Limit processing count' },
        ]
    },
    // === BATCH PROCESSING LOOP ===
    {
        id: 'batch_1',
        title: 'Create Batch',
        description: 'Split pending checks into batches for parallel processing',
        type: 'loop',
        icon: Repeat,
        enabled: true,
        category: 'Batch Processing',
        params: [
            { key: 'BATCH_SIZE', label: 'Batch Size', value: '50', type: 'number' },
            { key: 'MAX_WORKERS_FILE_UPLOAD', label: 'Parallel Uploads', value: '20', type: 'number' },
            { key: 'MAX_WORKERS_CHECK_SUBMIT', label: 'Parallel Submissions', value: '20', type: 'number' },
        ]
    },
    // === CAPTCHA PHASE ===
    {
        id: 'captcha_1',
        title: 'Fetch CAPTCHA Images',
        description: 'GET /api/cashregister-edit-api/home/get-captcha in parallel',
        type: 'action',
        icon: Image,
        enabled: true,
        category: 'CAPTCHA',
        params: [
            { key: 'CAPTCHA_URL', label: 'CAPTCHA Endpoint', value: '/api/cashregister-edit-api/home/get-captcha', type: 'text' },
            { key: 'CAPTCHA_FETCH_DELAY', label: 'Fetch Delay (sec)', value: '0.1', type: 'number' },
        ]
    },
    {
        id: 'captcha_2',
        title: 'Gemini OCR Solver',
        description: 'Send batch to Gemini Flash for CAPTCHA solving',
        type: 'action',
        icon: Brain,
        enabled: true,
        category: 'CAPTCHA',
        params: [
            { key: 'GEMINI_MODEL', label: 'Gemini Model', value: 'gemini-2.5-flash-lite', type: 'text' },
            { key: 'GEMINI_MAX_IMAGES_PER_BATCH', label: 'Images per Batch', value: '20', type: 'number' },
            { key: 'GEMINI_RPM_PER_KEY', label: 'RPM per Key', value: '14', type: 'number', description: 'Rate limit per API key' },
            { key: 'GEMINI_BATCH_COOLDOWN', label: 'Batch Cooldown (sec)', value: '0.5', type: 'number' },
        ]
    },
    {
        id: 'captcha_3',
        title: 'API Key Rotation',
        description: 'Rotate Gemini keys to avoid rate limiting',
        type: 'action',
        icon: Key,
        enabled: true,
        category: 'CAPTCHA',
        params: [
            { key: 'GEMINI_DELAY_BETWEEN_REQUESTS', label: 'Delay Between (sec)', value: '3.0', type: 'number' },
            { key: 'AUTO_ROTATE_ON_429', label: 'Auto Rotate on 429', value: 'true', type: 'boolean' },
        ]
    },
    // === FILE UPLOAD PHASE ===
    {
        id: 'upload_1',
        title: 'Prepare ZIP Archive',
        description: 'Read and base64 encode ZIP file for upload',
        type: 'action',
        icon: FileArchive,
        enabled: true,
        category: 'File Upload',
        params: [
            { key: 'ZIP_FILE', label: 'ZIP File Path', value: 'АСИЛБЕКОВА.zip', type: 'text' },
        ]
    },
    {
        id: 'upload_2',
        title: 'Upload to Repository',
        description: 'POST /api/general-api/file/repository-set-file',
        type: 'action',
        icon: UploadCloud,
        enabled: true,
        category: 'File Upload',
        params: [
            { key: 'FILE_UPLOAD_URL', label: 'Upload Endpoint', value: '/api/general-api/file/repository-set-file', type: 'text' },
            { key: 'REPOSITORY_ID', label: 'Repository ID', value: 'd8069e78bf077b43a2bbf7db3a7b78e3', type: 'text' },
            { key: 'UPLOAD_MAX_RETRIES', label: 'Max Retries', value: '3', type: 'number' },
            { key: 'FILE_UPLOAD_STAGGER_DELAY', label: 'Stagger Delay (sec)', value: '0.2', type: 'number' },
        ]
    },
    // === SUBMISSION PHASE ===
    {
        id: 'submit_1',
        title: 'Build Payment Payload',
        description: 'Construct JSON payload with check details and file ID',
        type: 'action',
        icon: Code2,
        enabled: true,
        category: 'Submission',
        params: [
            { key: 'DEFAULT_TIN', label: 'Default TIN', value: '62409036610049', type: 'text' },
            { key: 'DEFAULT_PIN_CODE', label: 'PIN Code', value: '123456', type: 'text' },
            { key: 'INTERACTIVE_ID', label: 'Interactive ID', value: '58', type: 'number' },
        ]
    },
    {
        id: 'submit_2',
        title: 'Submit Check Edit',
        description: 'POST /api/cashregister-edit-api/check-edit/set-payment',
        type: 'action',
        icon: Send,
        enabled: true,
        category: 'Submission',
        params: [
            { key: 'SUBMIT_URL', label: 'Submit Endpoint', value: '/api/cashregister-edit-api/check-edit/set-payment', type: 'text' },
            { key: 'REQUEST_DELAY', label: 'Request Delay (sec)', value: '0.05', type: 'number' },
            { key: 'SUBMISSION_STAGGER_DELAY', label: 'Stagger Delay (sec)', value: '0.15', type: 'number' },
        ]
    },
    // === ERROR HANDLING ===
    {
        id: 'error_1',
        title: 'Handle 9999 Error',
        description: 'Server error - exponential backoff and retry',
        type: 'error_handler',
        icon: AlertTriangle,
        enabled: true,
        category: 'Error Handling',
        params: [
            { key: 'SERVER_ERROR_MAX_RETRIES', label: 'Max Retries', value: '5', type: 'number' },
            { key: 'SERVER_ERROR_BASE_DELAY', label: 'Base Delay (sec)', value: '2.0', type: 'number' },
            { key: 'SERVER_ERROR_MAX_DELAY', label: 'Max Delay (sec)', value: '30.0', type: 'number' },
        ]
    },
    {
        id: 'error_2',
        title: 'Handle CAPTCHA Error',
        description: 'Re-fetch and re-solve CAPTCHA on code -1002',
        type: 'error_handler',
        icon: AlertCircle,
        enabled: true,
        category: 'Error Handling',
        params: [
            { key: 'CAPTCHA_MAX_RETRIES', label: 'Max CAPTCHA Retries', value: '2', type: 'number' },
        ]
    },
    {
        id: 'error_3',
        title: 'Handle 401 Unauthorized',
        description: 'Session expired - trigger cookie refresh',
        type: 'error_handler',
        icon: Lock,
        enabled: true,
        category: 'Error Handling',
        params: [
            { key: 'PAUSE_ON_401', label: 'Pause on 401', value: 'true', type: 'boolean' },
            { key: 'AUTO_RUN_REFRESH_SCRIPT', label: 'Auto Run Refresh', value: 'false', type: 'boolean' },
        ]
    },
    // === COMPLETION ===
    {
        id: 'complete_1',
        title: 'Update Progress DB',
        description: 'Mark check as completed in SQLite database',
        type: 'action',
        icon: Database,
        enabled: true,
        category: 'Completion',
        params: [
            { key: 'LOG_TO_FILE', label: 'Log to File', value: 'true', type: 'boolean' },
        ]
    },
    {
        id: 'complete_2',
        title: 'Log Results',
        description: 'Write success/failure to automation.log',
        type: 'action',
        icon: CheckCircle2,
        enabled: true,
        category: 'Completion',
        params: [
            { key: 'LOG_FILE', label: 'Log File Path', value: 'automation.log', type: 'text' },
            { key: 'LOG_LEVEL', label: 'Log Level', value: 'INFO', type: 'select', options: ['DEBUG', 'INFO', 'WARNING', 'ERROR'] },
        ]
    },
];

// Node templates for adding new nodes
const NODE_TEMPLATES: Partial<LogicNode>[] = [
    { title: 'Custom Action', description: 'Generic action step', type: 'action', icon: Zap, category: 'Custom', params: [] },
    { title: 'Condition Check', description: 'Conditional branch', type: 'condition', icon: GitBranch, category: 'Custom', params: [] },
    { title: 'Wait/Delay', description: 'Add a delay between steps', type: 'action', icon: Timer, category: 'Timing', params: [{ key: 'DELAY_SECONDS', label: 'Delay (sec)', value: '1', type: 'number' }] },
    { title: 'Parallel Executor', description: 'Run steps in parallel', type: 'loop', icon: Cpu, category: 'Performance', params: [{ key: 'MAX_WORKERS', label: 'Max Workers', value: '10', type: 'number' }] },
    { title: 'HTTP Request', description: 'Make custom API call', type: 'action', icon: Network, category: 'Network', params: [{ key: 'URL', label: 'URL', value: '', type: 'text' }, { key: 'METHOD', label: 'Method', value: 'GET', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] }] },
];

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    'Initialization': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    'Data Loading': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    'Batch Processing': { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' },
    'CAPTCHA': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    'File Upload': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    'Submission': { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
    'Error Handling': { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    'Completion': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    'Custom': { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400' },
};

const TYPE_STYLES: Record<string, { icon_bg: string; badge: string }> = {
    'trigger': { icon_bg: 'bg-yellow-500/20 text-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
    'action': { icon_bg: 'bg-blue-500/20 text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    'condition': { icon_bg: 'bg-purple-500/20 text-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    'loop': { icon_bg: 'bg-cyan-500/20 text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
    'error_handler': { icon_bg: 'bg-red-500/20 text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/30' },
};

export function LogicEditor() {
    const [nodes, setNodes] = useState<LogicNode[]>(INITIAL_NODES);
    const [viewMode, setViewMode] = useState<'list' | 'graph' | 'category'>('category');
    const [selectedNode, setSelectedNode] = useState<LogicNode | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
    const [showAddNode, setShowAddNode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadConfigValues();
    }, []);

    const loadConfigValues = async () => {
        try {
            const response = await fetch('/api/config');
            const data = await response.json();

            if (data.success && data.data.length > 0) {
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

    const toggleNodeEnabled = (nodeId: string) => {
        setNodes(nodes.map(node =>
            node.id === nodeId ? { ...node, enabled: !node.enabled } : node
        ));
        setHasChanges(true);
    };

    const deleteNode = (nodeId: string) => {
        setNodes(nodes.filter(n => n.id !== nodeId));
        setHasChanges(true);
    };

    const duplicateNode = (node: LogicNode) => {
        const newNode = {
            ...node,
            id: `${node.id}_copy_${Date.now()}`,
            title: `${node.title} (Copy)`,
            params: node.params.map(p => ({ ...p }))
        };
        const idx = nodes.findIndex(n => n.id === node.id);
        const newNodes = [...nodes];
        newNodes.splice(idx + 1, 0, newNode);
        setNodes(newNodes);
        setHasChanges(true);
    };

    const addNodeFromTemplate = (template: Partial<LogicNode>) => {
        const newNode: LogicNode = {
            id: `custom_${Date.now()}`,
            title: template.title || 'New Node',
            description: template.description || '',
            type: template.type || 'action',
            icon: template.icon || Zap,
            enabled: true,
            category: template.category || 'Custom',
            params: template.params?.map(p => ({ ...p })) || []
        };
        setNodes([...nodes, newNode]);
        setShowAddNode(false);
        setHasChanges(true);
    };

    const saveToDatabase = async () => {
        setIsSaving(true);
        try {
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
            }
        } catch (error) {
            console.error('Error saving config:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getCategoryForKey = (key: string): string => {
        if (key.includes('GEMINI')) return 'gemini';
        if (key.includes('FILE') || key.includes('ZIP') || key.includes('EXCEL')) return 'files';
        if (key.includes('DELAY') || key.includes('RETRIES') || key.includes('BATCH') || key.includes('WORKER')) return 'performance';
        if (key.includes('URL')) return 'api';
        if (key.includes('SESSION') || key.includes('TIN') || key.includes('PIN')) return 'session';
        return 'general';
    };

    const toggleCategory = (category: string) => {
        const newCollapsed = new Set(collapsedCategories);
        if (newCollapsed.has(category)) {
            newCollapsed.delete(category);
        } else {
            newCollapsed.add(category);
        }
        setCollapsedCategories(newCollapsed);
    };

    const categories = [...new Set(nodes.map(n => n.category))];
    const filteredNodes = searchTerm
        ? nodes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.description.toLowerCase().includes(searchTerm.toLowerCase()))
        : nodes;

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span>Loading pipeline configuration...</span>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Workflow className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            Automation Pipeline
                            <Badge variant="outline" className="text-xs font-normal">{nodes.length} steps</Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground">Full automation workflow from automate_checks.py</p>
                    </div>
                </div>

                <div className="flex gap-2 items-center">
                    {hasChanges && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Sparkles className="h-3 w-3 mr-1" /> Unsaved
                        </Badge>
                    )}
                    <Input
                        placeholder="Search nodes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-48 h-9"
                    />
                    <div className="flex border rounded-md overflow-hidden">
                        <Button variant={viewMode === 'category' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('category')} className="rounded-none">
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-none">
                            <List className="h-4 w-4" />
                        </Button>
                        <Button variant={viewMode === 'graph' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('graph')} className="rounded-none">
                            <GitBranch className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowAddNode(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Add Node
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadConfigValues}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={saveToDatabase} disabled={isSaving || !hasChanges}>
                        {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Save
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <ScrollArea className="flex-1 rounded-lg border border-white/10 bg-black/20">
                <div className="p-4">
                    {viewMode === 'category' ? (
                        // Category View
                        <div className="space-y-4">
                            {categories.map(category => {
                                const categoryNodes = filteredNodes.filter(n => n.category === category);
                                if (categoryNodes.length === 0) return null;
                                const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['Custom'];
                                const isCollapsed = collapsedCategories.has(category);

                                return (
                                    <div key={category} className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}>
                                        <button
                                            onClick={() => toggleCategory(category)}
                                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                <span className={`font-semibold ${colors.text}`}>{category}</span>
                                                <Badge variant="secondary" className="text-xs">{categoryNodes.length}</Badge>
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {!isCollapsed && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-white/10"
                                                >
                                                    <div className="p-3 space-y-2">
                                                        {categoryNodes.map(node => (
                                                            <NodeCard
                                                                key={node.id}
                                                                node={node}
                                                                onSelect={() => setSelectedNode(node)}
                                                                onToggle={() => toggleNodeEnabled(node.id)}
                                                                onDelete={() => deleteNode(node.id)}
                                                                onDuplicate={() => duplicateNode(node)}
                                                            />
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    ) : viewMode === 'list' ? (
                        // List View
                        <Reorder.Group axis="y" values={filteredNodes} onReorder={setNodes} className="space-y-2">
                            {filteredNodes.map((node, index) => (
                                <Reorder.Item key={node.id} value={node}>
                                    <motion.div>
                                        <NodeCard
                                            node={node}
                                            onSelect={() => setSelectedNode(node)}
                                            onToggle={() => toggleNodeEnabled(node.id)}
                                            onDelete={() => deleteNode(node.id)}
                                            onDuplicate={() => duplicateNode(node)}
                                            showDragHandle
                                        />
                                        {index < filteredNodes.length - 1 && (
                                            <div className="flex justify-center py-1">
                                                <ArrowDown className="h-4 w-4 text-muted-foreground/30" />
                                            </div>
                                        )}
                                    </motion.div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    ) : (
                        // Graph View
                        <div className="min-h-[600px] flex justify-center items-start py-8">
                            <div className="flex flex-col items-center gap-2">
                                {filteredNodes.map((node, index) => (
                                    <React.Fragment key={node.id}>
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            className={`w-80 p-4 rounded-xl border backdrop-blur-sm cursor-pointer transition-all ${CATEGORY_COLORS[node.category]?.bg || 'bg-white/5'} ${CATEGORY_COLORS[node.category]?.border || 'border-white/10'} ${!node.enabled ? 'opacity-40' : ''}`}
                                            onClick={() => setSelectedNode(node)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${TYPE_STYLES[node.type]?.icon_bg || 'bg-white/10'}`}>
                                                    <node.icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm truncate">{node.title}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{node.description}</div>
                                                </div>
                                                <Badge variant="outline" className={`text-[10px] ${TYPE_STYLES[node.type]?.badge}`}>
                                                    {node.type}
                                                </Badge>
                                            </div>
                                        </motion.div>
                                        {index < filteredNodes.length - 1 && (
                                            <div className="h-6 w-0.5 bg-gradient-to-b from-primary/50 to-primary/20" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Node Edit Dialog */}
            <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            {selectedNode && (
                                <div className={`p-2 rounded-lg ${TYPE_STYLES[selectedNode.type]?.icon_bg}`}>
                                    <selectedNode.icon className="h-5 w-5" />
                                </div>
                            )}
                            <div>
                                <div>{selectedNode?.title}</div>
                                <div className="text-sm font-normal text-muted-foreground">{selectedNode?.description}</div>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 pr-4">
                        <div className="grid gap-4 py-4">
                            {selectedNode?.params.map((param) => (
                                <div key={param.key} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor={param.key} className="font-medium">{param.label}</Label>
                                        <code className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded">{param.key}</code>
                                    </div>
                                    {param.description && (
                                        <p className="text-xs text-muted-foreground">{param.description}</p>
                                    )}
                                    {param.type === 'select' && param.options ? (
                                        <select
                                            id={param.key}
                                            value={nodes.find(n => n.id === selectedNode.id)?.params.find(p => p.key === param.key)?.value || ''}
                                            onChange={(e) => handleUpdateParam(selectedNode.id, param.key, e.target.value)}
                                            className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm"
                                        >
                                            {param.options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : param.type === 'boolean' ? (
                                        <select
                                            id={param.key}
                                            value={nodes.find(n => n.id === selectedNode.id)?.params.find(p => p.key === param.key)?.value || 'true'}
                                            onChange={(e) => handleUpdateParam(selectedNode.id, param.key, e.target.value)}
                                            className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm"
                                        >
                                            <option value="true">Yes (Enabled)</option>
                                            <option value="false">No (Disabled)</option>
                                        </select>
                                    ) : (
                                        <Input
                                            id={param.key}
                                            value={nodes.find(n => n.id === selectedNode.id)?.params.find(p => p.key === param.key)?.value || ''}
                                            onChange={(e) => handleUpdateParam(selectedNode.id, param.key, e.target.value)}
                                            className="font-mono"
                                            type={param.type === 'number' ? 'number' : 'text'}
                                        />
                                    )}
                                </div>
                            ))}
                            {(!selectedNode?.params || selectedNode.params.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No configurable parameters for this node.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSelectedNode(null)}>Cancel</Button>
                        <Button onClick={() => setSelectedNode(null)}>Apply Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Node Dialog */}
            <Dialog open={showAddNode} onOpenChange={setShowAddNode}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Node</DialogTitle>
                        <DialogDescription>Select a template to add to your pipeline</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                        {NODE_TEMPLATES.map((template, idx) => (
                            <button
                                key={idx}
                                onClick={() => addNodeFromTemplate(template)}
                                className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                            >
                                <div className={`p-2 rounded-lg ${TYPE_STYLES[template.type || 'action']?.icon_bg}`}>
                                    {template.icon && <template.icon className="h-5 w-5" />}
                                </div>
                                <div>
                                    <div className="font-medium">{template.title}</div>
                                    <div className="text-sm text-muted-foreground">{template.description}</div>
                                </div>
                                <Badge variant="outline" className="ml-auto text-xs">{template.type}</Badge>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Node Card Component
function NodeCard({
    node,
    onSelect,
    onToggle,
    onDelete,
    onDuplicate,
    showDragHandle = false
}: {
    node: LogicNode;
    onSelect: () => void;
    onToggle: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    showDragHandle?: boolean;
}) {
    const typeStyle = TYPE_STYLES[node.type] || TYPE_STYLES['action'];

    return (
        <div
            className={`group flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-white/5 transition-all cursor-pointer ${!node.enabled ? 'opacity-50' : ''} ${node.type === 'error_handler' ? 'border-red-500/20' : 'border-white/10'}`}
            onClick={onSelect}
        >
            {showDragHandle && (
                <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100" />
            )}

            <div className={`p-2 rounded-lg shrink-0 ${typeStyle.icon_bg}`}>
                <node.icon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{node.title}</span>
                    <Badge variant="outline" className={`text-[10px] hidden sm:flex ${typeStyle.badge}`}>
                        {node.type}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{node.description}</p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="secondary" className="text-[10px] font-mono">
                    {node.params.length} params
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                    <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                    {node.enabled ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                    <Trash2 className="h-3 w-3" />
                </Button>
                <Settings2 className="h-4 w-4 text-muted-foreground" />
            </div>
        </div>
    );
}
