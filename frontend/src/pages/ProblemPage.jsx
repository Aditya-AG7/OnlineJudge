import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Group, Panel, Separator
} from 'react-resizable-panels';
import {
  ArrowLeft, Clock, HardDrive, Tag, Sparkles,
  AlertCircle, RefreshCw, Terminal, FileText, Code2, Play, Send,
  CheckCircle2, XCircle, X, Check, Plus, Layers,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp
} from 'lucide-react';
import { problemAPI, compileAPI, submissionAPI, formatAPI } from '../services/api';
import { useProblemActions } from '../context/ProblemActionsContext';
import './ProblemPage.css';

// Default language identifier (meant to be replaced by a real language selector later)
const CURRENT_LANGUAGE = 'cpp';

// Extracted component for displaying submission verdict banner and test case breakdown
const SubmissionVerdictDetails = ({ submission, showBreakdown = true }) => {
  if (!submission) return null;

  const statusLower = (submission.status || '').toLowerCase();
  const results = submission.results || [];
  const passedCount = results.filter((r) => r.verdict === 'Passed').length;
  const totalCount = submission.total_test_cases ?? (submission.problem?.total_test_cases) ?? results.length;

  const sampleResults = results.filter((resItem) => resItem.testcase?.is_sample);

  return (
    <div className="submission-result-view">
      {/* Verdict Banner Card */}
      <div className={`overall-verdict-card verdict-${statusLower}`}>
        <div className="verdict-icon-group">
          {submission.status === 'Accepted' ? (
            <CheckCircle2 size={26} className="icon-accepted" />
          ) : (
            <XCircle size={26} className="icon-rejected" />
          )}
          <div>
            <h3 className="verdict-title">{submission.status}</h3>
            <div className="verdict-meta-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
              {submission.status !== 'CompileError' && (
                <>
                  <span className="verdict-meta">
                    {passedCount} / {totalCount} test cases passed
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>•</span>
                </>
              )}
              <span className="verdict-meta">
                Max Exec Time: {submission.exec_time_ms || 0} ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Case Breakdown (Rendered only when showBreakdown is true) */}
      {showBreakdown && (
        <>
          {submission.status === 'CompileError' ? (
            <div className="code-output-block error-block" style={{ marginTop: '0.75rem' }}>
              <span className="output-block-label text-red">Compilation Failed:</span>
              <p className="code-output-text">Your code failed to compile. No test cases were executed.</p>
            </div>
          ) : (
            <div className="testcase-results-list">
              <h4 className="tc-results-heading">Test Case Breakdown</h4>
              {sampleResults.length > 0 ? (
                sampleResults.map((resItem, idx) => {
                  const isPassed = resItem.verdict === 'Passed';

                  return (
                    <div key={resItem._id || idx} className={`tc-result-item ${isPassed ? 'passed' : 'failed'}`}>
                      <div className="tc-result-header">
                        <div className="tc-title-meta">
                          <span className="tc-num">Sample Case #{idx + 1}</span>
                          <span className="sample-badge sample">Sample</span>
                        </div>

                        <div className="tc-status-meta">
                          <span className={`tc-verdict-tag verdict-${(resItem.verdict || '').toLowerCase()}`}>
                            {isPassed ? <Check size={12} /> : <X size={12} />}
                            <span>{resItem.verdict}</span>
                          </span>
                          <span className="tc-time">{resItem.exec_time_ms || 0} ms</span>
                        </div>
                      </div>

                      {/* Failed Sample Case Diff */}
                      {!isPassed && resItem.testcase && (
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
                    </div>
                  );
                })
              ) : (
                <p className="no-cases-text">No sample test case details available.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const ProblemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActions } = useProblemActions();

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

  // Execution & Submission States
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState('testcase'); // 'testcase' | 'run' | 'submission'
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Left Panel Tabs & Submissions State
  const [activeLeftTab, setActiveLeftTab] = useState('description'); // 'description' | 'submissions'
  const [submissionsList, setSubmissionsList] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState(null);
  const [selectedSubmissionDetail, setSelectedSubmissionDetail] = useState(null);
  const [loadingSubmissionDetail, setLoadingSubmissionDetail] = useState(false);
  const [submissionDetailError, setSubmissionDetailError] = useState(null);

  // Custom Testcases State
  const [customTestCases, setCustomTestCases] = useState([]);
  const [activeTestcaseTabId, setActiveTestcaseTabId] = useState(null);

  const descPanelRef = useRef(null);
  const outputPanelRef = useRef(null);
  const [isDescCollapsed, setIsDescCollapsed] = useState(false);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);

  const toggleDescPanel = () => {
    const panel = descPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
        setIsDescCollapsed(false);
      } else {
        panel.collapse();
        setIsDescCollapsed(true);
      }
    }
  };

  const toggleOutputPanel = () => {
    const panel = outputPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
        setIsOutputCollapsed(false);
      } else {
        panel.collapse();
        setIsOutputCollapsed(true);
      }
    }
  };

  const handleOutputTabClick = (tab) => {
    setActiveOutputTab(tab);
    if (outputPanelRef.current && outputPanelRef.current.isCollapsed()) {
      outputPanelRef.current.expand();
      setIsOutputCollapsed(false);
    }
  };

  // Format Code handler (POST /format)
  const handleFormat = async () => {
    if (formatting || running || submitting || !code) return;

    setFormatting(true);
    setApiError(null);

    try {
      const res = await formatAPI.formatCode({
        source_code: code,
        language: CURRENT_LANGUAGE,
      });

      if (res && res.formatted_code) {
        setCode(res.formatted_code);
      }
    } catch (err) {
      console.error('Format code error:', err);
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setApiError(err.message || 'Failed to format code.');
    } finally {
      setFormatting(false);
    }
  };

  // Tab key indentation handler for code editor
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indent = '    '; // 4 spaces

      if (e.shiftKey) {
        // Dedent
        const beforeStart = code.substring(0, start);
        const lineStart = beforeStart.lastIndexOf('\n') + 1;
        const currentLine = code.substring(lineStart, end);

        if (currentLine.startsWith(indent)) {
          const newCode = code.substring(0, lineStart) + currentLine.substring(indent.length);
          setCode(newCode);
          const newPos = Math.max(lineStart, start - indent.length);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = newPos;
          }, 0);
        } else if (currentLine.startsWith(' ')) {
          const match = currentLine.match(/^ +/);
          const spacesToRemove = match ? Math.min(match[0].length, 4) : 0;
          if (spacesToRemove > 0) {
            const newCode = code.substring(0, lineStart) + currentLine.substring(spacesToRemove);
            setCode(newCode);
            const newPos = Math.max(lineStart, start - spacesToRemove);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = newPos;
            }, 0);
          }
        }
      } else {
        // Indent
        if (start === end) {
          const newCode = code.substring(0, start) + indent + code.substring(end);
          setCode(newCode);
          const newPos = start + indent.length;
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = newPos;
          }, 0);
        } else {
          const before = code.substring(0, start);
          const lineStart = before.lastIndexOf('\n') + 1;
          const selectedText = code.substring(lineStart, end);
          const indentedText = selectedText.split('\n').map(line => indent + line).join('\n');
          const newCode = code.substring(0, lineStart) + indentedText + code.substring(end);
          setCode(newCode);
          const newStart = start + indent.length;
          const newEnd = end + (indentedText.length - selectedText.length);
          setTimeout(() => {
            textarea.selectionStart = newStart;
            textarea.selectionEnd = newEnd;
          }, 0);
        }
      }
    }
  };

  const fetchProblemDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await problemAPI.getProblemById(id);
      setProblem(data);
      if (data && data.test_cases && data.test_cases.length > 0) {
        setActiveTestcaseTabId(data.test_cases[0]._id || 'sample-0');
      }
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

  const fetchSubmissionsList = async () => {
    setLoadingSubmissions(true);
    setSubmissionsError(null);
    try {
      const data = await submissionAPI.getSubmissions({ problem_id: id });
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => {
        return new Date(b.submitted_at || b.createdAt || 0) - new Date(a.submitted_at || a.createdAt || 0);
      });
      setSubmissionsList(sorted);
    } catch (err) {
      console.error('Failed to fetch submissions list:', err);
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setSubmissionsError(err.message || 'Failed to load submissions list');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleLeftTabClick = (tab) => {
    setActiveLeftTab(tab);
    if (tab === 'submissions') {
      fetchSubmissionsList();
    }
  };

  const handleSelectSubmissionRow = async (submissionId) => {
    setLoadingSubmissionDetail(true);
    setSubmissionDetailError(null);
    try {
      const detail = await submissionAPI.getSubmissionById(submissionId);
      setSelectedSubmissionDetail(detail);
    } catch (err) {
      console.error('Failed to fetch submission detail:', err);
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setSubmissionDetailError(err.message || 'Failed to load submission details');
    } finally {
      setLoadingSubmissionDetail(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProblemDetails();
    }
  }, [id]);

  // Combined testcases list (sample test cases + user-added custom test cases)
  const sampleTestCases = (problem?.test_cases || []).map((tc, idx) => ({
    id: tc._id || `sample-${idx}`,
    name: `Case ${idx + 1}`,
    input: tc.input || '',
    output: tc.output || '',
    isSample: true,
  }));

  const formattedCustomCases = customTestCases.map((tc, idx) => ({
    id: tc.id,
    name: `Custom ${idx + 1}`,
    input: tc.input || '',
    output: null,
    isCustom: true,
  }));

  const allTestCases = [...sampleTestCases, ...formattedCustomCases];

  // Set default active tab ID if unselected
  useEffect(() => {
    if (!activeTestcaseTabId && allTestCases.length > 0) {
      setActiveTestcaseTabId(allTestCases[0].id);
    }
  }, [allTestCases, activeTestcaseTabId]);

  const handleAddCustomCase = () => {
    const newId = `custom-${Date.now()}`;
    const newCase = { id: newId, input: '' };
    setCustomTestCases(prev => [...prev, newCase]);
    setActiveTestcaseTabId(newId);
    setActiveOutputTab('testcase');
  };

  const handleRemoveCustomCase = (caseId, e) => {
    e.stopPropagation();
    setCustomTestCases(prev => prev.filter(c => c.id !== caseId));
    if (activeTestcaseTabId === caseId) {
      const remaining = allTestCases.filter(c => c.id !== caseId);
      setActiveTestcaseTabId(remaining[0]?.id || null);
    }
  };

  const handleUpdateCustomCaseInput = (caseId, newInput) => {
    setCustomTestCases(prev => prev.map(c => c.id === caseId ? { ...c, input: newInput } : c));
  };

  // Handler for Run button (POST /run)
  const handleRun = async () => {
    if (running || submitting) return;

    if (outputPanelRef.current && outputPanelRef.current.isCollapsed()) {
      outputPanelRef.current.expand();
      setIsOutputCollapsed(false);
    }

    setRunning(true);
    setApiError(null);
    setActiveOutputTab('run');

    try {
      if (allTestCases.length === 0) {
        // Run with empty input if no test cases exist
        const res = await compileAPI.runCode({
          source_code: code,
          input: '',
        });
        setRunResult({
          mode: 'single',
          ...res,
        });
      } else {
        // Run against all sample & custom test cases
        const results = await Promise.all(
          allTestCases.map(async (tc) => {
            const res = await compileAPI.runCode({
              source_code: code,
              input: tc.input || '',
            });
            return { tc, res };
          })
        );

        const compileErr = results.find(r => r.res.status === 'CompileError');
        if (compileErr) {
          setRunResult({
            status: 'CompileError',
            error: compileErr.res.error,
          });
        } else {
          const parsedCases = results.map(({ tc, res }) => {
            let verdict = 'Failed';
            let actualOutput = res.output || '';
            let errorInfo = res.error || '';

            if (res.status === 'TimeLimitExceeded') {
              verdict = 'TimeLimitExceeded';
              actualOutput = 'Time Limit Exceeded (5000ms)';
            } else if (res.status === 'RuntimeError') {
              verdict = 'RuntimeError';
              actualOutput = res.error || res.output || 'Runtime Error';
            } else if (tc.isSample) {
              const trimmedActual = (res.output || '').replace(/\s+$/, '');
              const trimmedExpected = (tc.output || '').replace(/\s+$/, '');
              verdict = trimmedActual === trimmedExpected ? 'Passed' : 'Failed';
            } else {
              verdict = 'Success';
            }

            return {
              id: tc.id,
              name: tc.name,
              isSample: tc.isSample,
              isCustom: tc.isCustom,
              input: tc.input || '',
              expectedOutput: tc.output || '',
              actualOutput,
              stderr: res.stderr || '',
              verdict,
              error: errorInfo,
            };
          });

          setRunResult({
            status: 'Success',
            cases: parsedCases,
          });
        }
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

    if (outputPanelRef.current && outputPanelRef.current.isCollapsed()) {
      outputPanelRef.current.expand();
      setIsOutputCollapsed(false);
    }

    setSubmitting(true);
    setApiError(null);
    setActiveOutputTab('submission');

    try {
      const initialRes = await submissionAPI.submitCode({
        problem_id: id,
        source_code: code,
      });

      if (initialRes && initialRes._id) {
        const fullSubmission = await submissionAPI.getSubmissionById(initialRes._id);
        setSubmissionResult(fullSubmission);
      } else {
        setSubmissionResult(initialRes);
      }
      fetchSubmissionsList();
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

  const handleRunRef = useRef(handleRun);
  handleRunRef.current = handleRun;

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    const onRun = () => handleRunRef.current();
    const onSubmit = () => handleSubmitRef.current();

    setActions({
      onRun,
      onSubmit,
      running,
      submitting,
    });
    return () => setActions(null);
  }, [running, submitting, setActions]);

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
  const currentTestcase = allTestCases.find(tc => tc.id === activeTestcaseTabId) || allTestCases[0];
  const currentResultCase = runResult?.cases?.find(c => c.id === activeTestcaseTabId) || runResult?.cases?.[0];

  return (
    <div className="problem-page-container">
      {/* Two-Panel Layout */}
      <Group orientation="horizontal" className="problem-workspace-grid">

        {/* ================= LEFT PANEL: Problem Details ================= */}
        <Panel
          panelRef={descPanelRef}
          defaultSize={45}
          minSize={20}
          collapsible={true}
          collapsedSize={50}
          onResize={() => {
            if (descPanelRef.current) {
              setIsDescCollapsed(descPanelRef.current.isCollapsed());
            }
          }}
          className="problem-left-panel"
        >
          {isDescCollapsed ? (
            <div className="collapsed-desc-strip">
              <button
                type="button"
                className="btn-panel-toggle"
                onClick={toggleDescPanel}
                title="Expand Description"
              >
                <ChevronRight size={16} />
              </button>
              <span className="collapsed-desc-title">
                {activeLeftTab === 'submissions' ? 'Submissions' : 'Description'}
              </span>
            </div>
          ) : (
            <div className="panel-content-container">
              {/* Tab Switcher Header */}
              <div className="left-panel-tab-header">
                <div className="left-panel-tab-btns">
                  <button
                    type="button"
                    className={`left-panel-tab-btn ${activeLeftTab === 'description' ? 'active' : ''}`}
                    onClick={() => handleLeftTabClick('description')}
                  >
                    <FileText size={14} />
                    <span>Description</span>
                  </button>
                  <button
                    type="button"
                    className={`left-panel-tab-btn ${activeLeftTab === 'submissions' ? 'active' : ''}`}
                    onClick={() => handleLeftTabClick('submissions')}
                  >
                    <Layers size={14} />
                    <span>Submissions</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-panel-toggle"
                  onClick={toggleDescPanel}
                  title="Collapse Description"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              {activeLeftTab === 'description' ? (
                <>
                  {/* Header Card */}
                  <div className="panel-section header-section">
                    <div className="panel-title-header-row">
                      <h1 className="problem-main-title">{problem.title}</h1>
                    </div>

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
                </>
              ) : (
                /* SUBMISSIONS TAB CONTENT */
                <div className="left-panel-submissions-wrapper">
                  {selectedSubmissionDetail ? (
                    /* Detail View */
                    <div className="submission-detail-view">
                      <button
                        type="button"
                        className="btn-back-link"
                        onClick={() => setSelectedSubmissionDetail(null)}
                        style={{ marginBottom: '1rem' }}
                      >
                        <ArrowLeft size={16} />
                        <span>Back to Submissions</span>
                      </button>

                      {loadingSubmissionDetail ? (
                        <div className="output-loading-state">
                          <RefreshCw size={22} className="spin-icon text-red" />
                          <span>Loading submission details...</span>
                        </div>
                      ) : submissionDetailError ? (
                        <div className="alert-banner error">
                          <AlertCircle size={18} />
                          <span>{submissionDetailError}</span>
                        </div>
                      ) : (
                        <>
                          <SubmissionVerdictDetails submission={selectedSubmissionDetail} showBreakdown={false} />

                          <div className="submission-code-section" style={{ marginTop: '1.25rem' }}>
                            <h4 className="tc-results-heading">Submitted Code (C++)</h4>
                            <pre className="submission-code-block">
                              <code>{selectedSubmissionDetail.source_code || '// No source code available'}</code>
                            </pre>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* List View */
                    <div className="submissions-list-view">
                      {loadingSubmissions ? (
                        <div className="output-loading-state">
                          <RefreshCw size={22} className="spin-icon text-red" />
                          <span>Fetching submissions...</span>
                        </div>
                      ) : submissionsError ? (
                        <div className="alert-banner error">
                          <AlertCircle size={18} />
                          <span>{submissionsError}</span>
                        </div>
                      ) : submissionsList.length === 0 ? (
                        <div className="output-placeholder-state" style={{ minHeight: '200px' }}>
                          <span className="output-placeholder-text">No submissions yet</span>
                        </div>
                      ) : (
                        <div className="submissions-table-container">
                          <div className="submissions-table-header">
                            <span>Status</span>
                            <span>Language</span>
                            <span>Submitted At</span>
                          </div>
                          <div className="submissions-list">
                            {submissionsList.map((sub) => {
                              const isAccepted = sub.status === 'Accepted';
                              const statusClass = isAccepted ? 'verdict-accepted' : `verdict-${(sub.status || '').toLowerCase()}`;

                              return (
                                <div
                                  key={sub._id}
                                  className="submission-row"
                                  onClick={() => handleSelectSubmissionRow(sub._id)}
                                >
                                  <div className="submission-row-status">
                                    <span className={`verdict-tag ${statusClass}`}>
                                      {sub.status || 'Pending'}
                                    </span>
                                  </div>
                                  <div className="submission-row-lang">
                                    <span>C++</span>
                                  </div>
                                  <div className="submission-row-time">
                                    <span>{new Date(sub.submitted_at || sub.createdAt).toLocaleString()}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </Panel>

        <Separator className="resize-handle-horizontal" />

        {/* ================= RIGHT PANEL: Code Editor & Execution ================= */}
        <Panel defaultSize={55} minSize={30} className="problem-right-panel">
          <Group orientation="vertical">
            <Panel defaultSize={50} minSize={30} className="problem-code-editor">

              {/* Editor Header Bar */}
              <div className="editor-header-bar">
                <div className="lang-indicator">
                  <Code2 size={16} className="icon-accent" />
                  <span className="lang-name">C++</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-format-action"
                    onClick={handleFormat}
                    disabled={formatting || running || submitting}
                    title="Format Code"
                  >
                    <span>{"{ }"}</span>
                  </button>
                  <span className="editor-status-text">Drafting Solution</span>
                </div>
              </div>

              {/* Main Code Editor Area */}
              <div className="editor-area-wrapper">
                <textarea
                  className="code-textarea-placeholder"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="// Write your code here..."
                  spellCheck="false"
                  wrap="off"
                />
              </div>
            </Panel>

            <Separator className="resize-handle-vertical" />

            <Panel
              panelRef={outputPanelRef}
              defaultSize={50}
              minSize={20}
              collapsible={true}
              collapsedSize={36}
              onResize={() => {
                if (outputPanelRef.current) {
                  setIsOutputCollapsed(outputPanelRef.current.isCollapsed());
                }
              }}
              className="problem-output-section"
            >
              {/* Output & Submission Results Section */}
              <div className="output-section-wrapper">

                {/* Tab Header Controls */}
                <div className="output-tabs-header">
                  <div className="tabs-header-left">
                    <button
                      type="button"
                      className={`output-tab-btn ${activeOutputTab === 'testcase' ? 'active' : ''}`}
                      onClick={() => handleOutputTabClick('testcase')}
                    >
                      <Layers size={13} />
                      <span>Testcase</span>
                    </button>

                    <button
                      type="button"
                      className={`output-tab-btn ${activeOutputTab === 'run' ? 'active' : ''}`}
                      onClick={() => handleOutputTabClick('run')}
                    >
                      <Terminal size={13} />
                      <span>Test Result</span>
                    </button>

                    <button
                      type="button"
                      className={`output-tab-btn ${activeOutputTab === 'submission' ? 'active' : ''}`}
                      onClick={() => handleOutputTabClick('submission')}
                    >
                      <Send size={13} />
                      <span>Submission Results</span>
                    </button>
                  </div>

                  <div className="tabs-header-right">
                    <button
                      type="button"
                      className="btn-panel-toggle"
                      onClick={toggleOutputPanel}
                      title={isOutputCollapsed ? "Expand Output" : "Collapse Output"}
                    >
                      {isOutputCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Display Area Content */}
                {!isOutputCollapsed && (
                  <div className="output-display-container">

                  {/* Network / Server Error Banner */}
                  {apiError && (
                    <div className="alert-banner error" style={{ marginBottom: '0.75rem' }}>
                      <AlertCircle size={18} />
                      <span>{apiError}</span>
                    </div>
                  )}

                  {/* TAB 1: TESTCASE MANAGEMENT */}
                  {activeOutputTab === 'testcase' && (
                    <div className="testcase-management-view">
                      {/* Testcase Sub-Tabs Row */}
                      <div className="tc-subtabs-row">
                        {allTestCases.map((tc) => (
                          <button
                            key={tc.id}
                            type="button"
                            className={`tc-subtab-pill ${activeTestcaseTabId === tc.id ? 'active' : ''}`}
                            onClick={() => setActiveTestcaseTabId(tc.id)}
                          >
                            <span>{tc.name}</span>
                            {tc.isCustom && (
                              <X
                                size={12}
                                className="tc-remove-icon"
                                onClick={(e) => handleRemoveCustomCase(tc.id, e)}
                              />
                            )}
                          </button>
                        ))}

                        <button
                          type="button"
                          className="btn-add-custom-tc"
                          onClick={handleAddCustomCase}
                          title="Add Custom Test Case"
                        >
                          <Plus size={13} />
                          <span>Add Case</span>
                        </button>
                      </div>

                      {/* Selected Test Case Form / Detail */}
                      {currentTestcase ? (
                        <div className="tc-input-detail-box">
                          <div className="diff-item">
                            <span className="diff-lbl">Input (stdin):</span>
                            {currentTestcase.isCustom ? (
                              <textarea
                                className="custom-input-textarea"
                                value={currentTestcase.input}
                                onChange={(e) => handleUpdateCustomCaseInput(currentTestcase.id, e.target.value)}
                                placeholder="Enter custom stdin input here..."
                                rows={3}
                                spellCheck="false"
                              />
                            ) : (
                              <pre className="diff-val-code">{currentTestcase.input || '(empty)'}</pre>
                            )}
                          </div>

                          {currentTestcase.isSample && (
                            <div className="diff-item" style={{ marginTop: '0.5rem' }}>
                              <span className="diff-lbl">Expected Output:</span>
                              <pre className="diff-val-code expected">{currentTestcase.output || '(empty)'}</pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="output-placeholder-state">
                          <span className="output-placeholder-text">
                            No test cases. Click "Add Case" to create a custom test case.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: RUN OUTPUT / TEST RESULT */}
                  {activeOutputTab === 'run' && (
                    <>
                      {running ? (
                        <div className="output-loading-state">
                          <RefreshCw size={22} className="spin-icon text-red" />
                          <span>Compiling and evaluating test cases...</span>
                        </div>
                      ) : runResult ? (
                        <div className="run-result-view">
                          {runResult.status === 'CompileError' ? (
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
                          ) : runResult.cases ? (
                            <div className="sample-results-container">
                              {/* Case Sub-Tabs Bar for Results */}
                              <div className="tc-subtabs-row" style={{ marginBottom: '0.75rem' }}>
                                {runResult.cases.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    className={`tc-subtab-pill ${activeTestcaseTabId === c.id ? 'active' : ''}`}
                                    onClick={() => setActiveTestcaseTabId(c.id)}
                                  >
                                    <span>{c.name}</span>
                                    {c.isSample && (
                                      <span className={`mini-verdict verdict-${c.verdict.toLowerCase()}`}>
                                        {c.verdict === 'Passed' ? 'Passed' : 'Failed'}
                                      </span>
                                    )}
                                    {c.isCustom && (
                                      <span className="mini-verdict verdict-output">Output</span>
                                    )}
                                  </button>
                                ))}
                              </div>

                              {/* Selected Case Result Card */}
                              {currentResultCase ? (
                                <div className="tc-sample-details-box">
                                  <div className="diff-item">
                                    <span className="diff-lbl">Input (stdin):</span>
                                    <pre className="diff-val-code">{currentResultCase.input || '(empty)'}</pre>
                                  </div>

                                  {currentResultCase.isSample ? (
                                    <div className="sample-diff-side-by-side" style={{ marginTop: '0.5rem' }}>
                                      <div className="diff-item">
                                        <span className="diff-lbl">Expected Output:</span>
                                        <pre className="diff-val-code expected">{currentResultCase.expectedOutput || '(empty)'}</pre>
                                      </div>
                                      <div className="diff-item">
                                        <span className="diff-lbl">Actual Output:</span>
                                        <pre className={`diff-val-code ${currentResultCase.verdict === 'Passed' ? 'actual-pass' : 'actual-fail'}`}>
                                          {currentResultCase.actualOutput || currentResultCase.error || '(No output)'}
                                        </pre>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="diff-item" style={{ marginTop: '0.5rem' }}>
                                      <span className="diff-lbl">Program Output (stdout):</span>
                                      <pre className="diff-val-code actual-pass">
                                        {currentResultCase.actualOutput || currentResultCase.error || '(No output)'}
                                      </pre>
                                    </div>
                                  )}

                                  {currentResultCase.stderr && (
                                    <div className="diff-item" style={{ marginTop: '0.5rem' }}>
                                      <span className="diff-lbl text-amber">Stderr:</span>
                                      <pre className="diff-val-code text-amber">{currentResultCase.stderr}</pre>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="output-placeholder-state">
                                  <span className="output-placeholder-text">Select a case tab above to view results.</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Single run output fallback */
                            <>
                              <div className="run-status-header">
                                <span className={`status-tag status-${runResult.status?.toLowerCase()}`}>
                                  {runResult.status === 'Success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                  <span>{runResult.status}</span>
                                </span>
                              </div>

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
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="output-placeholder-state">
                          <span className="output-placeholder-text">
                            Click "Run" to execute your solution against test cases.
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 3: SUBMISSION RESULTS */}
                  {activeOutputTab === 'submission' && (
                    <>
                      {submitting ? (
                        <div className="output-loading-state">
                          <RefreshCw size={22} className="spin-icon text-red" />
                          <span>Evaluating code against problem test cases...</span>
                        </div>
                      ) : submissionResult ? (
                        <SubmissionVerdictDetails submission={submissionResult} />
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
              )}
            </div>

          </Panel>
          </Group>
        </Panel>

      </Group>
    </div>
  );
};
