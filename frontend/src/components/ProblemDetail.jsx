import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, HardDrive, Tag, Sparkles, 
  AlertCircle, RefreshCw, Terminal, CheckCircle2, FileText 
} from 'lucide-react';
import { problemAPI } from '../services/api';
import './ProblemDetail.css';

export const ProblemDetail = ({ problemId: propProblemId, onBack: propOnBack }) => {
  const { id: routeProblemId } = useParams();
  const navigate = useNavigate();

  const problemId = propProblemId || routeProblemId;

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleBack = () => {
    if (propOnBack) {
      propOnBack();
    } else {
      navigate('/problems');
    }
  };

  const fetchProblemDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await problemAPI.getProblemById(problemId);
      setProblem(data);
    } catch (err) {
      console.error('Failed to fetch problem detail:', err);
      setError(err.message || 'Failed to load problem details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (problemId) {
      fetchProblemDetails();
    }
  }, [problemId]);

  if (loading) {
    return (
      <div className="problem-detail-container" style={{ paddingTop: '3rem' }}>
        <div className="state-card loading-state">
          <RefreshCw size={32} className="spin-icon text-red" />
          <p className="state-title">Fetching Problem Specification...</p>
          <p className="state-desc">Loading statement, constraints, and test cases from GET /problems/{problemId}</p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="problem-detail-container" style={{ paddingTop: '3rem' }}>
        <button className="btn-secondary btn-sm" onClick={handleBack} style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Problems</span>
        </button>
        <div className="state-card error-state">
          <AlertCircle size={36} className="text-red" />
          <p className="state-title">Problem Not Found</p>
          <p className="state-desc">{error || 'The requested problem could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="problem-detail-wrapper">
      <div className="problem-detail-container">
        
        {/* Back Navigation Button */}
        <button className="btn-secondary btn-back" onClick={handleBack}>
          <ArrowLeft size={16} />
          <span>Back to Problem List</span>
        </button>

        {/* Problem Header Card */}
        <div className="detail-header-card">
          <div className="header-meta-row">
            <span className={`diff-tag diff-${(problem.difficulty || 'easy').toLowerCase()}`}>
              {problem.difficulty || 'Easy'}
            </span>
            
            <div className="limits-group">
              <span className="limit-pill" title="Time Limit">
                <Clock size={13} />
                <span>{problem.time_limit_ms || 2000} ms</span>
              </span>
              <span className="limit-pill" title="Memory Limit">
                <HardDrive size={13} />
                <span>{Math.round((problem.memory_limit_kb || 262144) / 1024)} MB</span>
              </span>
            </div>
          </div>

          <h1 className="problem-detail-title">{problem.title}</h1>

          {problem.tags && problem.tags.length > 0 && (
            <div className="detail-tags-row">
              {problem.tags.map((tag, idx) => (
                <span key={idx} className="tag-pill">
                  <Tag size={11} style={{ marginRight: 4 }} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Problem Statement Card */}
        <div className="detail-section-card">
          <div className="section-title">
            <FileText size={18} className="text-red" />
            <h3>Problem Statement</h3>
          </div>
          <div className="statement-content">
            {problem.statement}
          </div>
        </div>

        {/* Constraints Card */}
        {problem.constraints && (
          <div className="detail-section-card">
            <div className="section-title">
              <Sparkles size={18} className="text-red" />
              <h3>Constraints</h3>
            </div>
            <pre className="constraints-content">
              {problem.constraints}
            </pre>
          </div>
        )}

        {/* Sample Test Cases Section */}
        <div className="detail-section-card">
          <div className="section-title">
            <Terminal size={18} className="text-red" />
            <h3>Sample Test Cases</h3>
          </div>

          {problem.test_cases && problem.test_cases.length > 0 ? (
            <div className="test-cases-list">
              {problem.test_cases.map((tc, idx) => (
                <div key={tc._id || idx} className="sample-tc-box">
                  <div className="tc-header">Sample Case #{idx + 1}</div>
                  <div className="tc-grid">
                    <div className="tc-block">
                      <span className="tc-label">Input</span>
                      <pre className="tc-code">{tc.input}</pre>
                    </div>
                    <div className="tc-block">
                      <span className="tc-label">Output</span>
                      <pre className="tc-code">{tc.output}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-tc-msg">No sample test cases provided for this problem.</p>
          )}
        </div>

      </div>
    </div>
  );
};
