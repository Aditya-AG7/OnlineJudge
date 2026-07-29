import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, CheckCircle2, Circle, Flame, Award, 
  Code2, Filter, ChevronDown, ExternalLink, Sparkles, SlidersHorizontal,
  RefreshCw, AlertCircle, Inbox, Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { problemAPI } from '../services/api';
import './ProblemsetDashboard.css';

export const ProblemsetDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  const fetchProblems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await problemAPI.getProblems();
      const problemsArray = Array.isArray(data) ? data : data.problems || [];
      setProblems(problemsArray);
    } catch (err) {
      console.error('Failed to fetch problems:', err);
      setError(err.message || 'Failed to load problems from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleOpenProblem = (problemId) => {
    navigate(`/problems/${problemId}`);
  };

  const filteredProblems = problems.filter(problem => {
    const titleMatch = problem.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const tagsMatch = problem.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSearch = titleMatch || tagsMatch;

    const matchesDifficulty = difficultyFilter === 'All' || problem.difficulty === difficultyFilter;

    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="problemset-wrapper">
      <div className="problemset-container">
        
        {/* Header Bar */}
        <div className="problemset-header-row">
          <div>
            <h2 className="problemset-section-title">
              Practice <span className="title-red">Problems</span>
            </h2>
            <p className="problemset-section-desc">
              Live algorithmic challenges fetched directly from the OnlineJudge repository.
            </p>
          </div>

          <button className="btn-secondary btn-refresh" onClick={fetchProblems} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="filter-controls-row">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search problems by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="dropdown-group">
            <div className="select-wrapper">
              <Filter size={14} className="select-icon" />
              <select
                className="filter-select"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <ChevronDown size={14} className="chevron-icon" />
            </div>
          </div>
        </div>

        {/* Dynamic Content States */}
        {loading ? (
          <div className="state-card loading-state">
            <RefreshCw size={32} className="spin-icon text-red" />
            <p className="state-title">Loading Practice Problems...</p>
            <p className="state-desc">Fetching live challenge directory from GET /problems</p>
          </div>
        ) : error ? (
          <div className="state-card error-state">
            <AlertCircle size={36} className="text-red" />
            <p className="state-title">Unable to Load Problems</p>
            <p className="state-desc">{error}</p>
            <button className="btn-primary btn-sm" onClick={fetchProblems} style={{ marginTop: '1rem', width: 'auto' }}>
              <RefreshCw size={14} />
              <span>Retry Request</span>
            </button>
          </div>
        ) : problems.length === 0 ? (
          <div className="state-card empty-state">
            <Inbox size={40} className="text-muted" />
            <p className="state-title">No problems yet</p>
            <p className="state-desc">There are no practice problems created in the database yet. Check back soon!</p>
          </div>
        ) : (
          <div className="problems-table-card">
            <table className="problems-table">
              <thead>
                <tr>
                  <th className="col-title">Title</th>
                  <th className="col-difficulty">Difficulty</th>
                  <th className="col-tags">Tags</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.length > 0 ? (
                  filteredProblems.map((p) => {
                    const pid = p._id || p.id;
                    return (
                      <tr key={pid} className="problem-row">
                        <td className="col-title">
                          <span 
                            className="problem-title-link"
                            onClick={() => handleOpenProblem(pid)}
                          >
                            {p.title}
                          </span>
                        </td>
                        <td className="col-difficulty">
                          <span className={`diff-tag diff-${(p.difficulty || 'easy').toLowerCase()}`}>
                            {p.difficulty || 'Easy'}
                          </span>
                        </td>
                        <td className="col-tags">
                          <div className="tags-container">
                            {p.tags && p.tags.length > 0 ? (
                              p.tags.map((tag, idx) => (
                                <span key={idx} className="tag-pill">
                                  <Tag size={10} style={{ marginRight: 3 }} />
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="no-tags">-</span>
                            )}
                          </div>
                        </td>
                        <td className="col-action">
                          <button 
                            className="btn-solve" 
                            onClick={() => handleOpenProblem(pid)}
                          >
                            <span>View Problem</span>
                            <ExternalLink size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="empty-table-msg">
                      No problems match your current search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="table-footer">
              <span>Showing {filteredProblems.length} of {problems.length} total problems</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
