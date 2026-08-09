import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, HardDrive, Tag, Sparkles, 
  AlertCircle, RefreshCw, Terminal, FileText, Code2, Play, Send,
  CheckCircle2, XCircle, X, Check, AlertTriangle
} from 'lucide-react';
import { problemAPI, compileAPI, submissionAPI } from '../services/api';
import './ProblemPage.css';

export const ProblemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Starter C++ code template
  const [code, setCode] = useState(
`#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`
  );

  const [customInput, setCustomInput] = useState('');

  // Execution & Submission States
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState('run'); // 'run' | 'submission'
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  const fetchProblemDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await problemAPI.getProblemById(id);
      setProblem(data);
    } catch (err) {
      console.error('Failed to fetch problem details:', err);
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setError(err.message || 'Failed to load problem details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProblemDetails();
    }
  }, [id]);

  // Handler for Run button (POST /run)
  const handleRun = async () => {
    if (running || submitting) return;

    setRunning(true);
    setApiError(null);
    setActiveOutputTab('run');

    try {
      const isCustomInputProvided = customInput.trim() !== '';
      const sampleCases = problem?.test_cases || [];

      if (!isCustomInputProvided && sampleCases.length > 0) {
        // 1. Run against all sample test cases
        const results = await Promise.all(
          sampleCases.map(async (tc, idx) => {
            const res = await compileAPI.runCode({
              source_code: code,
              input: tc.input || '',
            });
            return { tc, res, idx };
          })
        );

        // Check for CompileError in any returned result
        const compileErr = results.find(r => r.res.status === 'CompileError');
        if (compileErr) {
          setRunResult({
            mode: 'samples',
            status: 'CompileError',
            error: compileErr.res.error,
          });
        } else {
          const parsedCases = results.map(({ tc, res, idx }) => {
            let verdict = 'Failed';
            let actualOutput = res.output || '';
            let errorInfo = res.error || '';

            if (res.status === 'TimeLimitExceeded') {
              verdict = 'TimeLimitExceeded';
              actualOutput = 'Time Limit Exceeded (5000ms)';
            } else if (res.status === 'RuntimeError') {
              verdict = 'RuntimeError';
              actualOutput = res.error || res.output || 'Runtime Error';
            } else {
              const trimmedActual = (res.output || '').replace(/\s+$/, '');
              const trimmedExpected = (tc.output || '').replace(/\s+$/, '');
              if (trimmedActual === trimmedExpected) {
                verdict = 'Passed';
              } else {
                verdict = 'Failed';
              }
            }

            return {
              caseNum: idx + 1,
              input: tc.input || '',
              expectedOutput: tc.output || '',
              actualOutput: actualOutput,
              stderr: res.stderr || '',
              verdict,
              error: errorInfo,
            };
          });

          setRunResult({
            mode: 'samples',
            status: 'Success',
            cases: parsedCases,
          });
        }
      } else {
        // 2. Custom input provided (or no sample test cases exist)
        const res = await compileAPI.runCode({
          source_code: code,
          input: customInput,
        });
        setRunResult({
          mode: 'custom',
          ...res,
        });
      }
    } catch (err) {
      console.error('Run error:', err);
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setApiError(err.message || 'Execution failed due to server or network error.');
    } finally {
      setRunning(false);
    }
  };

  // Handler for Submit button (POST /submissions & GET /submissions/:id)
  const handleSubmit = async () => {
    if (running || submitting) return;

    setSubmitting(true);
    setApiError(null);
    setActiveOutputTab('submission');

    try {
      // 1. Issue submission request (POST /submissions)
      const initialRes = await submissionAPI.submitCode({
        problem_id: id,
        source_code: code,
      });

      // 2. Fetch full submission with populated & sanitized test cases (GET /submissions/:id)
      if (initialRes && initialRes._id) {
        const fullSubmission = await submissionAPI.getSubmissionById(initialRes._id);
        setSubmissionResult(fullSubmission);
      } else {
        setSubmissionResult(initialRes);
      }
    } catch (err) {
      console.error('Submit error:', err);
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setApiError(err.message || 'Submission failed due to server or network error.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="problem-page-state-wrapper">
        <div className="state-card loading-state">
          <RefreshCw size={36} className="spin-icon text-red" />
          <p className="state-title">Fetching Problem Specification...</p>
          <p className="state-desc">Loading statement, constraints, and test cases for problem {id}</p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="problem-page-state-wrapper">
        <button className="btn-secondary btn-sm" onClick={() => navigate('/problems')} style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Problems</span>
        </button>
        <div className="state-card error-state">
          <AlertCircle size={40} className="text-red" />
          <p className="state-title">Problem Not Found</p>
          <p className="state-desc">{error || 'The requested problem could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const difficultyClass = `diff-${(problem.difficulty || 'easy').toLowerCase()}`;

  return (
    <div className="problem-page-container">
      {/* Top Bar Navigation & Actions */}
      <div className="problem-page-header">
        <div className="header-left">
          <button className="btn-back-link" onClick={() => navigate('/problems')}>
            <ArrowLeft size={16} />
            <span>Problem List</span>
          </button>
        </div>

        {/* Centered Run & Submit Action Buttons */}
        <div className="header-center-actions">
          <button 
            className="btn-run-action" 
            type="button"
            onClick={handleRun}
            disabled={running || submitting}
          >
            {running ? (
              <>
                <RefreshCw size={15} className="spin-icon" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={15} />
                <span>Run</span>
              </>
            )}
          </button>

          <button 
            className="btn-submit-action" 
            type="button"
            onClick={handleSubmit}
            disabled={running || submitting}
          >
            {submitting ? (
              <>
                <RefreshCw size={15} className="spin-icon" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>

        <div className="header-right" />
      </div>

      {/* Two-Panel Layout */}
      <div className="problem-workspace-grid">
        
        {/* ================= LEFT PANEL: Problem Details ================= */}
        <div className="problem-left-panel">
          
          {/* Header Card */}
          <div className="panel-section header-section">
            <h1 className="problem-main-title">{problem.title}</h1>
            
            <div className="problem-meta-row">
              <span className={`diff-badge ${difficultyClass}`}>
                {problem.difficulty || 'Easy'}
              </span>

              <div className="limits-pills-group">
                <span className="meta-pill" title="Time Limit">
                  <Clock size={13} />
                  <span>{problem.time_limit_ms || 2000} ms</span>
                </span>
                <span className="meta-pill" title="Memory Limit">
                  <HardDrive size={13} />
                  <span>{Math.round((problem.memory_limit_kb || 262144) / 1024)} MB</span>
                </span>
              </div>
            </div>

            {problem.tags && problem.tags.length > 0 && (
              <div className="problem-tags-row">
                {problem.tags.map((tag, idx) => (
                  <span key={idx} className="problem-tag-chip">
                    <Tag size={11} style={{ marginRight: 4 }} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Statement Section */}
          <div className="panel-section">
            <div className="section-header">
              <FileText size={18} className="icon-accent" />
              <h2>Problem Statement</h2>
            </div>
            <div className="statement-text">
              {problem.statement}
            </div>
          </div>

          {/* Constraints Section */}
          {problem.constraints && (
            <div className="panel-section">
              <div className="section-header">
                <Sparkles size={18} className="icon-accent" />
                <h2>Constraints</h2>
              </div>
              <pre className="constraints-block">
                {problem.constraints}
              </pre>
            </div>
          )}

          {/* Sample Test Cases Section */}
          <div className="panel-section">
            <div className="section-header">
              <Terminal size={18} className="icon-accent" />
              <h2>Sample Test Cases</h2>
            </div>

            {problem.test_cases && problem.test_cases.length > 0 ? (
              <div className="sample-cases-container">
                {problem.test_cases.map((tc, idx) => (
                  <div key={tc._id || idx} className="sample-case-card">
                    <div className="sample-case-title">Sample Case #{idx + 1}</div>
                    <div className="sample-case-grid">
                      <div className="sample-box">
                        <span className="box-label">Input</span>
                        <pre className="box-code">{tc.input}</pre>
                      </div>
                      <div className="sample-box">
                        <span className="box-label">Output</span>
                        <pre className="box-code">{tc.output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-cases-text">No sample test cases provided.</p>
            )}
          </div>

        </div>

        {/* ================= RIGHT PANEL: Code Editor & Execution ================= */}
        <div className="problem-right-panel">
          
          {/* Editor Header Bar */}
          <div className="editor-header-bar">
            <div className="lang-indicator">
              <Code2 size={16} className="icon-accent" />
              <span className="lang-name">C++ (g++)</span>
            </div>
            <span className="editor-status-text">Drafting Solution</span>
          </div>

          {/* Main Code Editor Area */}
          <div className="editor-area-wrapper">
            {/* TODO: Placeholder textarea - will be replaced with Monaco or CodeMirror editor in a future task */}
            <textarea
              className="code-textarea-placeholder"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Write your code here..."
              spellCheck="false"
              wrap="off"
            />
          </div>

          {/* Custom Input Section */}
          <div className="input-section-wrapper">
            <div className="section-label">
              <Terminal size={14} />
              <span>Custom Input (stdin)</span>
            </div>
            <textarea
              className="custom-input-textarea"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter stdin input to test your code with (leave empty to run sample cases)..."
              rows={3}
              spellCheck="false"
            />
          </div>

          {/* Output & Submission Results Section */}
          <div className="output-section-wrapper">
            
            {/* Tab Header Controls */}
            <div className="output-tabs-header">
              <button
                type="button"
                className={`output-tab-btn ${activeOutputTab === 'run' ? 'active' : ''}`}
                onClick={() => setActiveOutputTab('run')}
              >
                <Terminal size={13} />
                <span>Run Output</span>
              </button>

              <button
                type="button"
                className={`output-tab-btn ${activeOutputTab === 'submission' ? 'active' : ''}`}
                onClick={() => setActiveOutputTab('submission')}
              >
                <Send size={13} />
                <span>Submission Results</span>
                {submissionResult && (
                  <span className={`verdict-mini-badge verdict-${submissionResult.status.toLowerCase()}`}>
                    {submissionResult.status}
                  </span>
                )}
              </button>
            </div>

            {/* Display Area Content */}
            <div className="output-display-container">

              {/* Network / Server Error Banner */}
              {apiError && (
                <div className="alert-banner error" style={{ marginBottom: '0.75rem' }}>
                  <AlertCircle size={18} />
                  <span>{apiError}</span>
                </div>
              )}

              {/* TAB 1: RUN OUTPUT */}
              {activeOutputTab === 'run' && (
                <>
                  {running ? (
                    <div className="output-loading-state">
                      <RefreshCw size={22} className="spin-icon text-red" />
                      <span>Compiling and running code...</span>
                    </div>
                  ) : runResult ? (
                    <div className="run-result-view">
                      {/* Sample Test Cases Mode */}
                      {runResult.mode === 'samples' ? (
                        runResult.status === 'CompileError' ? (
                          <div className="code-output-block error-block">
                            <div className="run-status-header" style={{ marginBottom: '0.5rem' }}>
                              <span className="status-tag status-compileerror">
                                <AlertCircle size={14} />
                                <span>Compile Error</span>
                              </span>
                            </div>
                            <span className="output-block-label text-red">Compiler Stderr:</span>
                            <pre className="code-output-text">{runResult.error}</pre>
                          </div>
                        ) : (
                          <div className="sample-results-container">
                            {(() => {
                              const passedCount = (runResult.cases || []).filter(c => c.verdict === 'Passed').length;
                              const totalCount = (runResult.cases || []).length;
                              const allPassed = passedCount === totalCount && totalCount > 0;

                              return (
                                <>
                                  <div className="run-status-header" style={{ marginBottom: '0.75rem' }}>
                                    <span className={`status-tag ${allPassed ? 'status-success' : 'status-compileerror'}`}>
                                      {allPassed ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                      <span>{allPassed ? 'Sample Cases Passed' : `Sample Cases (${passedCount}/${totalCount} Passed)`}</span>
                                    </span>
                                  </div>

                                  <div className="testcase-results-list">
                                    {runResult.cases.map((c) => {
                                      const isPassed = c.verdict === 'Passed';
                                      return (
                                        <div key={c.caseNum} className={`tc-result-item ${isPassed ? 'passed' : 'failed'}`}>
                                          <div className="tc-result-header">
                                            <div className="tc-title-meta">
                                              <span className="tc-num">Sample Case #{c.caseNum}</span>
                                              <span className="sample-badge sample">Sample</span>
                                            </div>
                                            <div className="tc-status-meta">
                                              <span className={`tc-verdict-tag verdict-${c.verdict.toLowerCase()}`}>
                                                {isPassed ? <Check size={12} /> : <X size={12} />}
                                                <span>{c.verdict === 'Failed' ? 'Wrong Answer' : c.verdict}</span>
                                              </span>
                                            </div>
                                          </div>

                                          <div className="tc-sample-details-box">
                                            <div className="diff-item">
                                              <span className="diff-lbl">Input (stdin):</span>
                                              <pre className="diff-val-code">{c.input || '(empty)'}</pre>
                                            </div>
                                            <div className="sample-diff-side-by-side">
                                              <div className="diff-item">
                                                <span className="diff-lbl">Expected Output:</span>
                                                <pre className="diff-val-code expected">{c.expectedOutput || '(empty)'}</pre>
                                              </div>
                                              <div className="diff-item">
                                                <span className="diff-lbl">Actual Output:</span>
                                                <pre className={`diff-val-code ${isPassed ? 'actual-pass' : 'actual-fail'}`}>
                                                  {c.actualOutput || c.error || '(No output)'}
                                                </pre>
                                              </div>
                                            </div>
                                            {c.stderr && (
                                              <div className="diff-item" style={{ marginTop: '0.25rem' }}>
                                                <span className="diff-lbl text-amber">Stderr:</span>
                                                <pre className="diff-val-code text-amber">{c.stderr}</pre>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )
                      ) : (
                        /* Custom Input Mode (or raw single run output) */
                        <>
                          <div className="run-status-header">
                            <span className={`status-tag status-${runResult.status.toLowerCase()}`}>
                              {runResult.status === 'Success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                              <span>{runResult.status}</span>
                            </span>
                          </div>

                          {runResult.status === 'CompileError' && (
                            <div className="code-output-block error-block">
                              <span className="output-block-label text-red">Compiler Stderr:</span>
                              <pre className="code-output-text">{runResult.error}</pre>
                            </div>
                          )}

                          {runResult.status === 'RuntimeError' && (
                            <div className="code-output-block error-block">
                              <span className="output-block-label text-red">Runtime Error:</span>
                              <pre className="code-output-text">{runResult.error || runResult.output}</pre>
                              {runResult.output && runResult.error && (
                                <>
                                  <span className="output-block-label" style={{ marginTop: '0.5rem' }}>Output before crash:</span>
                                  <pre className="code-output-text">{runResult.output}</pre>
                                </>
                              )}
                            </div>
                          )}

                          {runResult.status === 'TimeLimitExceeded' && (
                            <div className="code-output-block error-block">
                              <span className="output-block-label text-red">Time Limit Exceeded:</span>
                              <p className="code-output-text">Process was killed after exceeding the 5000ms execution time limit.</p>
                            </div>
                          )}

                          {runResult.status === 'Success' && (
                            <div className="code-output-block success-block">
                              <span className="output-block-label">Program Output (stdout):</span>
                              <pre className="code-output-text">{runResult.output || '(No stdout output returned)'}</pre>
                              {runResult.stderr && (
                                <>
                                  <span className="output-block-label text-amber" style={{ marginTop: '0.5rem' }}>Stderr:</span>
                                  <pre className="code-output-text text-amber">{runResult.stderr}</pre>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="output-placeholder-state">
                      <span className="output-placeholder-text">
                        Run your code to view sample test case evaluation or custom input output.
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: SUBMISSION RESULTS */}
              {activeOutputTab === 'submission' && (
                <>
                  {submitting ? (
                    <div className="output-loading-state">
                      <RefreshCw size={22} className="spin-icon text-red" />
                      <span>Evaluating code against problem test cases...</span>
                    </div>
                  ) : submissionResult ? (
                    <div className="submission-result-view">
                      
                      {/* Verdict Banner Card */}
                      <div className={`overall-verdict-card verdict-${submissionResult.status.toLowerCase()}`}>
                        <div className="verdict-icon-group">
                          {submissionResult.status === 'Accepted' ? (
                            <CheckCircle2 size={26} className="icon-accepted" />
                          ) : (
                            <XCircle size={26} className="icon-rejected" />
                          )}
                          <div>
                            <h3 className="verdict-title">{submissionResult.status}</h3>
                            <span className="verdict-meta">
                              Max Exec Time: {submissionResult.exec_time_ms || 0} ms
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Test Case Breakdown */}
                      {submissionResult.status === 'CompileError' ? (
                        <div className="code-output-block error-block" style={{ marginTop: '0.75rem' }}>
                          <span className="output-block-label text-red">Compilation Failed:</span>
                          <p className="code-output-text">Your code failed to compile. No test cases were executed.</p>
                        </div>
                      ) : (
                        <div className="testcase-results-list">
                          <h4 className="tc-results-heading">Test Case Breakdown</h4>
                          {submissionResult.results && submissionResult.results.length > 0 ? (
                            submissionResult.results.map((resItem, idx) => {
                              const isSample = resItem.testcase?.is_sample;
                              const isPassed = resItem.verdict === 'Passed';

                              return (
                                <div key={resItem._id || idx} className={`tc-result-item ${isPassed ? 'passed' : 'failed'}`}>
                                  <div className="tc-result-header">
                                    <div className="tc-title-meta">
                                      <span className="tc-num">Test Case #{idx + 1}</span>
                                      {isSample ? (
                                        <span className="sample-badge sample">Sample</span>
                                      ) : (
                                        <span className="sample-badge hidden">Hidden</span>
                                      )}
                                    </div>

                                    <div className="tc-status-meta">
                                      <span className={`tc-verdict-tag verdict-${resItem.verdict.toLowerCase()}`}>
                                        {isPassed ? <Check size={12} /> : <X size={12} />}
                                        <span>{resItem.verdict}</span>
                                      </span>
                                      <span className="tc-time">{resItem.exec_time_ms || 0} ms</span>
                                    </div>
                                  </div>

                                  {/* Failed Sample Case Diff */}
                                  {!isPassed && isSample && resItem.testcase && (
                                    <div className="tc-sample-diff-box">
                                      {resItem.testcase.input && (
                                        <div className="diff-item">
                                          <span className="diff-lbl">Input (stdin):</span>
                                          <pre className="diff-val">{resItem.testcase.input}</pre>
                                        </div>
                                      )}
                                      {resItem.testcase.output && (
                                        <div className="diff-item">
                                          <span className="diff-lbl">Expected Output:</span>
                                          <pre className="diff-val">{resItem.testcase.output}</pre>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Failed Hidden Case Notice */}
                                  {!isPassed && !isSample && (
                                    <div className="tc-hidden-note">
                                      <span>Input & Expected Output hidden for confidential test cases.</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="no-cases-text">No test case details available.</p>
                          )}
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="output-placeholder-state">
                      <span className="output-placeholder-text">
                        Submit your code to evaluate against all test cases.
                      </span>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
