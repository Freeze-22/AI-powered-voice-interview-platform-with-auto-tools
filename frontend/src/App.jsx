import React, { useState } from 'react';
import InterviewSetup from './pages/InterviewSetup';
import VoiceInterview from './pages/VoiceInterview';
import ScoreReport from './pages/ScoreReport';

function App() {
  const [view, setView] = useState('setup');
  const [sessionParams, setSessionParams] = useState(null);
  const [finishedSessionId, setFinishedSessionId] = useState(null);

  const startInterview = (params) => {
      setSessionParams(params);
      setView('interview');
  };

  const finishInterview = (sessionId) => {
      setFinishedSessionId(sessionId);
      setView('report');
  };

  const resetTarget = () => {
      setSessionParams(null);
      setFinishedSessionId(null);
      setView('setup');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {view === 'setup' && <InterviewSetup onStart={startInterview} />}
      {view === 'interview' && <VoiceInterview params={sessionParams} onExit={resetTarget} onFinish={finishInterview} />}
      {view === 'report' && <ScoreReport sessionId={finishedSessionId} onRestart={resetTarget} />}
    </div>
  );
}

export default App;
