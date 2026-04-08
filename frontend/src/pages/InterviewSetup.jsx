import React, { useState } from 'react';
import { Mic, Briefcase, FileText, Settings } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Register worker directly via Vite's url-resolver
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const INTERVIEW_TYPES = [
  'Technical Coding',
  'System Design',
  'Data Science',
  'Frontend UI',
  'Behavioral/HR',
  'Product Management',
  'Sales/CS',
  'Management',
  'DevOps'
];

const InterviewSetup = ({ onStart }) => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [interviewType, setInterviewType] = useState('Technical Coding');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    
    try {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
            }
            setResumeText(fullText.trim());
        } else {
            // Fallback for TXT files
            const reader = new FileReader();
            reader.onload = (event) => setResumeText(event.target.result);
            reader.readAsText(file);
        }
    } catch (error) {
        console.error("PDF Parsing Error:", error);
        alert("Failed to parse this document. Try a plain .txt file instead.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // CRITICAL: Unlock Chrome's speech APIs directly inside user click handler.
    // Chrome blocks speechSynthesis.speak() if the first call isn't from a user gesture.
    const unlock = new SpeechSynthesisUtterance(' ');
    unlock.volume = 0;
    window.speechSynthesis.speak(unlock);

    // Also pre-request microphone permission so it's ready for speech recognition
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // Release the stream immediately, we just needed to trigger the permission prompt
        stream.getTracks().forEach(t => t.stop());
      })
      .catch(() => {});

    setTimeout(() => {
      setLoading(false);
      onStart({ resumeText, jobDescription, interviewType });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
        <div className="p-8 text-center bg-gray-900 border-b border-gray-700">
          <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <Mic size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Voice-First AI Interviewer</h1>
          <p className="text-gray-400 mt-2">Dynamic tool generation based on real-time conversation.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-300">
              <FileText size={16} className="mr-2" /> Resume Upload
            </label>
            <div className="relative border-2 border-dashed border-gray-600 rounded-xl p-6 hover:bg-gray-700/50 transition cursor-pointer text-center group">
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".txt,.pdf,.docx" onChange={handleFileUpload} />
              <div className="text-gray-400 group-hover:text-white transition">
                {fileName ? <span className="text-green-400 font-semibold">✓ {fileName}</span> : <span>Click to upload target Resume (TXT, PDF)</span>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-300">
              <Briefcase size={16} className="mr-2" /> Job Description
            </label>
            <textarea 
              className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 transition resize-none"
              rows={4}
              placeholder="Paste the key responsibilities and requirements..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-300">
              <Settings size={16} className="mr-2" /> Interview Domain
            </label>
            <select 
              className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 transition appearance-none"
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
            >
              {INTERVIEW_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading || !resumeText || !jobDescription}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              loading || !resumeText || !jobDescription 
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white hover:scale-[1.02]'
            }`}
          >
            {loading ? 'Initializing Architecture...' : 'Start Voice Interview'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InterviewSetup;
