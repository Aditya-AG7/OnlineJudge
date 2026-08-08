import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, CheckCircle2, AlertCircle, RefreshCw, 
  Code2, Sparkles, FileText, Clock, HardDrive, Tag, Terminal, Layers, Check
} from 'lucide-react';
import { problemAPI } from '../services/api';
import './AddProblemPage.css';

export const AddProblemPage = () => {
  const navigate = useNavigate();

  // Active Wizard Step: 1 = Problem Details, 2 = Test Cases
  const [step, setStep] = useState(1);

  // Step 1: Problem Form State
  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [constraints, setConstraints] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [tagsInput, setTagsInput] = useState('');
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitKb, setMemoryLimitKb] = useState(262144);

  const [loadingProblem, setLoadingProblem] = useState(false);
  const [problemError, setProblemError] = useState(null);
  const [createdProblem, setCreatedProblem] = useState(null);

  // Step 2: Test Case Form State
  const [tcInput, setTcInput] = useState('');
  const [tcOutput, setTcOutput] = useState('');
  const [isSample, setIsSample] = useState(false);
  const [addedTestCases, setAddedTestCases] = useState([]);
  
  const [loadingTestCase, setLoadingTestCase] = useState(false);
  const [testCaseError, setTestCaseError] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Step 1 Submission: Create Problem (POST /problems)
  const handleCreateProblem = async (e) => {
    e.preventDefault();
    setProblemError(null);

    if (!title.trim() || !statement.trim()) {
      setProblemError('Title and Problem Statement are required fields.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setLoadingProblem(true);

    try {
      const payload = {
        title: title.trim(),
        statement: statement.trim(),
        constraints: constraints.trim(),
        difficulty,
        tags: parsedTags,
        time_limit_ms: Number(timeLimitMs) || 2000,
        memory_limit_kb: Number(memoryLimitKb) || 262144,
      };

      const result = await problemAPI.createProblem(payload);
      setCreatedProblem(result);
      setStep(2);
      showToast(`Problem "${result.title}" created successfully! Now add test cases.`, 'success');
    } catch (err) {
      console.error('Failed to create problem:', err);
      setProblemError(err.message || 'Failed to create problem. Please check permissions and fields.');
    } finally {
      setLoadingProblem(false);
    }
  };

  // Step 2 Submission: Add Test Case (POST /problems/:id/testcases)
  const handleAddTestCase = async (e) => {
    e.preventDefault();
    setTestCaseError(null);

    if (tcInput === undefined || tcInput === null || tcOutput === undefined || tcOutput === null || tcOutput.trim() === '') {
      setTestCaseError('Test case Output is required.');
      return;
    }

    if (!createdProblem) {
      setTestCaseError('No active problem found to attach test cases to.');
      return;
    }

    const problemId = createdProblem._id || createdProblem.id;

    setLoadingTestCase(true);

    try {
      const payload = {
        input: tcInput,
        output: tcOutput,
        is_sample: isSample,
      };

      const newTestCase = await problemAPI.addTestCase(problemId, payload);
      setAddedTestCases((prev) => [...prev, newTestCase]);

      // Reset testcase input fields
      setTcInput('');
      setTcOutput('');
      setIsSample(false);

      showToast('Test case added successfully!', 'success');
    } catch (err) {
      console.error('Failed to add testcase:', err);
      setTestCaseError(err.message || 'Failed to add test case.');
    } finally {
      setLoadingTestCase(false);
    }
  };

  return (
    <div className="add-problem-wrapper">
      <div className="add-problem-container">
        
        {/* Toast Alert Banner */}
        {toast && (
          <div className={`toast-notification ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="add-problem-header">
          <button 
            type="button" 
            className="btn-secondary btn-sm btn-back" 
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft size={16} />
            <span>Back to Admin Panel</span>
          </button>

          <div className="wizard-progress-bar">
            <div className={`wizard-step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">{step > 1 ? <Check size={14} /> : '1'}</div>
              <span className="step-label">Problem Specification</span>
            </div>
            <div className="wizard-divider" />
            <div className={`wizard-step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span className="step-label">Test Cases</span>
            </div>
          </div>
        </div>

        {/* STEP 1: CREATE PROBLEM SPECIFICATION */}
        {step === 1 && (
          <div className="add-problem-card">
            <div className="card-header">
              <div className="header-icon-wrapper">
                <FileText size={22} className="text-red" />
              </div>
              <div>
                <h1 className="form-page-title">Create New Problem</h1>
                <p className="form-page-subtitle">
                  Define problem statement, limits, tags, and constraints for the OnlineJudge repository.
                </p>
              </div>
            </div>

            {problemError && (
              <div className="alert-banner error">
                <AlertCircle size={18} />
                <span>{problemError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProblem} className="problem-form">
              
              {/* Title & Difficulty Row */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Problem Title <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. Two Sum, Median of Sorted Arrays"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select
                    className="form-input no-icon form-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Problem Statement */}
              <div className="form-group">
                <label className="form-label">
                  Problem Statement <span className="text-red">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  placeholder="Describe the problem, input format, output format, and rules..."
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  required
                />
              </div>

              {/* Constraints */}
              <div className="form-group">
                <label className="form-label">Constraints</label>
                <textarea
                  className="form-textarea code-font"
                  rows={3}
                  placeholder="e.g. 1 <= N <= 10^5&#10;1 <= A[i] <= 10^9"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                />
              </div>

              {/* Tags, Time Limit, Memory Limit */}
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Tags (Comma-Separated)</label>
                  <input
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. array, math, dp"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time Limit (ms)</label>
                  <input
                    type="number"
                    className="form-input no-icon"
                    placeholder="2000"
                    value={timeLimitMs}
                    onChange={(e) => setTimeLimitMs(e.target.value)}
                    min={100}
                    step={100}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Memory Limit (KB)</label>
                  <input
                    type="number"
                    className="form-input no-icon"
                    placeholder="262144"
                    value={memoryLimitKb}
                    onChange={(e) => setMemoryLimitKb(e.target.value)}
                    min={1024}
                    step={1024}
                  />
                </div>
              </div>

              {/* Form Submit Footer */}
              <div className="form-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/admin')}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="btn-primary btn-submit-problem"
                  disabled={loadingProblem}
                >
                  {loadingProblem ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Creating Problem...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Create Problem & Proceed to Testcases</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* STEP 2: ADD TEST CASES */}
        {step === 2 && createdProblem && (
          <div className="add-problem-card">
            <div className="card-header">
              <div className="header-icon-wrapper">
                <Terminal size={22} className="text-red" />
              </div>
              <div>
                <div className="created-title-badge-row">
                  <h1 className="form-page-title">{createdProblem.title}</h1>
                  <span className={`diff-tag diff-${(createdProblem.difficulty || 'easy').toLowerCase()}`}>
                    {createdProblem.difficulty || 'Easy'}
                  </span>
                </div>
                <p className="form-page-subtitle">
                  Problem ID: <code className="problem-id-code">{createdProblem._id || createdProblem.id}</code> — Add sample and hidden test cases below.
                </p>
              </div>
            </div>

            {testCaseError && (
              <div className="alert-banner error">
                <AlertCircle size={18} />
                <span>{testCaseError}</span>
              </div>
            )}

            {/* Test Case Entry Form */}
            <form onSubmit={handleAddTestCase} className="testcase-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Input (stdin)</label>
                  <textarea
                    className="form-textarea code-font"
                    rows={4}
                    placeholder="Enter input values to pipe into stdin..."
                    value={tcInput}
                    onChange={(e) => setTcInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Expected Output (stdout) <span className="text-red">*</span>
                  </label>
                  <textarea
                    className="form-textarea code-font"
                    rows={4}
                    placeholder="Enter expected stdout result..."
                    value={tcOutput}
                    onChange={(e) => setTcOutput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="checkbox-form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={isSample}
                    onChange={(e) => setIsSample(e.target.checked)}
                  />
                  <span>Is Sample Test Case? (Visible to users in problem description)</span>
                </label>
              </div>

              <div className="tc-action-row">
                <button
                  type="submit"
                  className="btn-secondary btn-add-tc"
                  disabled={loadingTestCase}
                >
                  {loadingTestCase ? (
                    <>
                      <RefreshCw size={15} className="spin-icon" />
                      <span>Adding Test Case...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>Add Test Case</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* List of Added Test Cases */}
            <div className="added-testcases-section">
              <h3 className="section-subtitle">
                Added Test Cases ({addedTestCases.length})
              </h3>

              {addedTestCases.length === 0 ? (
                <div className="empty-tc-box">
                  <Terminal size={28} className="text-muted" style={{ marginBottom: '0.5rem' }} />
                  <p>No test cases added yet. Add at least 1 sample or hidden testcase above.</p>
                </div>
              ) : (
                <div className="tc-list">
                  {addedTestCases.map((tc, idx) => (
                    <div key={tc._id || idx} className="tc-item-card">
                      <div className="tc-item-header">
                        <span className="tc-index">Test Case #{idx + 1}</span>
                        {tc.is_sample ? (
                          <span className="sample-badge sample">Sample Case</span>
                        ) : (
                          <span className="sample-badge hidden">Hidden Case</span>
                        )}
                      </div>
                      <div className="tc-item-grid">
                        <div className="tc-block">
                          <span className="block-lbl">Input (stdin):</span>
                          <pre className="block-val">{tc.input || '(Empty string)'}</pre>
                        </div>
                        <div className="tc-block">
                          <span className="block-lbl">Expected Output (stdout):</span>
                          <pre className="block-val">{tc.output}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2 Footer Navigation */}
            <div className="form-footer step2-footer">
              <button
                type="button"
                className="btn-primary btn-done"
                onClick={() => navigate('/admin')}
              >
                <CheckCircle2 size={16} />
                <span>Done (Return to Admin Panel)</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
