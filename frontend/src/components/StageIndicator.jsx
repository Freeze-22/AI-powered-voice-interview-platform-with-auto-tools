import React from 'react';

const INTERVIEW_STAGES = ["problem", "clarification", "approach", "pseudocode", "coding", "debugging", "evaluation"];

const StageIndicator = ({ currentStage }) => {
    return (
        <div className="w-full bg-white shadow-sm p-4 rounded-b-md mb-4 border-b border-gray-200">
            <h1 className="text-xl font-bold mb-2 text-center text-gray-800">Technical Interview Progress</h1>
            <div className="flex justify-between items-center relative overflow-hidden">
                {/* Visual Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 transform -translate-y-1/2 rounded"></div>
                
                {INTERVIEW_STAGES.map((stageItem, idx) => {
                    const isCurrent = stageItem === currentStage;
                    const isPast = INTERVIEW_STAGES.indexOf(currentStage) > idx;

                    return (
                        <div key={stageItem} className="flex flex-col items-center flex-1 z-10">
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border-2 transition-all duration-300 ${isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-lg transform scale-110' : isPast ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                                {isPast ? '✓' : idx + 1}
                            </div>
                            <span className={`text-xs mt-2 font-medium capitalize hidden sm:block ${isCurrent ? 'text-blue-700' : isPast ? 'text-green-600' : 'text-gray-400'}`}>
                                {stageItem}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StageIndicator;
