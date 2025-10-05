import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExpenseReportSection = () => {
  const today = new Date();

  // Format date as yyyy-mm-dd adjusted for India Standard Time (+5:30)
  function formatDateIST(date) {
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const todayISO = formatDateIST(today);
  const firstDayCurrentMonth = formatDateIST(new Date(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const [startDate, setStartDate] = useState(firstDayCurrentMonth);
  const [endDate, setEndDate] = useState(todayISO);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ensure endDate never goes before startDate
  useEffect(() => {
    if (startDate && endDate < startDate) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    setReport([]);
    setError('');
    try {
      const res = await axios.post('https://expensetracker-backend-9cqw.onrender.com/api/expenses/report', {
        startDate,
        endDate,
      });
      setReport(res.data);
    } catch (e) {
      setError('Could not fetch report. ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const response = await axios.post(
        'https://expensetracker-backend-9cqw.onrender.com/api/expenses/report/pdf',
        { startDate, endDate },
        { responseType: 'blob' }
      );
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Expense_Report_${startDate}_to_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download PDF: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-4">
      <h2 className="text-lg font-semibold mb-4 text-white">Expense Report (By Category)</h2>
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="text-gray-300 mr-2">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={todayISO}
            className="bg-gray-900 text-white p-2 rounded"
          />
        </div>
        <div>
          <label className="text-gray-300 mr-2">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            max={todayISO}
            className="bg-gray-900 text-white p-2 rounded"
          />
        </div>
        <button
          className="bg-emerald-500 text-white py-2 px-4 rounded-xl font-bold hover:bg-emerald-600 transition-colors"
          onClick={fetchReport}
          disabled={loading || !startDate}
        >
          {loading ? 'Fetching…' : 'Generate'}
        </button>

        

        <button
        aria-label="Download PDF"
        title="Download PDF"
        className="bg-blue-600 text-white py-2 px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
        onClick={downloadPdf}
        disabled={!startDate || !endDate}
        >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0 0l-4-4m4 4l4-4M12 4v8" />
        </svg>
        </button>

      </div>

      {error && <p className="text-red-400">{error}</p>}

      {!loading && report.length > 0 && (
        <div className="mt-4">
          <h3 className="text-white font-medium mb-2">Category Totals:</h3>
          <ul className="divide-y divide-gray-700">
            {report.map((r) => (
              <li key={r._id} className="py-3 flex justify-between items-center">
                <span className="text-gray-200 font-semibold">{r._id}</span>
                <span className="text-emerald-400 font-bold">
                  ₹{Number(r.totalAmount).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && report.length === 0 && (
        <p className="text-gray-400 mt-4">No data to display for selected range.</p>
      )}
    </div>
  );
};

export default ExpenseReportSection;
