import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { Save, Play, Plus, Trash2, Settings, MessageSquare, ArrowRight } from 'lucide-react';

const INITIAL_NODES = [
    {
        id: 'start',
        type: 'input',
        data: { label: 'Start Flow' },
        position: { x: 250, y: 5 },
        style: { background: '#10b981', color: 'white', border: 'none', width: 100 }
    },
    {
        id: 'screen-1',
        type: 'screenNode',
        data: {
            title: 'Welcome Screen',
            body: 'Welcome to our service.',
            inputs: []
        },
        position: { x: 200, y: 100 },
    }
];

const ScreenNode = ({ data, isConnectable }) => {
    return (
        <div className="bg-white rounded-lg border-2 border-slate-200 shadow-sm min-w-[200px] overflow-hidden">
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-slate-400" />

            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Screen</span>
                <Settings className="w-3 h-3 text-slate-400" />
            </div>

            <div className="p-3">
                <div className="font-bold text-sm text-slate-800 mb-1">{data.title}</div>
                <div className="text-xs text-slate-500 line-clamp-2">{data.body}</div>

                {data.inputs && data.inputs.length > 0 && (
                    <div className="mt-3 space-y-1">
                        {data.inputs.map((input, i) => (
                            <div key={i} className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                {input.label} ({input.type})
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex justify-end">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    Next <ArrowRight className="w-3 h-3" />
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-emerald-500" />
        </div>
    );
};

export default function FlowBuilder({ initialData, onSave, onCancel }) {
    const nodeTypes = useMemo(() => ({ screenNode: ScreenNode }), []);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || []);
    const [selectedNode, setSelectedNode] = useState(null);

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const addScreen = () => {
        const id = `screen-${uuidv4().slice(0, 8)}`;
        const newNode = {
            id,
            type: 'screenNode',
            position: { x: 250, y: nodes.length * 100 + 50 },
            data: {
                title: 'New Screen',
                body: 'Text...',
                inputs: []
            },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const updateSelectedNode = (field, value) => {
        if (!selectedNode) return;
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        data: { ...node.data, [field]: value },
                    };
                }
                return node;
            })
        );
        setSelectedNode((prev) => ({ ...prev, data: { ...prev.data, [field]: value } }));
    };

    const addInputToNode = (type) => {
        if (!selectedNode) return;
        const newInputs = [...(selectedNode.data.inputs || []), { type, label: 'New Input', id: uuidv4().slice(0, 4) }];
        updateSelectedNode('inputs', newInputs);
    };

    const generateJSON = () => {
        // Basic compilation logic from Graph to WhatsApp Flow JSON 3.0
        // reliable on the "edges" to determining the routing

        const screens = nodes
            .filter(n => n.type === 'screenNode')
            .map(node => {
                // Find outgoing edge
                const edge = edges.find(e => e.source === node.id);
                const nextScreenId = edge ? edge.target : null;

                const children = [
                    {
                        type: "Text",
                        label: node.data.body
                    }
                ];

                // Add Inputs
                if (node.data.inputs) {
                    node.data.inputs.forEach(inp => {
                        if (inp.type === 'text') {
                            children.push({
                                type: "TextInput",
                                label: inp.label,
                                name: `input_${inp.id}`,
                                required: true
                            });
                        } else if (inp.type === 'option') {
                            children.push({
                                type: "RadioButtonsGroup",
                                name: `radio_${inp.id}`,
                                "data-source": [
                                    { id: "opt1", title: "Option 1" },
                                    { id: "opt2", title: "Option 2" }
                                ]
                            });
                        }
                    });
                }

                // Add Footer with Button to Next
                const footerChildren = [];
                if (nextScreenId) {
                    footerChildren.push({
                        type: "Footer",
                        label: "Continue",
                        "on-click-action": {
                            name: "navigate",
                            next: {
                                type: "screen",
                                name: nextScreenId
                            }
                        }
                    });
                } else {
                    // End of flow -> Complete
                    footerChildren.push({
                        type: "Footer",
                        label: "Submit",
                        "on-click-action": {
                            name: "complete",
                            payload: {
                                // collect all inputs
                                ...node.data.inputs.reduce((acc, inp) => ({ ...acc, [inp.label]: `\${form.input_${inp.id}}` }), {})
                            }
                        }
                    });
                }

                return {
                    id: node.id,
                    title: node.data.title,
                    terminal: !nextScreenId,
                    layout: {
                        type: "SingleColumnLayout",
                        children: [
                            {
                                type: "Form",
                                name: "form",
                                children: [
                                    ...children,
                                    ...footerChildren
                                ]
                            }
                        ]
                    }
                };
            });

        const flowJSON = {
            version: "3.0",
            screens: screens
        };

        return flowJSON;
    };

    const handleSave = () => {
        const json = generateJSON();
        onSave({
            flowJSON: json,
            graphData: { nodes, edges }
        });
    };

    return (
        <div className="h-full flex border border-slate-200 rounded-xl overflow-hidden shadow-2xl bg-slate-50">

            {/* Sidebar / Properties Panel */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800">Flow Builder</h3>
                    <p className="text-xs text-slate-500">Drag connections to link screens.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {!selectedNode ? (
                        <div className="text-center text-slate-400 py-10">
                            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Select a screen to edit properties</p>
                        </div>
                    ) : selectedNode.type === 'screenNode' ? (
                        <div className="space-y-4 animate-in fade-in">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Screen Title</label>
                                <input
                                    type="text"
                                    value={selectedNode.data.title}
                                    onChange={(e) => updateSelectedNode('title', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Body Text</label>
                                <textarea
                                    rows={3}
                                    value={selectedNode.data.body}
                                    onChange={(e) => updateSelectedNode('body', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">User Inputs</label>
                                <div className="space-y-2 mb-3">
                                    {selectedNode.data.inputs?.map((inp, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded text-sm">
                                            <span>{inp.label}</span>
                                            <span className="text-[10px] uppercase bg-slate-200 px-1 rounded">{inp.type}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => addInputToNode('text')} className="flex-1 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded hover:bg-blue-100 border border-blue-200">
                                        + Text Input
                                    </button>
                                    <button onClick={() => addInputToNode('option')} className="flex-1 py-1 bg-purple-50 text-purple-600 text-xs font-medium rounded hover:bg-purple-100 border border-purple-200">
                                        + Options
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                                    setSelectedNode(null);
                                }}
                                className="w-full py-2 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 rounded-lg text-sm mt-8"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Screen
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500">Properties not available for this node type.</div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-2">
                    <button onClick={onCancel} className="flex-1 py-3 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-medium shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition">
                        <Save className="w-5 h-5" /> Save Flow
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onNodeClick={(_, node) => setSelectedNode(node)}
                    onPaneClick={() => setSelectedNode(null)}
                    fitView
                >
                    <Background color="#e2e8f0" gap={16} />
                    <Controls />
                    <MiniMap />
                    <Panel position="top-right" className="bg-white p-2 rounded-lg shadow-md border border-slate-100 flex gap-2">
                        <button onClick={addScreen} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs hover:bg-slate-700">
                            <Plus className="w-3 h-3" /> Add Screen
                        </button>
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
}
