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
    Panel,
    MarkerType
} from 'reactflow';
import { createPortal } from 'react-dom';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import {
    MessageSquare, Image, Video, FileText, Mic, MapPin, List, Type, Hash, Mail, Globe, Calendar, Clock, Phone, CreditCard,
    GitFork, Bot, Save, ArrowLeft, MoreHorizontal, GripVertical, Plus, Trash2, Youtube, Flag,
    Bold, Italic, Strikethrough, Code as CodeIcon, X, Smile, Pen, FolderOpen
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';

// Icon mapping for steps to avoid storing React elements in DB
const STEP_ICONS = {
    'Text': MessageSquare,
    'Text Message': MessageSquare,
    'Image': Image,
    'Video': Video,
    'YouTube': Youtube,
    'File': FileText,
    'Audio': Mic,
    'Location': MapPin,
    'Quick Reply': MessageSquare,
    'List': List,
    'Text Input': Type,
    'Number Input': Hash,
    'Email Input': Mail,
    'Website Input': Globe,
    'Date Input': Calendar,
    'Time Input': Clock,
    'Phone Input': Phone,
    'File Input': FileText,
    'Link': CreditCard,
    'Condition': GitFork,
    'Chatbot': Bot,
    'Webhook': Globe
};

// WhatsApp Text Editor Component
const TextEditor = ({ value, onChange, showStaticVariables, flowVariables = [] }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showVariablePicker, setShowVariablePicker] = useState(false);

    // Gather variables from all nodes in the flow
    // const [flowVariables, setFlowVariables] = useState([]);

    // Update variables list whenever nodes change (passed from parent or context in a real app)
    // For now, we'll traverse the nodes passed as props if we were lifting state, but here we can't easily access 'nodes' directly 
    // inside this component without prop drilling or context.
    // OPTIMIZATION: In a real app, calculate 'availableVariables' in the parent BotFlowBuilder and pass it down.

    // For this implementation, let's assume valid variables are what we see. 
    // We'll refactor slightly to accept 'availableVariables' prop.

    const SYSTEM_VARIABLES = [
        { label: 'Name', value: '{{contact.name}}' },
        { label: 'First Name', value: '{{contact.first_name}}' },
        { label: 'Phone Number', value: '{{contact.phone}}' },
        { label: 'WhatsApp ID', value: '{{contact.wa_id}}' },
    ];

    const insertText = (textToInsert) => {
        const textarea = document.getElementById('whatsapp-editor');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const before = text.substring(0, start);
        const after = text.substring(end);

        const newText = `${before}${textToInsert}${after}`;
        onChange(newText);

        // Restore focus
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + textToInsert.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const insertFormat = (char) => {
        const textarea = document.getElementById('whatsapp-editor');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = `${before}${char}${selection}${char}${after}`;
        onChange(newText);

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + char.length, end + char.length);
        }, 0);
    };

    const onEmojiClick = (emojiData) => {
        insertText(emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const onVariableClick = (varValue) => {
        insertText(` ${varValue} `);
        setShowVariablePicker(false);
    };

    return (
        <div className="border border-slate-200 rounded-lg bg-white relative">
            <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50 rounded-t-lg">
                <button onClick={() => insertFormat('*')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Bold">
                    <Bold className="w-4 h-4" />
                </button>
                <button onClick={() => insertFormat('_')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Italic">
                    <Italic className="w-4 h-4" />
                </button>
                <button onClick={() => insertFormat('~')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Strikethrough">
                    <Strikethrough className="w-4 h-4" />
                </button>
                <button onClick={() => insertFormat('```')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Monospace">
                    <CodeIcon className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-slate-300 mx-1"></div>
                <button
                    id="emoji-trigger-btn"
                    onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowVariablePicker(false);
                    }}
                    className={`p-1.5 rounded text-slate-600 ${showEmojiPicker ? 'bg-slate-200 text-emerald-600' : 'hover:bg-slate-200'}`}
                    title="Emoji"
                >
                    <Smile className="w-4 h-4" />
                </button>

                {showStaticVariables && (
                    <button
                        id="var-trigger-btn"
                        onClick={() => {
                            setShowVariablePicker(!showVariablePicker);
                            setShowEmojiPicker(false);
                        }}
                        className={`p-1.5 rounded text-slate-600 ${showVariablePicker ? 'bg-slate-200 text-emerald-600' : 'hover:bg-slate-200'}`}
                        title="Static Variables"
                    >
                        <Pen className="w-4 h-4" />
                    </button>
                )}
            </div>

            {showEmojiPicker && createPortal(
                <div
                    className="fixed z-[9999] shadow-2xl border border-slate-200 rounded-lg"
                    style={{
                        top: document.getElementById('emoji-trigger-btn')?.getBoundingClientRect().top + 40 || '50%',
                        left: (document.getElementById('emoji-trigger-btn')?.getBoundingClientRect().left || '50%') - 320, // Shift left by width
                    }}
                >
                    <div
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setShowEmojiPicker(false)}
                    ></div>
                    <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        width={300}
                        height={350}
                        searchDisabled={false}
                        skinTonesDisabled
                        previewConfig={{ showPreview: false }}
                    />
                </div>,
                document.body
            )}

            {showVariablePicker && createPortal(
                <div
                    className="fixed z-[9999] shadow-2xl border border-slate-200 rounded-lg bg-white w-64 overflow-hidden"
                    style={{
                        top: document.getElementById('var-trigger-btn')?.getBoundingClientRect().top + 40 || '50%',
                        left: (document.getElementById('var-trigger-btn')?.getBoundingClientRect().left || '50%') - 200,
                    }}
                >
                    <div className="fixed inset-0 z-[-1]" onClick={() => setShowVariablePicker(false)}></div>
                    <div className="p-3 bg-slate-50 border-b border-slate-100 font-bold text-xs text-slate-500 uppercase tracking-wider">
                        Insert Variable
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1 text-left">
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 bg-slate-50">SYSTEM VARIABLES</div>
                        {SYSTEM_VARIABLES.map((v, i) => (
                            <button
                                key={i}
                                onClick={() => onVariableClick(v.value)}
                                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors flex items-center justify-between group"
                            >
                                <span>{v.label}</span>
                                <span className="text-xs text-slate-400 font-mono group-hover:text-emerald-500">{v.value}</span>
                            </button>
                        ))}

                        {flowVariables.length > 0 && (
                            <>
                                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 bg-slate-50 mt-2">FLOW VARIABLES</div>
                                {flowVariables.map((v, i) => (
                                    <button
                                        key={`flow-${i}`}
                                        onClick={() => onVariableClick(v.value)}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors flex items-center justify-between group"
                                    >
                                        <span>{v.label}</span>
                                        <span className="text-xs text-slate-400 font-mono group-hover:text-emerald-500">{v.value}</span>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}

            <textarea
                id="whatsapp-editor"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-3 text-sm focus:outline-none min-h-[120px] resize-y font-sans rounded-b-lg"
                placeholder="Enter your message..."
            />
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between rounded-b-lg">
                <span>Supports Markdown</span>
                <span>{value.length} chars</span>
            </div>
        </div>
    );
};

const QuickReplyEditor = ({ step, onChange, showStaticVariables, flowVariables = [] }) => {
    const addButton = () => {
        const currentButtons = step.buttons || [];
        if (currentButtons.length >= 3) return; // WhatsApp limit
        onChange('buttons', [...currentButtons, { label: 'New Button' }]);
    };

    const removeButton = (idx) => {
        const currentButtons = step.buttons || [];
        onChange('buttons', currentButtons.filter((_, i) => i !== idx));
    };

    const updateButtonLabel = (idx, val) => {
        const currentButtons = [...(step.buttons || [])];
        currentButtons[idx] = { ...currentButtons[idx], label: val };
        onChange('buttons', currentButtons);
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Message Text</label>
                <TextEditor
                    value={step.content}
                    onChange={(val) => onChange('content', val)}
                    showStaticVariables={showStaticVariables}
                    flowVariables={flowVariables}
                />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Buttons (Max 3)</label>
                    <button
                        onClick={addButton}
                        disabled={(step.buttons?.length || 0) >= 3}
                        className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded font-bold hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + Add Button
                    </button>
                </div>

                <div className="space-y-2">
                    {step.buttons && step.buttons.map((btn, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="bg-emerald-100 text-emerald-600 w-6 h-6 flex items-center justify-center rounded text-xs font-bold shrink-0">
                                {i + 1}
                            </div>
                            <input
                                type="text"
                                value={btn.label}
                                onChange={(e) => updateButtonLabel(i, e.target.value)}
                                placeholder="Button Label"
                                className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                                maxLength={20}
                            />
                            <button
                                onClick={() => removeButton(i)}
                                className="text-slate-400 hover:text-red-500 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {(!step.buttons || step.buttons.length === 0) && (
                        <div className="text-center text-xs text-slate-400 py-2 italic">
                            No buttons added.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ListEditor = ({ step, onChange, showStaticVariables, flowVariables = [] }) => {
    const addOption = () => {
        const currentOptions = step.options || [];
        if (currentOptions.length >= 10) return; // WhatsApp limit for lists
        onChange('options', [...currentOptions, { title: 'New Option', description: '' }]);
    };

    const removeOption = (idx) => {
        const currentOptions = step.options || [];
        onChange('options', currentOptions.filter((_, i) => i !== idx));
    };

    const updateOption = (idx, field, val) => {
        const currentOptions = [...(step.options || [])];
        currentOptions[idx] = { ...currentOptions[idx], [field]: val };
        onChange('options', currentOptions);
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Message Text</label>
                <TextEditor
                    value={step.content}
                    onChange={(val) => onChange('content', val)}
                    showStaticVariables={showStaticVariables}
                    flowVariables={flowVariables}
                />
            </div>

            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Button Text</label>
                <input
                    type="text"
                    value={step.buttonText || 'Select an option'}
                    onChange={(e) => onChange('buttonText', e.target.value)}
                    placeholder="Button text (e.g., 'View Options')"
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                    maxLength={20}
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">List Options (Max 10)</label>
                    <button
                        onClick={addOption}
                        disabled={step.options && step.options.length >= 10}
                        className="text-xs px-2 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add Option
                    </button>
                </div>
                <div className="space-y-2">
                    {(step.options || []).map((opt, i) => (
                        <div key={i} className="border border-slate-200 rounded p-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="bg-amber-100 text-amber-600 w-6 h-6 flex items-center justify-center rounded text-xs font-bold shrink-0">
                                    {i + 1}
                                </div>
                                <input
                                    type="text"
                                    value={opt.title}
                                    onChange={(e) => updateOption(i, 'title', e.target.value)}
                                    placeholder="Option Title"
                                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                                    maxLength={24}
                                />
                                <button
                                    onClick={() => removeOption(i)}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={opt.description || ''}
                                onChange={(e) => updateOption(i, 'description', e.target.value)}
                                placeholder="Description (optional)"
                                className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-300 text-slate-600"
                                maxLength={72}
                            />
                        </div>
                    ))}
                    {(!step.options || step.options.length === 0) && (
                        <div className="text-center text-xs text-slate-400 py-2 italic">
                            No options added.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MediaEditor = ({ step, onChange, showStaticVariables, flowVariables = [] }) => {
    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp Media ID</label>
                <input
                    type="text"
                    value={step.mediaId || ''}
                    onChange={(e) => onChange('mediaId', e.target.value)}
                    placeholder="Enter Media ID..."
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Upload files in the Media tab to get their IDs.</p>
            </div>

            {['Image', 'Video', 'File'].includes(step.type) && (
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Caption / Filename</label>
                    <TextEditor
                        value={step.content}
                        onChange={(val) => onChange('content', val)}
                        showStaticVariables={showStaticVariables}
                        flowVariables={flowVariables}
                    />
                </div>
            )}
        </div>
    );
};

const LocationEditor = ({ step, onChange, showStaticVariables, flowVariables = [] }) => {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Latitude</label>
                    <input
                        type="text"
                        value={step.latitude || ''}
                        onChange={(e) => onChange('latitude', e.target.value)}
                        placeholder="e.g. -33.8688"
                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Longitude</label>
                    <input
                        type="text"
                        value={step.longitude || ''}
                        onChange={(e) => onChange('longitude', e.target.value)}
                        placeholder="e.g. 151.2093"
                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Location Name</label>
                <input
                    type="text"
                    value={step.name || ''}
                    onChange={(e) => onChange('name', e.target.value)}
                    placeholder="e.g. Sydney Opera House"
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                />
            </div>
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Address</label>
                <input
                    type="text"
                    value={step.address || ''}
                    onChange={(e) => onChange('address', e.target.value)}
                    placeholder="Enter full address..."
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                />
            </div>
        </div>
    );
};

const YouTubeEditor = ({ step, onChange }) => {
    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">YouTube URL</label>
                <input
                    type="text"
                    value={step.url || ''}
                    onChange={(e) => onChange('url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">WhatsApp will automatically show a video preview.</p>
            </div>
        </div>
    );
};

// Custom Node for Bot Flow
const BotNode = ({ data, isConnectable, selected }) => {
    // Special rendering for Start Node
    if (data.isStart) {
        return (
            <div className={`bg-white rounded-2xl border-2 shadow-sm min-w-[180px] flex items-center p-4 gap-3 transition-all duration-200 ${selected ? 'border-emerald-500 shadow-emerald-100' : 'border-slate-100 hover:border-slate-300'}`}>
                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
                    <Flag className="w-5 h-5 fill-current" />
                </div>
                <div>
                    <div className="text-sm font-bold text-slate-800">Start</div>
                    <div className="text-[10px] font-medium text-slate-500">Entry Point</div>
                </div>

                {/* Only Source Handle for Start Node */}
                <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-4 h-4 bg-emerald-500 border-2 border-white !-right-2" />
            </div>
        );
    }

    // Standard Node
    return (
        <div className={`bg-white rounded-2xl border-2 shadow-sm min-w-[280px] overflow-hidden transition-all duration-200 ${selected ? 'border-emerald-500 shadow-emerald-100' : 'border-slate-100 hover:border-slate-300'}`}>
            {/* Input Handle */}
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-4 h-4 bg-slate-400 border-2 border-white !-left-2" />

            {/* Header */}
            <div className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between ${data.isStart ? 'bg-emerald-50/50' : 'bg-white'}`}>
                <div className="flex items-center gap-2">
                    {data.isStart && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                            Start
                        </span>
                    )}
                    <div className="font-bold text-slate-800 text-sm">{data.label}</div>
                </div>
                <div className="flex items-center gap-2">
                    {!data.isStart && (
                        <button
                            className="text-slate-400 hover:text-red-500 transition"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent node selection when clicking delete
                                if (data.onDelete) data.onDelete();
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <button className="text-slate-400 hover:text-slate-600 transition"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-2 space-y-2 bg-slate-50/50 min-h-[60px]">
                {data.steps && data.steps.length > 0 ? (
                    data.steps.map((step, idx) => {
                        const IconComp = STEP_ICONS[step.type] || MessageSquare;
                        return (
                            <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 group">
                                <div className={`p-2 rounded-lg ${step.iconBg || 'bg-slate-100'} ${step.iconColor || 'text-slate-500'}`}>
                                    <IconComp className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-slate-700">{step.type}</div>
                                    <div className="text-xs text-slate-500 truncate">{step.content}</div>
                                    {step.type === 'Quick Reply' && step.buttons && step.buttons.length > 0 && (
                                        <div className="flex flex-col gap-2 mt-2">
                                            {step.buttons.map((btn, i) => (
                                                <div key={i} className="relative flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 group/btn">
                                                    <span className="text-xs font-medium text-slate-700">{btn.label}</span>
                                                    <Handle
                                                        type="source"
                                                        position={Position.Right}
                                                        id={`handle-${idx}-${i}`}
                                                        isConnectable={isConnectable}
                                                        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white !-right-3 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                                                    />
                                                </div>
                                            ))}
                                            <div className="relative flex items-center justify-between bg-white border border-slate-200 border-dashed rounded-lg px-3 py-2 mt-2">
                                                <span className="text-xs font-medium text-slate-400 italic">Default</span>
                                                <Handle
                                                    type="source"
                                                    position={Position.Right}
                                                    id={`handle-${idx}-default`}
                                                    isConnectable={isConnectable}
                                                    className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !-right-3"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {step.type === 'List' && step.options && step.options.length > 0 && (
                                        <div className="flex flex-col gap-2 mt-2">
                                            {step.options.map((opt, i) => (
                                                <div key={i} className="relative flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 group/opt">
                                                    <span className="text-xs font-medium text-slate-700">{opt.title}</span>
                                                    <Handle
                                                        type="source"
                                                        position={Position.Right}
                                                        id={`handle-${idx}-${i}`}
                                                        isConnectable={isConnectable}
                                                        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white !-right-3 opacity-0 group-hover/opt:opacity-100 transition-opacity"
                                                    />
                                                </div>
                                            ))}
                                            <div className="relative flex items-center justify-between bg-white border border-slate-200 border-dashed rounded-lg px-3 py-2 mt-2">
                                                <span className="text-xs font-medium text-slate-400 italic">Default</span>
                                                <Handle
                                                    type="source"
                                                    position={Position.Right}
                                                    id={`handle-${idx}-default`}
                                                    isConnectable={isConnectable}
                                                    className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !-right-3"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab" />
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-4 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        Drop items here
                    </div>
                )}
            </div>

            {/* Output Handle */}
            {(!data.steps || !data.steps.some(step => step.type === 'Quick Reply' || step.type === 'List')) && (
                <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-4 h-4 bg-emerald-500 border-2 border-white !-right-2" />
            )}
        </div>
    );
};

const INITIAL_NODES = [
    {
        id: 'start',
        type: 'botNode',
        position: { x: 100, y: 100 },
        deletable: false, // Prevent deletion via keyboard
        data: {
            label: 'Start',
            isStart: true,
            steps: []
        }
    }
];

const INITIAL_EDGES = [];

export default function BotFlowBuilder() {
    const nodeTypes = useMemo(() => ({ botNode: BotNode }), []);
    const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

    // Re-attach delete handlers to nodes when they are loaded/initialized if they are missing
    React.useEffect(() => {
        setNodes((nds) => nds.map(node => {
            if (!node.data.isStart && !node.data.onDelete) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        onDelete: () => setNodes((current) => current.filter(n => n.id !== node.id))
                    }
                };
            }
            return node;
        }));
    }, [setNodes]);

    // Load saved flows on mount for Chatbot step dropdown
    React.useEffect(() => {
        const loadFlowsList = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/whatsapp/flows/local');
                setSavedFlows(res.data);
            } catch (err) {
                console.error('Failed to load flows list:', err);
            }
        };
        loadFlowsList();
    }, []);

    const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

    // Sidebar Items
    const sidebarItems = [
        {
            category: 'Messages', items: [
                { label: 'Text', icon: <MessageSquare className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Image', icon: <Image className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Video', icon: <Video className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'YouTube', icon: <Youtube className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'File', icon: <FileText className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Audio', icon: <Mic className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Location', icon: <MapPin className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ]
        },
        {
            category: 'Choices', items: [
                { label: 'Quick Reply', icon: <MessageSquare className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'List', icon: <List className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
            ]
        },
        {
            category: 'Inputs', items: [
                { label: 'Text Input', icon: <Type className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Number Input', icon: <Hash className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Email Input', icon: <Mail className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Website Input', icon: <Globe className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Date Input', icon: <Calendar className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Time Input', icon: <Clock className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Phone Input', icon: <Phone className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'File Input', icon: <FileText className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
            ]
        },
        {
            category: 'Payments', items: [
                { label: 'Link', icon: <CreditCard className="w-4 h-4" />, color: 'text-pink-600', bg: 'bg-pink-50' },
            ]
        },
        {
            category: 'Logic', items: [
                { label: 'Condition', icon: <GitFork className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Chatbot', icon: <Bot className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ]
        },
        {
            category: 'Integrations', items: [
                { label: 'Webhook', icon: <Globe className="w-4 h-4" />, color: 'text-slate-600', bg: 'bg-slate-50' },
            ]
        },
    ];

    const addNode = (item) => {
        const id = uuidv4().slice(0, 8);
        const groupCount = nodes.filter(n => !n.data.isStart).length + 1;

        // Find position for new node: relative to the last node or start node
        let position = { x: 400, y: 100 };
        if (nodes.length > 0) {
            const lastNode = nodes[nodes.length - 1];
            position = {
                x: lastNode.position.x + 350,
                y: lastNode.position.y
            };
        }

        const newNode = {
            id: `node-${id}`,
            type: 'botNode',
            position: position,
            data: {
                label: `Group #${groupCount}`,
                onDelete: () => {
                    setNodes((currentNodes) => currentNodes.filter(n => n.id !== `node-${id}`));
                },
                steps: item ? [{
                    type: item.label,
                    content: `Configure ${item.label}`,
                    icon: item.icon,
                    iconBg: item.bg,
                    iconColor: item.color
                }] : []
            },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const [flowName, setFlowName] = useState('Chatbot Flow 1');
    const [staticVarsEnabled, setStaticVarsEnabled] = useState(false);

    const [selectedNode, setSelectedNode] = useState(null);

    // Persistence State
    const [flowId, setFlowId] = useState(null);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [savedFlows, setSavedFlows] = useState([]);
    const [targetFlowNodes, setTargetFlowNodes] = useState({}); // Store nodes by flow ID

    const saveFlow = async () => {
        try {
            // Remove circular React elements (icons) from nodes before saving
            const sanitizedNodes = nodes.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    steps: (node.data.steps || []).map(step => {
                        // eslint-disable-next-line no-unused-vars
                        const { icon, ...rest } = step;
                        return rest;
                    })
                }
            }));

            const graphData = JSON.stringify({ nodes: sanitizedNodes, edges });
            const payload = {
                id: flowId || '',
                name: flowName,
                graph_data: graphData
            };
            const res = await axios.post('http://localhost:8080/api/whatsapp/flows/local', payload);
            if (res.data.id) {
                setFlowId(res.data.id);
                // Simple toast or alert
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-5';
                toast.textContent = 'Flow Saved Successfully!';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save flow: ' + (err.response?.data?.error || err.message));
        }
    };

    const fetchFlows = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/whatsapp/flows/local');
            setSavedFlows(res.data);
            setShowLoadModal(true);
        } catch (err) {
            console.error(err);
            alert('Failed to list flows');
        }
    };

    const loadFlow = async (id) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/whatsapp/flows/local/${id}`);
            const { name, graph_data } = res.data;
            setFlowName(name);
            setFlowId(id);
            if (graph_data) {
                const flow = graph_data; // already object via json.RawMessage
                setNodes(flow.nodes || []);
                setEdges(flow.edges || []);
            }
            setShowLoadModal(false);
            setSelectedNode(null);
        } catch (err) {
            console.error(err);
            alert('Failed to load flow');
        }
    };

    const deleteFlow = async (id, name) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8080/api/whatsapp/flows/local/${id}`);
            // Refresh the flows list
            const res = await axios.get('http://localhost:8080/api/whatsapp/flows/local');
            setSavedFlows(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to delete flow');
        }
    };

    const updateNodeData = (nodeId, newData) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...node.data, ...newData } };
                }
                return node;
            })
        );
        // Also update local selected node state to reflect changes immediately in UI
        if (selectedNode && selectedNode.id === nodeId) {
            setSelectedNode((prev) => ({ ...prev, data: { ...prev.data, ...newData } }));
        }
    };

    const updateStep = (nodeId, stepIndex, field, value) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    const newSteps = [...node.data.steps];
                    newSteps[stepIndex] = { ...newSteps[stepIndex], [field]: value };
                    return { ...node, data: { ...node.data, steps: newSteps } };
                }
                return node;
            })
        );
        // Sync selected node
        if (selectedNode && selectedNode.id === nodeId) {
            const newSteps = [...selectedNode.data.steps];
            newSteps[stepIndex] = { ...newSteps[stepIndex], [field]: value };
            setSelectedNode((prev) => ({ ...prev, data: { ...prev.data, steps: newSteps } }));
        }
    };

    return (
        <div className="flex h-full bg-slate-50">
            {/* Canvas Area */}
            <div className="flex-1 h-full relative">
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
                    fitViewOptions={{ maxZoom: 1 }}
                    attributionPosition="bottom-left"
                >
                    <Background color="#f1f5f9" gap={20} size={1} />
                    <Controls className="bg-white border border-slate-200 shadow-sm p-1 rounded-lg" />
                    <MiniMap className="bg-white border border-slate-200 shadow-sm rounded-lg" maskColor="#cbd5e1" />

                    <Panel position="top-left" className="m-4">
                        <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
                            <input
                                type="text"
                                value={flowName}
                                onChange={(e) => setFlowName(e.target.value)}
                                className="font-bold text-slate-800 px-2 bg-transparent hover:bg-slate-50 focus:bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 rounded-lg outline-none transition-all w-48"
                            />
                            <div className="h-6 w-px bg-slate-200"></div>
                            <button
                                onClick={fetchFlows}
                                className="flex items-center gap-2 px-2 py-1 text-slate-600 hover:bg-slate-50 rounded text-xs font-medium transition"
                                title="Open Flow"
                            >
                                <FolderOpen className="w-4 h-4" /> Open
                            </button>
                            <div className="h-6 w-px bg-slate-200"></div>
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-xs text-emerald-600"
                                        checked={staticVarsEnabled}
                                        onChange={(e) => setStaticVarsEnabled(e.target.checked)}
                                    />
                                    Static Variables
                                </label>
                                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                                    <input type="checkbox" className="toggle toggle-xs text-emerald-600" /> Global Variables
                                </label>
                            </div>
                            <div className="h-6 w-px bg-slate-200"></div>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 border border-emerald-200 transition-colors">
                                <Bot className="w-3 h-3" /> Test Bot
                            </button>
                        </div>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Right Sidebar - Dynamic Content */}
            <div className="w-80 bg-white border-l border-slate-200 shadow-xl z-20 flex flex-col h-full right-0 transition-all duration-300">
                {selectedNode ? (
                    /* PROPERTIES PANEL */
                    <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h3 className="text-sm font-bold text-slate-800">Configuration</h3>
                            <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
                            {/* Node Label Edit */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Node Title</label>
                                <input
                                    type="text"
                                    value={selectedNode.data.label}
                                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                />
                            </div>

                            <div className="h-px bg-slate-100 w-full"></div>

                            <div className="space-y-4">
                                {selectedNode.data.steps && selectedNode.data.steps.map((step, idx) => (
                                    <div key={idx} className="space-y-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-md ${step.iconBg || 'bg-slate-100'} ${step.iconColor || 'text-slate-500'}`}>
                                                    {step.icon}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{step.type}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newSteps = selectedNode.data.steps.filter((_, i) => i !== idx);
                                                    updateNodeData(selectedNode.id, { steps: newSteps });
                                                }}
                                                className="text-xs text-red-400 hover:text-red-500 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        {/* Render Editor based on type */}
                                        {['Text', 'Text Message'].includes(step.type) && (
                                            <TextEditor
                                                value={step.content}
                                                onChange={(val) => updateStep(selectedNode.id, idx, 'content', val)}
                                                showStaticVariables={staticVarsEnabled}
                                                flowVariables={nodes.flatMap(n => n.data.steps || [])
                                                    .filter(s => s.variable)
                                                    .map(s => ({ label: s.variable, value: `{{vars.${s.variable}}}` }))
                                                }
                                            />
                                        )}

                                        {step.type === 'Quick Reply' && (
                                            <QuickReplyEditor
                                                step={step}
                                                onChange={(field, val) => updateStep(selectedNode.id, idx, field, val)}
                                                showStaticVariables={staticVarsEnabled}
                                                flowVariables={nodes.flatMap(n => n.data.steps || [])
                                                    .filter(s => s.variable)
                                                    .map(s => ({ label: s.variable, value: `{{vars.${s.variable}}}` }))
                                                }
                                            />
                                        )}

                                        {step.type === 'List' && (
                                            <ListEditor
                                                step={step}
                                                onChange={(field, val) => updateStep(selectedNode.id, idx, field, val)}
                                                showStaticVariables={staticVarsEnabled}
                                                flowVariables={nodes.flatMap(n => n.data.steps || [])
                                                    .filter(s => s.variable)
                                                    .map(s => ({ label: s.variable, value: `{{vars.${s.variable}}}` }))
                                                }
                                            />
                                        )}

                                        {['Image', 'Video', 'Audio', 'File'].includes(step.type) && (
                                            <MediaEditor
                                                step={step}
                                                onChange={(field, val) => updateStep(selectedNode.id, idx, field, val)}
                                                showStaticVariables={staticVarsEnabled}
                                                flowVariables={nodes.flatMap(n => n.data.steps || [])
                                                    .filter(s => s.variable)
                                                    .map(s => ({ label: s.variable, value: `{{vars.${s.variable}}}` }))
                                                }
                                            />
                                        )}

                                        {step.type === 'Location' && (
                                            <LocationEditor
                                                step={step}
                                                onChange={(field, val) => updateStep(selectedNode.id, idx, field, val)}
                                                showStaticVariables={staticVarsEnabled}
                                                flowVariables={nodes.flatMap(n => n.data.steps || [])
                                                    .filter(s => s.variable)
                                                    .map(s => ({ label: s.variable, value: `{{vars.${s.variable}}}` }))
                                                }
                                            />
                                        )}

                                        {step.type === 'YouTube' && (
                                            <YouTubeEditor
                                                step={step}
                                                onChange={(field, val) => updateStep(selectedNode.id, idx, field, val)}
                                            />
                                        )}

                                        {step.type === 'Chatbot' && (
                                            <div className="space-y-3">
                                                <div className="text-xs text-slate-500 italic">
                                                    Jump to another flow or a specific node within a flow.
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Flow</label>
                                                    <select
                                                        value={step.targetFlowId || ''}
                                                        onChange={async (e) => {
                                                            const flowId = e.target.value;
                                                            console.log('Selected flow ID:', flowId);
                                                            console.log('Current step.targetFlowId before update:', step.targetFlowId);

                                                            // Update step data immediately
                                                            updateStep(selectedNode.id, idx, 'targetFlowId', flowId);
                                                            updateStep(selectedNode.id, idx, 'targetNodeId', '');

                                                            // Also update selectedNode directly for immediate UI update
                                                            setSelectedNode(prev => {
                                                                const newSteps = [...prev.data.steps];
                                                                newSteps[idx] = {
                                                                    ...newSteps[idx],
                                                                    targetFlowId: flowId,
                                                                    targetNodeId: ''
                                                                };
                                                                return { ...prev, data: { ...prev.data, steps: newSteps } };
                                                            });

                                                            // Load nodes from selected flow
                                                            if (flowId) {
                                                                try {
                                                                    const res = await axios.get(`http://localhost:8080/api/whatsapp/flows/local/${flowId}`);
                                                                    console.log('Flow data:', res.data);
                                                                    const graphData = res.data.graph_data;
                                                                    if (graphData) {
                                                                        // Check if graphData is already an object or a string
                                                                        const parsed = typeof graphData === 'string' ? JSON.parse(graphData) : graphData;
                                                                        console.log('Parsed nodes:', parsed.nodes);
                                                                        // Store nodes in state keyed by flow ID
                                                                        setTargetFlowNodes(prev => ({
                                                                            ...prev,
                                                                            [flowId]: parsed.nodes || []
                                                                        }));
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Failed to load flow nodes:', err);
                                                                }
                                                            }
                                                        }}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                                                    >
                                                        <option value="">Select a flow...</option>
                                                        {savedFlows.map(flow => (
                                                            <option key={flow.id} value={flow.id}>{flow.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {step.targetFlowId && (
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Group/Node</label>
                                                        <select
                                                            value={step.targetNodeId || ''}
                                                            onChange={(e) => {
                                                                console.log('Selected node:', e.target.value);
                                                                updateStep(selectedNode.id, idx, 'targetNodeId', e.target.value);
                                                            }}
                                                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                                                        >
                                                            <option value="">Start from beginning</option>
                                                            {(() => {
                                                                const nodes = targetFlowNodes[step.targetFlowId] || [];
                                                                console.log('Rendering dropdown for flowId:', step.targetFlowId);
                                                                console.log('Available nodes:', nodes);
                                                                console.log('All targetFlowNodes:', targetFlowNodes);
                                                                return nodes.map(node => (
                                                                    <option key={node.id} value={node.id}>
                                                                        {node.data?.label || node.id}
                                                                    </option>
                                                                ));
                                                            })()}
                                                        </select>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {(targetFlowNodes[step.targetFlowId] || []).length > 0
                                                                ? `${(targetFlowNodes[step.targetFlowId] || []).length} groups available`
                                                                : 'Loading groups...'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {step.type.includes('Input') && (
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                                                <div className="text-xs text-slate-500 italic">
                                                    This step waits for the user to send a <strong>{step.type}</strong>.
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Save Response To Variable</label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400 font-mono text-sm">vars.</span>
                                                        <input
                                                            type="text"
                                                            value={step.variable || ''}
                                                            onChange={(e) => updateStep(selectedNode.id, idx, 'variable', e.target.value)}
                                                            placeholder="e.g. user_email"
                                                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500 font-mono text-emerald-600"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Validation Settings */}
                                                <div className="border-t border-slate-200 pt-3 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Validation Settings</label>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs text-slate-500 block mb-1">Max Retries</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="10"
                                                                value={step.validation?.maxRetries || 3}
                                                                onChange={(e) => updateStep(selectedNode.id, idx, 'validation', { ...step.validation, maxRetries: e.target.value })}
                                                                className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                                                            />
                                                        </div>
                                                        {step.type === 'Number Input' && (
                                                            <>
                                                                <div>
                                                                    <label className="text-xs text-slate-500 block mb-1">Min Value</label>
                                                                    <input
                                                                        type="number"
                                                                        value={step.validation?.min || ''}
                                                                        onChange={(e) => updateStep(selectedNode.id, idx, 'validation', { ...step.validation, min: e.target.value })}
                                                                        placeholder="Optional"
                                                                        className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs text-slate-500 block mb-1">Max Value</label>
                                                                    <input
                                                                        type="number"
                                                                        value={step.validation?.max || ''}
                                                                        onChange={(e) => updateStep(selectedNode.id, idx, 'validation', { ...step.validation, max: e.target.value })}
                                                                        placeholder="Optional"
                                                                        className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="text-xs text-slate-500 block mb-1">Error Message</label>
                                                        <input
                                                            type="text"
                                                            value={step.validation?.errorMessage || ''}
                                                            onChange={(e) => updateStep(selectedNode.id, idx, 'validation', { ...step.validation, errorMessage: e.target.value })}
                                                            placeholder="Invalid input. Please try again."
                                                            className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                                                        />
                                                    </div>

                                                    {step.type === 'Text Input' && (
                                                        <div>
                                                            <label className="text-xs text-slate-500 block mb-1">Regex Pattern (Optional)</label>
                                                            <input
                                                                type="text"
                                                                value={step.validation?.regex || ''}
                                                                onChange={(e) => updateStep(selectedNode.id, idx, 'validation', { ...step.validation, regex: e.target.value })}
                                                                placeholder="e.g. ^[A-Za-z]+$"
                                                                className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-300 font-mono"
                                                            />
                                                            <p className="text-xs text-slate-400 mt-1">Use regex to validate text format</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {selectedNode.data.steps.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                        No steps in this node. Add one below.
                                    </div>
                                )}

                                {/* Add Step Section */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Content</div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {sidebarItems.flatMap(cat => cat.items).map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    const newStep = {
                                                        type: item.label,
                                                        content: item.label === 'Quick Reply' ? 'Hello! Choose an option:' : `Configure ${item.label}`,
                                                        icon: item.icon,
                                                        iconBg: item.bg,
                                                        iconColor: item.color,
                                                        buttons: item.label === 'Quick Reply' ? [{ label: 'Yes' }, { label: 'No' }] : undefined
                                                    };
                                                    updateNodeData(selectedNode.id, { steps: [...selectedNode.data.steps, newStep] });
                                                }}
                                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-emerald-500 hover:shadow-sm transition-all text-center group h-20"
                                                title={item.label}
                                            >
                                                <div className={`${item.color} opacity-70 group-hover:opacity-100 transform group-hover:scale-110 transition-all`}>
                                                    {React.cloneElement(item.icon, { className: "w-5 h-5" })}
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-600 leading-tight line-clamp-2">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* TOOLBOX SIDEBAR */
                    <>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <span className="text-xs font-medium text-slate-400">Autosave on</span>
                            <button
                                onClick={saveFlow}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-lg shadow-emerald-200/50"
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {sidebarItems.map((cat, idx) => (
                                <div key={idx} className="mb-6">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{cat.category}</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {cat.items.map((item, itemIdx) => (
                                            <button
                                                key={itemIdx}
                                                onClick={() => addNode(item)}
                                                className="flex flex-row items-center justify-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group text-left"
                                            >
                                                <div className={`p-2 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform shrink-0`}>
                                                    {item.icon}
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 leading-tight">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            {showLoadModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Open Flow</h3>
                            <button onClick={() => setShowLoadModal(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {savedFlows.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">No saved flows found.</div>
                            ) : (
                                <div className="space-y-1">
                                    {savedFlows.map((f) => (
                                        <div
                                            key={f.id}
                                            className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-xl transition group border border-transparent hover:border-slate-100"
                                        >
                                            <button
                                                onClick={() => loadFlow(f.id)}
                                                className="flex-1 flex items-center justify-between text-left"
                                            >
                                                <div>
                                                    <div className="font-bold text-slate-700 text-sm group-hover:text-emerald-700">{f.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">Last updated: {new Date(f.updated_at).toLocaleDateString()}</div>
                                                </div>
                                                <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 rotate-180" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteFlow(f.id, f.name);
                                                }}
                                                className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
                                                title="Delete flow"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setShowLoadModal(false)} className="px-4 py-2 text-sm text-slate-600 font-medium hover:text-slate-800">Cancel</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
