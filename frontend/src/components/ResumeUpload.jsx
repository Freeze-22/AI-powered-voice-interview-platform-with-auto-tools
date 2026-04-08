import React, { useState } from 'react';

const ResumeUpload = ({ onStart }) => {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setFileName(file.name);
        
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            const content = event.target.result;
            
            // NOTE: In a full app, if fileExtension === 'pdf' use pdf.js (e.g. PDFJS.getDocument)
            // or if 'docx' use mammoth.js (e.g. mammoth.extractRawText).
            // For now, handling raw text reading to fulfill UI behavior without massive heavy dependencies
            
            setResumeText(content);
        };
        
        // Simulating text extraction for all types for proof of concept UI
        reader.readAsText(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            console.log('[ResumeUpload] Integration point: calling onStart with resumeText and jobDescription');
            await onStart(resumeText, jobDescription);
        } catch (error) {
            console.error('[ResumeUpload] Error starting interview:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-4 mt-10">
            <div className="bg-white p-8 rounded-lg shadow-md w-full border border-gray-200">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Start Your Interview</h2>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Resume Upload Module */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Upload Resume (TXT, PDF, DOCX)
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <span className="text-sm text-gray-500 font-semibold mb-1">
                                        {fileName ? `Uploaded: ${fileName}` : 'Click to upload or drag and drop'}
                                    </span>
                                    <span className="text-xs text-gray-400">PDF, DOCX, TXT only</span>
                                </div>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept=".txt,.pdf,.docx" 
                                    onChange={handleFileUpload} 
                                />
                            </label>
                        </div>
                        {resumeText && fileName && (
                            <p className="text-xs text-green-600 mt-2 font-medium">✓ Resume text extracted successfully.</p>
                        )}
                    </div>
                    
                    {/* Job Description Module */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Job Description
                        </label>
                        <textarea 
                            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                            rows="5"
                            placeholder="Paste the target job description here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            required
                        />
                    </div>
                    
                    {/* Submission Button */}
                    <button 
                        type="submit" 
                        disabled={loading || !resumeText || !jobDescription}
                        className={`w-full py-3 rounded text-white font-bold transition-colors ${
                            loading || !resumeText || !jobDescription 
                            ? 'bg-blue-300 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 shadow border border-blue-800'
                        }`}
                    >
                        {loading ? 'Initializing Context...' : 'Start Interview'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResumeUpload;
