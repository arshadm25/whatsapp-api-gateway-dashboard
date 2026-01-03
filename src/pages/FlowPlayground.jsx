import React, { useState } from 'react';
import FlowBuilder from '../components/FlowBuilder';
import { Layers } from 'lucide-react';

export default function FlowPlayground() {
    const [generatedJson, setGeneratedJson] = useState(null);

    const handleSave = (json) => {
        console.log("Generated Flow JSON:", json);
        setGeneratedJson(json);
        alert("Flow JSON generated! Check console or review below.");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-emerald-600" />
                        Flow Builder Playground
                    </h2>
                    <p className="text-slate-500 text-sm">Experiment with the drag-and-drop builder without saving to the DB.</p>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <FlowBuilder
                    onSave={handleSave}
                    onCancel={() => alert("Cancel clicked")}
                />
            </div>

            {/* Debug View of JSON */}
            {generatedJson && (
                <div className="bg-slate-900 rounded-xl p-4 text-slate-300 text-xs font-mono overflow-auto max-h-60 border border-slate-700 shadow-inner">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                        <span className="font-bold text-emerald-400">Generated JSON Output (v3.0)</span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(generatedJson, null, 2));
                                alert("Copied to clipboard!");
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                        >
                            Copy JSON
                        </button>
                    </div>
                    <pre>{JSON.stringify(generatedJson, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
