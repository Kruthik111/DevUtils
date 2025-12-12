"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Send, Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiConfig {
    _id: string;
    name: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    payload: string;
    environmentId?: string;
}

interface Environment {
    _id: string;
    name: string;
    variables: Record<string, string>;
    isDefault: boolean;
}

interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    ok: boolean;
    error?: string;
}

interface HeaderRow {
    id: string;
    key: string;
    value: string;
}

interface QueryRow {
    id: string;
    key: string;
    value: string;
}

export default function ApiPage() {
    const router = useRouter();
    const { status } = useSession();
    const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<ApiConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
    const [showEnvModal, setShowEnvModal] = useState(false);
    const [envName, setEnvName] = useState('');
    const [envVars, setEnvVars] = useState<{ id: string; key: string; value: string }[]>([]);

    // Form state
    const [name, setName] = useState('');
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState('');
    const [headerRows, setHeaderRows] = useState<HeaderRow[]>([]);
    const [queryRows, setQueryRows] = useState<QueryRow[]>([]);
    const [payload, setPayload] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/signin');
        } else if (status === 'authenticated') {
            loadEnvironments();
            loadApiConfigs();
        }
    }, [status, router]);

    const loadEnvironments = async () => {
        try {
            const res = await fetch('/api/environments');
            if (res.ok) {
                const { environments } = await res.json();
                setEnvironments(environments);
                const defaultEnv = environments.find((e: Environment) => e.isDefault) || environments[0];
                if (defaultEnv) setSelectedEnvironment(defaultEnv);
            }
        } catch (error) {
            console.error('Error loading environments:', error);
        }
    };

    const loadApiConfigs = async () => {
        try {
            const res = await fetch('/api/api-configs');
            if (!res.ok) {
                if (res.status === 403) {
                    setError('You do not have access to this page. Please contact an admin.');
                    return;
                }
                throw new Error('Failed to load API configs');
            }
            const { apiConfigs } = await res.json();
            setApiConfigs(apiConfigs);
            
            if (apiConfigs.length > 0 && !selectedConfig) {
                loadConfig(apiConfigs[0]);
            }
        } catch (error) {
            console.error('Error loading API configs:', error);
            setError('Failed to load API configurations');
        }
    };

    const loadConfig = (config: ApiConfig) => {
        setSelectedConfig(config);
        setName(config.name);
        setMethod(config.method);
        setUrl(config.url);
        
        // Convert headers to rows
        const headers = config.headers || {};
        setHeaderRows(Object.entries(headers).map(([key, value], idx) => ({
            id: `header-${idx}`,
            key,
            value,
        })));
        
        // Convert query params to rows
        const queryParams = config.queryParams || {};
        setQueryRows(Object.entries(queryParams).map(([key, value], idx) => ({
            id: `query-${idx}`,
            key,
            value,
        })));
        
        setPayload(config.payload || '');
        setResponse(null);
        setError(null);
    };

    const substituteVariables = (text: string): string => {
        if (!selectedEnvironment || !text) return text;
        let result = text;
        Object.entries(selectedEnvironment.variables || {}).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            result = result.replace(regex, value);
        });
        return result;
    };

    const handleSave = async () => {
        if (!url.trim()) {
            setError('URL is required');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Convert rows back to objects
            const headers: Record<string, string> = {};
            headerRows.forEach(row => {
                if (row.key.trim()) {
                    headers[row.key] = row.value;
                }
            });

            const queryParams: Record<string, string> = {};
            queryRows.forEach(row => {
                if (row.key.trim()) {
                    queryParams[row.key] = row.value;
                }
            });

            const configData = {
                name: name || 'Untitled API',
                method,
                url,
                headers,
                queryParams,
                payload,
                environmentId: selectedEnvironment?._id,
            };

            let res;
            if (selectedConfig?._id) {
                res = await fetch('/api/api-configs', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: selectedConfig._id, ...configData }),
                });
            } else {
                res = await fetch('/api/api-configs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(configData),
                });
            }

            if (!res.ok) throw new Error('Failed to save API config');
            
            const { apiConfig } = await res.json();
            await loadApiConfigs();
            loadConfig(apiConfig);
        } catch (error: any) {
            setError(error.message || 'Failed to save API config');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this API configuration?')) return;

        try {
            const res = await fetch(`/api/api-configs?id=${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete API config');
            
            await loadApiConfigs();
            if (selectedConfig?._id === id) {
                createNew();
            }
        } catch (error: any) {
            setError(error.message || 'Failed to delete API config');
        }
    };

    const handleSend = async () => {
        if (!url.trim()) {
            setError('URL is required');
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            // Substitute variables
            const finalUrl = substituteVariables(url);
            
            const headers: Record<string, string> = {};
            headerRows.forEach(row => {
                if (row.key.trim()) {
                    headers[row.key] = substituteVariables(row.value);
                }
            });

            const queryParams: Record<string, string> = {};
            queryRows.forEach(row => {
                if (row.key.trim()) {
                    queryParams[row.key] = substituteVariables(row.value);
                }
            });

            const finalPayload = substituteVariables(payload);

            const res = await fetch('/api/api-configs/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method,
                    url: finalUrl,
                    headers,
                    queryParams,
                    payload: finalPayload,
                    apiConfigId: selectedConfig?._id,
                }),
            });

            const data = await res.json();
            
            if (res.ok) {
                setResponse(data);
            } else {
                setError(data.error || 'Failed to make API request');
            }
        } catch (error: any) {
            setError(error.message || 'Failed to make API request');
        } finally {
            setLoading(false);
        }
    };

    const addHeaderRow = () => {
        setHeaderRows([...headerRows, { id: `header-${Date.now()}`, key: '', value: '' }]);
    };

    const updateHeaderRow = (id: string, field: 'key' | 'value', value: string) => {
        setHeaderRows(headerRows.map(row => 
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const removeHeaderRow = (id: string) => {
        setHeaderRows(headerRows.filter(row => row.id !== id));
    };

    const addQueryRow = () => {
        setQueryRows([...queryRows, { id: `query-${Date.now()}`, key: '', value: '' }]);
    };

    const updateQueryRow = (id: string, field: 'key' | 'value', value: string) => {
        setQueryRows(queryRows.map(row => 
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const removeQueryRow = (id: string) => {
        setQueryRows(queryRows.filter(row => row.id !== id));
    };

    const createNew = () => {
        setSelectedConfig(null);
        setName('');
        setMethod('GET');
        setUrl('');
        setHeaderRows([]);
        setQueryRows([]);
        setPayload('');
        setResponse(null);
        setError(null);
    };

    const saveEnvironment = async () => {
        if (!envName.trim()) {
            alert('Environment name is required');
            return;
        }

        const variables: Record<string, string> = {};
        envVars.forEach(v => {
            if (v.key.trim()) {
                variables[v.key] = v.value;
            }
        });

        try {
            const res = await fetch('/api/environments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: envName,
                    variables,
                    isDefault: environments.length === 0,
                }),
            });

            if (res.ok) {
                await loadEnvironments();
                setShowEnvModal(false);
                setEnvName('');
                setEnvVars([]);
            }
        } catch (error) {
            console.error('Error saving environment:', error);
        }
    };

    if (status === 'loading') {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="text-foreground/60">Loading...</div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Mobile: Collapsible Sidebar */}
            <div className="md:hidden border-b border-border/50 bg-background/80 p-4 flex items-center justify-between">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary"
                >
                    {sidebarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    APIs ({apiConfigs.length})
                </button>
                <button
                    onClick={createNew}
                    className="px-4 py-2 rounded-xl bg-primary text-background"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - API List */}
                <div className={cn(
                    "w-64 bg-background/80 backdrop-blur-xl border-r border-border/50 flex flex-col",
                    "md:block",
                    sidebarOpen ? "block" : "hidden"
                )}>
                    <div className="p-4 border-b border-border/50">
                        <button
                            onClick={createNew}
                            className={cn(
                                "w-full flex items-center gap-2 px-4 py-2 rounded-xl",
                                "bg-primary text-background",
                                "hover:bg-primary/90 transition-all",
                                "font-medium"
                            )}
                        >
                            <Plus className="w-4 h-4" />
                            New API
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {apiConfigs.map((config) => (
                            <div
                                key={config._id}
                                className={cn(
                                    "p-3 rounded-xl mb-2 cursor-pointer transition-all",
                                    selectedConfig?._id === config._id
                                        ? "bg-primary/20 border border-primary/50"
                                        : "bg-background/50 border border-border/30 hover:bg-background/80"
                                )}
                                onClick={() => {
                                    loadConfig(config);
                                    setSidebarOpen(false);
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                {config.method}
                                            </span>
                                            <span className="text-sm font-medium truncate">{config.name}</span>
                                        </div>
                                        <div className="text-xs text-foreground/60 truncate">{config.url}</div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(config._id);
                                        }}
                                        className="ml-2 p-1 rounded hover:bg-red-500/20 text-red-500"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left Panel - API Configuration */}
                    <div className="flex-1 flex flex-col border-r border-border/50 overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-border/50 bg-background/80 flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="API Name"
                                    className={cn(
                                        "w-full px-4 py-2 rounded-xl border border-border/50",
                                        "bg-background/50 focus:outline-none focus:border-primary"
                                    )}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedEnvironment?._id || ''}
                                    onChange={(e) => {
                                        const env = environments.find(env => env._id === e.target.value);
                                        setSelectedEnvironment(env || null);
                                    }}
                                    className={cn(
                                        "px-4 py-2 rounded-xl border border-border/50 text-sm",
                                        "bg-background/50 focus:outline-none focus:border-primary"
                                    )}
                                >
                                    <option value="">No Environment</option>
                                    {environments.map(env => (
                                        <option key={env._id} value={env._id}>
                                            {env.name} {env.isDefault && '(Default)'}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setShowEnvModal(true)}
                                    className="p-2 rounded-xl bg-background/50 border border-border/50 hover:bg-background/80"
                                    title="Manage Environments"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl",
                                    "bg-primary text-background",
                                    "hover:bg-primary/90 transition-all",
                                    "font-medium disabled:opacity-50"
                                )}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={loading}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl",
                                    "bg-green-500 text-background",
                                    "hover:bg-green-600 transition-all",
                                    "font-medium disabled:opacity-50"
                                )}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium mb-2">Method</label>
                                        <select
                                            value={method}
                                            onChange={(e) => setMethod(e.target.value)}
                                            className={cn(
                                                "w-full px-4 py-2 rounded-xl border border-border/50",
                                                "bg-background/50 focus:outline-none focus:border-primary"
                                            )}
                                        >
                                            <option>GET</option>
                                            <option>POST</option>
                                            <option>PUT</option>
                                            <option>PATCH</option>
                                            <option>DELETE</option>
                                            <option>OPTIONS</option>
                                            <option>HEAD</option>
                                        </select>
                                    </div>
                                    <div className="flex-[3]">
                                        <label className="block text-sm font-medium mb-2">URL</label>
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://api.example.com/endpoint or {{baseUrl}}/endpoint"
                                            className={cn(
                                                "w-full px-4 py-2 rounded-xl border border-border/50",
                                                "bg-background/50 focus:outline-none focus:border-primary"
                                            )}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium">Headers</label>
                                        <button
                                            onClick={addHeaderRow}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            + Add Header
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {headerRows.map((row) => (
                                            <div key={row.id} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={row.key}
                                                    onChange={(e) => updateHeaderRow(row.id, 'key', e.target.value)}
                                                    placeholder="Header Name"
                                                    className={cn(
                                                        "flex-1 px-3 py-2 rounded-lg border border-border/50",
                                                        "bg-background/50 focus:outline-none focus:border-primary text-sm"
                                                    )}
                                                />
                                                <input
                                                    type="text"
                                                    value={row.value}
                                                    onChange={(e) => updateHeaderRow(row.id, 'value', e.target.value)}
                                                    placeholder="Header Value or {{variable}}"
                                                    className={cn(
                                                        "flex-1 px-3 py-2 rounded-lg border border-border/50",
                                                        "bg-background/50 focus:outline-none focus:border-primary text-sm"
                                                    )}
                                                />
                                                <button
                                                    onClick={() => removeHeaderRow(row.id)}
                                                    className="px-2 text-red-500 hover:bg-red-500/20 rounded-lg"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {headerRows.length === 0 && (
                                            <div className="text-sm text-foreground/60 py-2">No headers added</div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium">Query Parameters</label>
                                        <button
                                            onClick={addQueryRow}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            + Add Param
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {queryRows.map((row) => (
                                            <div key={row.id} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={row.key}
                                                    onChange={(e) => updateQueryRow(row.id, 'key', e.target.value)}
                                                    placeholder="Param Name"
                                                    className={cn(
                                                        "flex-1 px-3 py-2 rounded-lg border border-border/50",
                                                        "bg-background/50 focus:outline-none focus:border-primary text-sm"
                                                    )}
                                                />
                                                <input
                                                    type="text"
                                                    value={row.value}
                                                    onChange={(e) => updateQueryRow(row.id, 'value', e.target.value)}
                                                    placeholder="Param Value or {{variable}}"
                                                    className={cn(
                                                        "flex-1 px-3 py-2 rounded-lg border border-border/50",
                                                        "bg-background/50 focus:outline-none focus:border-primary text-sm"
                                                    )}
                                                />
                                                <button
                                                    onClick={() => removeQueryRow(row.id)}
                                                    className="px-2 text-red-500 hover:bg-red-500/20 rounded-lg"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {queryRows.length === 0 && (
                                            <div className="text-sm text-foreground/60 py-2">No query params added</div>
                                        )}
                                    </div>
                                </div>

                                {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Payload (JSON)</label>
                                        <textarea
                                            value={payload}
                                            onChange={(e) => setPayload(e.target.value)}
                                            placeholder='{"key": "value"} or use {{variable}}'
                                            rows={10}
                                            className={cn(
                                                "w-full px-4 py-2 rounded-xl border border-border/50 font-mono text-sm",
                                                "bg-background/50 focus:outline-none focus:border-primary"
                                            )}
                                        />
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Response (Desktop) / Below (Mobile) */}
                    <div className={cn(
                        "w-full md:w-1/2 flex flex-col border-t md:border-t-0 md:border-l border-border/50",
                        "h-1/2 md:h-auto"
                    )}>
                        <div className="p-4 border-b border-border/50 bg-background/80">
                            <h3 className="font-semibold">Response</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : response ? (
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm font-medium mb-2">Status</div>
                                        <div className={cn(
                                            "inline-block px-3 py-1 rounded-lg text-sm font-mono",
                                            response.ok ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                                        )}>
                                            {response.status} {response.statusText}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium mb-2">Headers</div>
                                        <pre className="p-4 rounded-xl bg-background/50 border border-border/50 text-xs font-mono overflow-x-auto">
                                            {JSON.stringify(response.headers, null, 2)}
                                        </pre>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium mb-2">Body</div>
                                        <pre className="p-4 rounded-xl bg-background/50 border border-border/50 text-xs font-mono overflow-x-auto">
                                            {typeof response.data === 'string' 
                                                ? response.data 
                                                : JSON.stringify(response.data, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-foreground/60">
                                    Response will appear here
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Environment Modal */}
            {showEnvModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Manage Environments</h2>
                            <button
                                onClick={() => {
                                    setShowEnvModal(false);
                                    setEnvName('');
                                    setEnvVars([]);
                                }}
                                className="p-2 rounded-lg hover:bg-background/80"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Environment Name</label>
                                <input
                                    type="text"
                                    value={envName}
                                    onChange={(e) => setEnvName(e.target.value)}
                                    placeholder="e.g., Development, Production"
                                    className={cn(
                                        "w-full px-4 py-2 rounded-xl border border-border/50",
                                        "bg-background/50 focus:outline-none focus:border-primary"
                                    )}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium">Variables</label>
                                    <button
                                        onClick={() => setEnvVars([...envVars, { id: `var-${Date.now()}`, key: '', value: '' }])}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        + Add Variable
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {envVars.map((v) => (
                                        <div key={v.id} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={v.key}
                                                onChange={(e) => setEnvVars(envVars.map(v2 => v2.id === v.id ? { ...v2, key: e.target.value } : v2))}
                                                placeholder="Variable Name"
                                                className={cn(
                                                    "flex-1 px-3 py-2 rounded-lg border border-border/50",
                                                    "bg-background/50 focus:outline-none focus:border-primary text-sm"
                                                )}
                                            />
                                            <input
                                                type="text"
                                                value={v.value}
                                                onChange={(e) => setEnvVars(envVars.map(v2 => v2.id === v.id ? { ...v2, value: e.target.value } : v2))}
                                                placeholder="Variable Value"
                                                className={cn(
                                                    "flex-1 px-3 py-2 rounded-lg border border-border/50",
                                                    "bg-background/50 focus:outline-none focus:border-primary text-sm"
                                                )}
                                            />
                                            <button
                                                onClick={() => setEnvVars(envVars.filter(v2 => v2.id !== v.id))}
                                                className="px-2 text-red-500 hover:bg-red-500/20 rounded-lg"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={saveEnvironment}
                                className={cn(
                                    "w-full px-4 py-2 rounded-xl",
                                    "bg-primary text-background",
                                    "hover:bg-primary/90 transition-all",
                                    "font-medium"
                                )}
                            >
                                Create Environment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
