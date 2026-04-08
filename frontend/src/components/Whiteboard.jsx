import React, { useRef, useState } from 'react';
import CanvasDraw from 'react-canvas-draw';
import { Send, Eraser, Trash2, PenTool } from 'lucide-react';

const Whiteboard = ({ onSubmit }) => {
    const canvasRef = useRef(null);
    const [color, setColor] = useState("#3b82f6");
    const [brushRadius, setBrushRadius] = useState(3);

    const handleClear = () => {
        canvasRef.current.clear();
    };

    const handleUndo = () => {
        canvasRef.current.undo();
    };

    const handleSubmit = () => {
        const savedData = canvasRef.current.getSaveData();
        // Send internal representation and potentially base64 image
        // const image = canvasRef.current.canvasContainer.children[1].toDataURL();
        onSubmit({ rawDrawData: savedData });
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 m-4 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Toolbar */}
            <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4">
                    <PenTool size={20} className="text-gray-400" />
                    <span className="font-bold text-gray-200">System Architecture Whiteboard</span>
                    
                    <div className="h-8 w-px bg-gray-700 mx-2" />
                    
                    {/* Colors */}
                    <div className="flex gap-2">
                        {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff'].map(c => (
                            <button 
                                key={c} 
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full border-2 transition ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={handleUndo} className="p-2 text-gray-400 hover:text-white transition" title="Undo">
                        <Eraser size={20} />
                    </button>
                    <button onClick={handleClear} className="p-2 text-red-400 hover:text-red-300 transition" title="Clear Canvas">
                        <Trash2 size={20} />
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition ml-4"
                    >
                        <Send size={16} /> Submit Drawing
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-gray-950 flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 w-full h-full cursor-crosshair">
                    <CanvasDraw
                        ref={canvasRef}
                        brushColor={color}
                        brushRadius={brushRadius}
                        lazyRadius={0}
                        backgroundColor="transparent"
                        canvasWidth="100%"
                        canvasHeight="100%"
                        hideGrid={false}
                        gridColor="rgba(255,255,255,0.05)"
                        className="w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default Whiteboard;
