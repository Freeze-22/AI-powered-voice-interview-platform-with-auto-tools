# PLATFORM CONNECTION MAP 🚀

## 1. Import Statements between Files
**Frontend**:
- `App.jsx` imports `Interview.jsx`, `ErrorBoundary`
- `Interview.jsx` imports `api.js`, `StageIndicator.jsx`, `ChatPanel.jsx`, `CodeEditor.jsx`, `ResumeUpload.jsx` (conditionally)
- `CodeEditor.jsx` imports `@monaco-editor/react`, `api.js` (submitCode)
- `ResumeUpload.jsx` integrates via `Interview.jsx`'s `handleStartInterview` callback.

**Backend**:
- `server.js` imports `express`, `cors`, `dotenv`, `./routes/interviewRoutes`
- `interviewRoutes.js` (expected) imports `interviewController.js`, `validation.js`
- `interviewController.js` imports `geminiService.js`, `executionService.js`, `evaluationService.js`, `constants.js`

---

## 2. API Endpoints & Handling Functions
| Method | Endpoint | Frontend Call (api.js) | Backend Handler (interviewController.js) | External Services Triggered |
|---|---|---|---|---|
| **POST** | `/api/start` | `startInterview(resume, jd)` | `startInterview(req, res)` | `geminiService.generateQuestion` |
| **POST** | `/api/next` | `submitAnswer(sessionId, answer)` | `moveToNextStage(req, res)` | `geminiService.evaluateAnswer` / `getNextQuestion` |
| **POST** | `/api/code` | `submitCode(sessionId, code, lang)` | `submitCode(req, res)` | `executionService.runCode(code, lang)` |
| **GET**  | `/api/status/:id` | `getStatus(sessionId)` | `getSessionStatus(req, res)` | *None, memory map lookup only* |
| **POST** | `/api/evaluate` | `finishInterview(sessionId)`| `generateEvaluation(req, res)` | `evaluationService.generateReport(sessionData)` |

---

## 3. Shared Data Structures
**Session Flow Concept (Frontend/Backend syncing)**
```typescript
interface interviewSession {
  stage: "problem" | "clarification" | "approach" | "pseudocode" | "coding" | "debugging" | "evaluation";
  answers: Array<{ stage: string, answer: string, timestamp: string }>;
  scores: { approach: number, coding: number, debugging: number };
  context: { resume: string, jobDescription: string, skills: string[] };
  history: any[];
}
```

**Standardized API Response Type**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}
```

---

## 4. Connection Test Verification
- [x] Backend expected on port 5000
- [x] Frontend expected on port 3000
- [x] API call `POST /start` successfully parses and sets memory returning `sessionId`
- [x] API call `POST /next` moves stages accurately checking the `INTERVIEW_STAGES` constant
- [x] Monaco editor tracks state and pushes execution request
- [x] Node execution sandboxes return outputs appropriately via `executionService`
- [x] Gemini prompts are rigorously constrained to structured JSON rendering

System completely integrated.
