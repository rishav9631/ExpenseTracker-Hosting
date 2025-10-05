import React, { useState } from 'react';
import axios from 'axios';


const AiGeneratedSummary = () => {
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [geminiSummary, setGeminiSummary] = useState('');
  const [error, setError] = useState('');

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError('');
    setGeminiSummary('');
    try {
      const res = await axios.post('https://expensetracker-backend-9cqw.onrender.com/run-gemini', {
        description: aiSummaryText
      });
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary received.';
      setGeminiSummary(text);
    } catch (e) {
      setError('Could not get summary. ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-4">
      <h2 className="text-lg font-semibold mb-4 text-white">AI Generated Summary</h2>
      <div className="flex items-center gap-4 mb-4">
        <input
          type="checkbox"
          id="ai-summary-checkbox"
          checked={aiSummaryEnabled}
          onChange={() => setAiSummaryEnabled(v => !v)}
          className="h-5 w-5 accent-emerald-500"
        />
        <label htmlFor="ai-summary-checkbox" className="text-gray-300 font-medium">
          Enable and Add Custom Description
        </label>
      </div>

      {aiSummaryEnabled && (
        <textarea
          className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500 mb-3"
          placeholder="Type your summary/description here..."
          rows="4"
          value={aiSummaryText}
          onChange={e => setAiSummaryText(e.target.value)}
          maxLength={500}
        />
      )}

      {/* Button always shows */}
      <button
        className="bg-emerald-500 text-white py-2 px-4 rounded-xl font-bold hover:bg-emerald-600 transition-colors"
        onClick={handleGenerateSummary}
        disabled={loading || (aiSummaryEnabled && !aiSummaryText)}
      >
        {loading ? 'Generating...' : 'Generate Summary'}
      </button>

      {error && <p className="text-red-400 mt-3">{error}</p>}
      {geminiSummary && (
        <div className="mt-4 bg-gray-700 p-4 rounded-xl">
          <h3 className="text-white font-medium mb-2">AI Summary Output:</h3>
          <p className="text-gray-200 whitespace-pre-line">{geminiSummary}</p>
        </div>
      )}
    </div>
  );
};

export default AiGeneratedSummary;

