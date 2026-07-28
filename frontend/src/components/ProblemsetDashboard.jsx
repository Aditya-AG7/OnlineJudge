import React, { useState } from 'react';
import { 
  Search, CheckCircle2, Circle, Flame, Award, 
  Code2, Filter, ChevronDown, ExternalLink, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ProblemsetDashboard.css';

// Sample curated competitive programming problem dataset
const SAMPLE_PROBLEMS = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy', category: 'Array & Hash Table', acceptance: '52.4%', status: 'solved' },
  { id: 2, title: 'Add Two Numbers', difficulty: 'Medium', category: 'Linked List & Math', acceptance: '41.8%', status: 'solved' },
  { id: 3, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', category: 'String & Sliding Window', acceptance: '34.6%', status: 'unsolved' },
  { id: 4, title: 'Median of Two Sorted Arrays', difficulty: 'Hard', category: 'Array & Binary Search', acceptance: '38.2%', status: 'unsolved' },
  { id: 5, title: 'Longest Palindromic Substring', difficulty: 'Medium', category: 'String & Dynamic Programming', acceptance: '33.7%', status: 'unsolved' },
  { id: 11, title: 'Container With Most Water', difficulty: 'Medium', category: 'Two Pointers & Array', acceptance: '54.9%', status: 'solved' },
  { id: 15, title: '3Sum', difficulty: 'Medium', category: 'Two Pointers & Sorting', acceptance: '33.8%', status: 'unsolved' },
  { id: 20, title: 'Valid Parentheses', difficulty: 'Easy', category: 'Stack & String', acceptance: '40.8%', status: 'solved' },
  { id: 21, title: 'Merge Two Sorted Lists', difficulty: 'Easy', category: 'Linked List & Recursion', acceptance: '63.4%', status: 'solved' },
  { id: 42, title: 'Trapping Rain Water', difficulty: 'Hard', category: 'Two Pointers & Stack', acceptance: '60.1%', status: 'unsolved' },
  { id: 53, title: 'Maximum Subarray', difficulty: 'Medium', category: 'Array & Dynamic Programming', acceptance: '50.6%', status: 'solved' },
  { id: 70, title: 'Climbing Stairs', difficulty: 'Easy', category: 'Dynamic Programming & Math', acceptance: '52.7%', status: 'solved' },
  { id: 121, title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', category: 'Array & DP', acceptance: '53.6%', status: 'solved' },
  { id: 200, title: 'Number of Islands', difficulty: 'Medium', category: 'BFS / DFS & Graph', acceptance: '58.3%', status: 'unsolved' },
  { id: 295, title: 'Find Median from Data Stream', difficulty: 'Hard', category: 'Heap & Design', acceptance: '51.9%', status: 'unsolved' },
];

const CATEGORIES = ['All Topics', 'Algorithms', 'Data Structures', 'Dynamic Programming', 'Graph', 'String', 'Math'];

export const ProblemsetDashboard = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter logic
  const filteredProblems = SAMPLE_PROBLEMS.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          problem.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(problem.id).includes(searchQuery);

    const matchesDifficulty = difficultyFilter === 'All' || problem.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === 'All' || problem.status === statusFilter.toLowerCase();
    const matchesCategory = selectedCategory === 'All Topics' || problem.category.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesDifficulty && matchesStatus && matchesCategory;
  });

  return (
    <div className="problemset-wrapper">
      <div className="problemset-container">
        
        {/* Top Hero Banner & Stats */}
        <div className="problemset-hero">
          <div className="hero-left">
            <div className="hero-badge">
              <Sparkles size={14} className="sparkle-icon" />
              <span>Competitive Problemset</span>
            </div>
            <h1 className="hero-title">
              Welcome back, <span className="hero-name">{user?.full_name || user?.username}</span>
            </h1>
            <p className="hero-desc">
              Practice algorithm challenges, sharpen data structures, and prepare for technical interviews.
            </p>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-header">
                <Flame size={18} className="stat-icon flame" />
                <span className="stat-label">Solved</span>
              </div>
              <div className="stat-number">
                7 <span className="stat-total">/ 15</span>
              </div>
              <div className="stat-progress-bar">
                <div className="stat-progress-fill" style={{ width: '46.6%' }} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Award size={18} className="stat-icon award" />
                <span className="stat-label">Difficulty Ratio</span>
              </div>
              <div className="difficulty-pills-row">
                <span className="diff-count easy">Easy: 4</span>
                <span className="diff-count medium">Med: 3</span>
                <span className="diff-count hard">Hard: 0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="filter-panel">
          {/* Topics scroll bar */}
          <div className="topics-scroll">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                className={`topic-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search and Dropdown Filters */}
          <div className="filter-controls-row">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search questions by title or topic..."
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

              <div className="select-wrapper">
                <SlidersHorizontal size={14} className="select-icon" />
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Solved">Solved</option>
                  <option value="Unsolved">Todo</option>
                </select>
                <ChevronDown size={14} className="chevron-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Problems Table */}
        <div className="problems-table-card">
          <table className="problems-table">
            <thead>
              <tr>
                <th className="col-status">Status</th>
                <th className="col-title">Title</th>
                <th className="col-acceptance">Acceptance</th>
                <th className="col-difficulty">Difficulty</th>
                <th className="col-category">Category</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.length > 0 ? (
                filteredProblems.map((p) => (
                  <tr key={p.id} className="problem-row">
                    <td className="col-status">
                      {p.status === 'solved' ? (
                        <CheckCircle2 size={18} className="status-solved" />
                      ) : (
                        <Circle size={18} className="status-unsolved" />
                      )}
                    </td>
                    <td className="col-title">
                      <span className="problem-title-text">
                        {p.id}. {p.title}
                      </span>
                    </td>
                    <td className="col-acceptance">{p.acceptance}</td>
                    <td className="col-difficulty">
                      <span className={`diff-tag diff-${p.difficulty.toLowerCase()}`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="col-category">
                      <span className="category-badge">{p.category}</span>
                    </td>
                    <td className="col-action">
                      <button className="btn-solve" onClick={() => alert(`Problem "${p.title}" solve page coming soon!`)}>
                        <span>Solve</span>
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-table-msg">
                    No problems match your current search/filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="table-footer">
            <span>Showing {filteredProblems.length} of {SAMPLE_PROBLEMS.length} problems</span>
          </div>
        </div>

      </div>
    </div>
  );
};
