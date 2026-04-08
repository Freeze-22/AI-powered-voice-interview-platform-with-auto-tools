const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const vm = require('vm');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * Service to execute code for the coding stage.
 */
class ExecutionService {
    
    /**
     * Sanitizes code by blocking dangerous imports and commands based on language.
     * @param {string} code 
     * @param {string} language 
     * @returns {Object} safe boolean and error message
     */
    sanitizeCode(code, language) {
        if (!code) return { safe: false, error: "No code provided" };
        
        try {
            const lowerCode = code.toLowerCase();
            if (language === 'python') {
                if (lowerCode.includes('import os') || lowerCode.includes('import subprocess') || lowerCode.includes('__import__')) {
                    return { safe: false, error: "Dangerous Python imports are not allowed (e.g., os, subprocess)" };
                }
            } else if (language === 'javascript') {
                if (lowerCode.includes('require(') || lowerCode.includes('eval(') || lowerCode.includes('exec(')) {
                    return { safe: false, error: "Dangerous JS functions are blocked (e.g., require, eval)" };
                }
            } else if (language === 'java') {
                if (lowerCode.includes('java.lang.runtime') || lowerCode.includes('java.lang.processbuilder')) {
                    return { safe: false, error: "Dangerous Java classes are blocked (e.g., Runtime, ProcessBuilder)" };
                }
            }

            return { safe: true, error: null };
        } catch (error) {
            console.error(`[ExecutionService] Error in sanitizeCode: ${error.message}`);
            return { safe: false, error: "Error during sanitation" };
        }
    }

    /**
     * Main execution method that dynamically routes to correct handler.
     * @param {string} code 
     * @param {string} language 
     * @param {number} timeoutMs 
     * @returns {Object} response structure with success, output, error, and executionTime
     */
    async runCode(code, language, timeoutMs = 5000) {
        console.log(`[ExecutionService] Integration point: runCode called for language: ${language}`);
        const startTime = Date.now();
        
        try {
            const sanitize = this.sanitizeCode(code, language);
            if (!sanitize.safe) {
                return {
                    success: false,
                    output: null,
                    error: sanitize.error,
                    executionTime: Date.now() - startTime
                };
            }

            let result = { output: null, error: null };

            if (language === 'python') {
                result = await this._runPython(code, timeoutMs);
            } else if (language === 'javascript') {
                result = await this._runJavascript(code, timeoutMs);
            } else if (language === 'java') {
                result = await this._runJava(code, timeoutMs);
            } else {
                result.error = `Unsupported language: ${language}`;
            }

            return {
                success: !result.error,
                output: result.output || "",
                error: result.error || null,
                executionTime: Date.now() - startTime
            };

        } catch (error) {
            console.error(`[ExecutionService] Error in runCode: ${error.message}`);
            return {
                success: false,
                output: null,
                error: error.message || "Execution exception",
                executionTime: Date.now() - startTime
            };
        }
    }

    async _runPython(code, timeoutMs) {
        const timestamp = Date.now();
        const filename = `temp_${timestamp}.py`;
        // Execute inside backend root to avoid cluttering services/
        const filepath = path.join(__dirname, '..', filename);
        
        try {
            fs.writeFileSync(filepath, code);
            const { stdout, stderr } = await execPromise(`python3 ${filepath}`, { timeout: timeoutMs });
            return { output: stdout.trim(), error: stderr.trim() || null };
        } catch (err) {
            if (err.killed) return { output: null, error: "Execution timed out" };
            return { output: err.stdout?.trim() || null, error: err.stderr?.trim() || err.message };
        } finally {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }
    }

    async _runJavascript(code, timeoutMs) {
        // Run in Node VM context
        return new Promise((resolve) => {
            let outputLogs = [];
            const sandbox = {
                console: {
                    log: (...args) => outputLogs.push(args.join(' ')),
                    error: (...args) => outputLogs.push(`Error: ${args.join(' ')}`),
                    warn: (...args) => outputLogs.push(`Warn: ${args.join(' ')}`),
                }
            };
            
            try {
                const context = vm.createContext(sandbox);
                const script = new vm.Script(code);
                
                script.runInContext(context, { timeout: timeoutMs });
                
                resolve({ output: outputLogs.join('\n'), error: null });
            } catch (err) {
                if (err.message.includes('Script execution timed out.')) {
                    resolve({ output: outputLogs.join('\n'), error: "Execution timed out" });
                } else {
                    resolve({ output: outputLogs.join('\n'), error: err.message });
                }
            }
        });
    }

    async _runJava(code, timeoutMs) {
        const timestamp = Date.now();
        const dirName = `temp_java_${timestamp}`;
        const dirPath = path.join(__dirname, '..', dirName);
        const filepath = path.join(dirPath, 'Main.java');
        
        try {
            fs.mkdirSync(dirPath, { recursive: true });
            fs.writeFileSync(filepath, code);
            
            await execPromise(`javac ${filepath}`, { timeout: timeoutMs });
            const { stdout, stderr } = await execPromise(`java -cp ${dirPath} Main`, { timeout: timeoutMs });
            
            return { output: stdout.trim(), error: stderr.trim() || null };
        } catch (err) {
            if (err.killed) return { output: null, error: "Execution timed out" };
            return { output: err.stdout?.trim() || null, error: err.stderr?.trim() || err.message };
        } finally {
            if (fs.existsSync(dirPath)) {
                fs.rmSync(dirPath, { recursive: true, force: true });
            }
        }
    }
}

module.exports = new ExecutionService();
