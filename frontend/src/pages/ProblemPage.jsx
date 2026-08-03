import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, HardDrive, Tag, Sparkles, 
  AlertCircle, RefreshCw, Terminal, FileText, Code2, Play, Send 
} from 'lucide-react';
import { problemAPI } from '../services/api';
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

  const fetchProblemDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await problemAPI.getProblemById(id);
      setProblem(data);
    } catch (err) {
      console.error('Failed to fetch problem details:', err);
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
      {/* Top Bar Navigation */}
      <div className="problem-page-header">
        <button className="btn-back-link" onClick={() => navigate('/problems')}>
          <ArrowLeft size={16} />
          <span>Problem List</span>
        </button>
        <div className="header-problem-title">
          <span className="title-text">{problem.title}</span>
          <span className={`diff-tag ${difficultyClass}`}>
            {problem.difficulty || 'Easy'}
          </span>
        </div>
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
              placeholder="Enter stdin input to test your code with..."
              rows={3}
              spellCheck="false"
            />
          </div>

          {/* Output Section (Read-Only Display) */}
          <div className="output-section-wrapper">
            <div className="section-label">
              <FileText size={14} />
              <span>Output (stdout)</span>
            </div>
            <div className="output-display-box read-only">
              <span className="output-placeholder-text">
                Output will be displayed here after running or submitting your code.
              </span>
            </div>
          </div>

          {/* Action Bar with Run and Submit Buttons */}
          <div className="editor-actions-bar">
            <button className="btn-run-action" type="button">
              <Play size={15} />
              <span>Run</span>
            </button>
            <button className="btn-submit-action" type="button">
              <Send size={15} />
              <span>Submit</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
