import React, { useState, useEffect } from 'react';
import './App.css';
import AiGeneratedSummary from './components/AiGeneratedSummary';
import ExpenseReportSection from './ExpenseReportSection';
import axios from 'axios';


const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const BASE_URL = 'https://expensetracker-backend-9cqw.onrender.com';

const App = () => {
  useEffect(() => {
    document.title = "ExpenseTracker";
  }, []);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // AI Summary Section State
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');

  const handleDeleteAllExpenses = async () => {
    if (!window.confirm("Are you sure you want to delete ALL expenses? This action cannot be undone.")) return;

    try {
      await axios.delete('BASE_URL/api/expenses'); // Ensure your backend supports DELETE /api/expenses to delete all
      // Assuming you clear the state accordingly after delete
      setExpenses([]);
      setEditingExpense(null);
      setExpenseForm({ description: '', amount: '', category: '', date: '' });
    } catch (error) {
      alert('Failed to delete all expenses: ' + (error.response?.data?.error || error.message));
    }
  };



  // Forms
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'Groceries',
    date: new Date().toISOString().slice(0, 10),
  });
  const [incomeForm, setIncomeForm] = useState({ source: 'Salary', amount: '' });
  const [budgetForm, setBudgetForm] = useState({ category: 'Groceries', limit: '' });

  // Editing state
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingIncome, setEditingIncome] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);

  // Date filters for dashboard
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));

  // Form handlers
  const handleExpenseChange = (e) => setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
  const handleIncomeChange = (e) => setIncomeForm({ ...incomeForm, [e.target.name]: e.target.value });
  const handleBudgetChange = (e) => setBudgetForm({ ...budgetForm, [e.target.name]: e.target.value });

  // Load all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [expRes, incRes, budRes] = await Promise.all([
          fetch(`${BASE_URL}/api/expenses`),
          fetch(`${BASE_URL}/api/incomes`),
          fetch(`${BASE_URL}/api/budgets`),
        ]);
        if (!expRes.ok || !incRes.ok || !budRes.ok) throw new Error('Fetch failed');
        const [expData, incData, budData] = await Promise.all([expRes.json(), incRes.json(), budRes.json()]);
        setExpenses(expData);
        setIncome(incData);
        setBudgets(budData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Expense CRUD
  const handleAddExpense = async (e) => {
    e.preventDefault();
    const payload = {
      description: expenseForm.category === 'Miscellaneous' ? expenseForm.description : expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date,
    };
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add expense');
      const data = await res.json();
      setExpenses((prev) => [...prev, data]);
      setExpenseForm({ description: '', amount: '', category: 'Groceries', date: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    const payload = {
      description: expenseForm.category === 'Miscellaneous' ? expenseForm.description : expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date,
    };
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/expenses/${editingExpense._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update expense');
      const updated = await res.json();
      setExpenses((prev) => prev.map((exp) => (exp._id === updated._id ? updated : exp)));
      setEditingExpense(null);
      setExpenseForm({ description: '', amount: '', category: 'Groceries', date: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      setExpenses((prev) => prev.filter((exp) => exp._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Income CRUD
  const handleAddIncome = async (e) => {
    e.preventDefault();
    const payload = {
      source: incomeForm.source,
      amount: parseFloat(incomeForm.amount),
      date: new Date().toISOString(),
    };
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/incomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add income');
      const data = await res.json();
      setIncome((prev) => [...prev, data]);
      setIncomeForm({ source: 'Salary', amount: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIncome = async (e) => {
    e.preventDefault();
    const payload = {
      source: incomeForm.source,
      amount: parseFloat(incomeForm.amount),
      date: new Date().toISOString(),
    };
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/incomes/${editingIncome._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update income');
      const updated = await res.json();
      setIncome((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      setEditingIncome(null);
      setIncomeForm({ source: 'Salary', amount: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIncome = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/incomes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete income');
      setIncome((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Budgets CRUD
  const handleSetBudget = async (e) => {
    e.preventDefault();
    const payload = { category: budgetForm.category, limit: parseFloat(budgetForm.limit) };
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to set budget');
      const data = await res.json();
      setBudgets((prev) => ({ ...prev, [data.category]: data }));
      setBudgetForm({ category: 'Groceries', limit: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    const payload = { category: budgetForm.category, limit: parseFloat(budgetForm.limit) };
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/budgets/${editingBudget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update budget');
      const updated = await res.json();
      setBudgets((prev) => ({ ...prev, [updated.category]: updated }));
      setEditingBudget(null);
      setBudgetForm({ category: 'Groceries', limit: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/budgets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete budget');
      setBudgets((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations for dashboard & pie chart data
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpenses;

  const filteredExpenses = expenses.filter((item) => {
    const itemDate = new Date(item.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return itemDate >= start && itemDate <= end;
  });

  const getCategoryBreakdown = (data) => {
    const breakdown = data.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    return { breakdown, total };
  };

  const { breakdown: categoryBreakdown, total: totalFilteredExpenses } = getCategoryBreakdown(filteredExpenses);

  const getPieChartData = () => {
    const colors = ['#f44336','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#03a9f4','#00bcd4','#009688','#4caf50'];
    let cumulativePercentage = 0;
    return Object.keys(categoryBreakdown).map((category, index) => {
      const amount = categoryBreakdown[category];
      const percentage = totalFilteredExpenses > 0 ? (amount / totalFilteredExpenses) * 100 : 0;
      const color = colors[index % colors.length];
      const offset = 100 - cumulativePercentage;
      cumulativePercentage += percentage;
      return { category, amount, percentage, color, offset };
    });
  };

  const pieChartData = getPieChartData();

  // Render functions...

  const renderDashboard = () => (
    <div className="p-6 space-y-8 ">

      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row justify-around text-center gap-4">
        <div>
          <h3 className="text-gray-400 text-sm font-semibold">Total Income</h3>
          <p className="text-green-400 text-3xl font-bold mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div>
          <h3 className="text-gray-400 text-sm font-semibold">Total Expenses</h3>
          <p className="text-red-400 text-3xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
        </div>
        <div>
          <h3 className="text-gray-400 text-sm font-semibold">Net Balance</h3>
          <p className={`text-3xl font-bold mt-1 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">Filter Expenses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start-date" className="block text-gray-400 text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 rounded-lg  bg-gray-900 text-white font-bold  border-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-gray-400 text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-900 text-white font-bold border-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Spending Breakdown*/}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex-1 w-full lg:w-auto">
          <h2 className="text-lg font-semibold mb-4 text-white text-center">Spending Breakdown</h2>
          {totalFilteredExpenses > 0 ? (
            <div className="relative w-48 h-48 mx-auto">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#2d3748" strokeWidth="3.8"></circle>
                {pieChartData.map((data, index) => (
                  <circle
                    key={index}
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke={data.color}
                    strokeWidth="3.8"
                    strokeDasharray={`${data.percentage} ${100 - data.percentage}`}
                    strokeDashoffset={data.offset}
                    transform="rotate(-90 18 18)"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-gray-400">Total</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400">No expenses in this range.</p>
          )}
        </div>
        <div className="flex-1 w-full lg:w-auto">
          <h3 className="text-md font-medium text-white mb-2">Category Totals</h3>
          <ul className="space-y-2">
            {pieChartData.map((data, index) => (
              <li key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
                  <span className="text-gray-300 font-medium">{data.category}</span>
                </div>
                <span className="text-sm font-semibold text-gray-300">{formatCurrency(data.amount)} ({data.percentage.toFixed(1)}%)</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">Budget Overview</h2>
        {Object.keys(budgets).length > 0 ? (
          Object.keys(budgets).map((category) => {
            const budgetLimit = budgets[category].limit;
            const spent = categoryBreakdown[category] || 0;
            const progress = (spent / budgetLimit) * 100;
            const progressColor = progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500';
            return (
              <div key={category} className="mb-4">
                <div className="flex justify-between items-center text-sm font-medium text-gray-300 mb-1">
                  <span>{category}</span>
                  <span>{formatCurrency(spent)} / {formatCurrency(budgetLimit)}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2">
                  <div className={`h-2 rounded-full ${progressColor}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-400">No budgets set. Go to the Budget tab to set one.</p>
        )}
      </div>

      <div>
          {/* ...other dashboard cards/sections... */}

          {/* Insert the AI Generated Summary Section here */}
          <AiGeneratedSummary />

          {/* ...other dashboard cards/sections... */}
     </div>

        <div>
          {/* Expense Report Section */}
          <ExpenseReportSection />
        </div>


    </div>
  );

  const renderExpenseTracker = () => (
    <div className="p-6 space-y-8">
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">{editingExpense ? 'Update Expense' : 'Add New Expense'}</h2>
        <form onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense} className="space-y-4">
          {expenseForm.category === 'Miscellaneous' && (
            <input
              type="text"
              name="description"
              placeholder="Description (Optional)"
              value={expenseForm.description}
              onChange={handleExpenseChange}
              className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
            />
          )}
          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={expenseForm.amount}
            onChange={handleExpenseChange}
            className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
            required
            min="0.01"
            step="0.01"
          />
          <select
            name="category"
            value={expenseForm.category}
            onChange={handleExpenseChange}
            className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Rent">Rent</option>
            <option value="Electricity">Electricity</option>
            <option value="Maid">Maid</option>
            <option value="Groceries">Groceries</option>
            <option value="Food">Food</option>
            <option value="Entertainment">Entertainment(Shopping/Outing)</option>
            <option value="Loan Repayment">Loan Repayment</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
          <input
            type="date"
            name="date"
            value={expenseForm.date}
            onChange={handleExpenseChange}
            className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <div className="flex gap-4 mt-4">
            <button type="submit" className="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-xl font-bold hover:bg-emerald-600 transition-colors">
              {editingExpense ? 'Update Expense' : 'Add Expense'}
            </button>
            {editingExpense && (
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseForm({ description: '', amount: '', category: 'Groceries', date: new Date().toISOString().slice(0, 10) });
                }}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      {/*EXPENSES HISTORY */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
  <h2 className="text-lg font-semibold mb-4 text-white flex justify-between items-center">
    Expense History
    <button
      onClick={handleDeleteAllExpenses}
      className="bg-red-600 text-white py-1.5 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
      disabled={expenses.length === 0}
      title="Delete all expenses"
    >
      Delete All Expenses
    </button>
  </h2>
  <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
    {expenses
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((expense) => (
        <div key={expense._id} className="flex items-center justify-between bg-gray-900 p-4 rounded-xl">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{expense.description}</p>
            <p className="text-xs text-gray-400">
              {expense.category} - {new Date(expense.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-semibold">{formatCurrency(expense.amount)}</span>
            <button
              onClick={() => {
                setEditingExpense(expense);
                setExpenseForm({
                  description: expense.description,
                  amount: expense.amount,
                  category: expense.category,
                  date: new Date(expense.date).toISOString().slice(0, 10),
                });
              }}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteExpense(expense._id)}
              className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
  </div>
</div>

    </div>
  );

  const renderIncomeTracker = () => (
    <div className="p-6 space-y-8">
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">{editingIncome ? 'Update Income' : 'Add New Income'}</h2>
        <form onSubmit={editingIncome ? handleUpdateIncome : handleAddIncome} className="space-y-4">
          <select
            name="source"
            value={incomeForm.source}
            onChange={handleIncomeChange}
            className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
            required
          >
            <option value="Salary">Salary</option>
            <option value="Friends">Friends</option>
            <option value="Parents">Parents</option>
            <option value="Month Rollover">Month RollOver</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={incomeForm.amount}
            onChange={handleIncomeChange}
            className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
            required
            min="0.01"
            step="0.01"
          />
          <div className="flex gap-4 mt-4">
            <button type="submit" className="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-xl font-bold hover:bg-emerald-600 transition-colors">
              {editingIncome ? 'Update Income' : 'Add Income'}
            </button>
            {editingIncome && (
              <button
                type="button"
                onClick={() => {
                  setEditingIncome(null);
                  setIncomeForm({ source: 'Salary', amount: '' });
                }}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">Income History</h2>
        <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
          {income
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((item) => (
              <div key={item._id} className="flex items-center justify-between bg-gray-900 p-4 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.source}</p>
                  <p className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-semibold">{formatCurrency(item.amount)}</span>
                  <button
                    onClick={() => {
                      setEditingIncome(item);
                      setIncomeForm({ source: item.source, amount: item.amount });
                    }}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteIncome(item._id)}
                    className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderBudgeting = () => (
    <div className="p-6 space-y-8">
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">{editingBudget ? 'Update Budget' : 'Set Monthly Budget'}</h2>
        <form onSubmit={editingBudget ? handleUpdateBudget : handleSetBudget} className="space-y-4">
          <select
            name="category"
            value={budgetForm.category}
            onChange={handleBudgetChange}
            className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Rent">Rent</option>
            <option value="Electricity">Electricity</option>
            <option value="Maid">Maid</option>
            <option value="Groceries">Groceries</option>
            <option value="Food">Food</option>
            <option value="Entertainment">Entertainment (Shopping/Outing)</option>
            <option value="Loan Repayment">Loan Repayment</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
          <input
            type="number"
            name="limit"
            placeholder="Budget Limit"
            value={budgetForm.limit}
            onChange={handleBudgetChange}
            className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
            required
            min="0.01"
            step="0.01"
          />
          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-purple-700 transition-colors"
            >
              {editingBudget ? 'Update Budget' : 'Set Budget'}
            </button>
            {editingBudget && (
              <button
                type="button"
                onClick={() => {
                  setEditingBudget(null);
                  setBudgetForm({ category: 'Groceries', limit: '' });
                }}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">Your Budgets</h2>
        <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
          {Object.keys(budgets).length > 0 ? (
            Object.keys(budgets).map((category) => (
              <div key={budgets[category]._id} className="flex items-center justify-between bg-gray-900 p-4 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-semibold">{formatCurrency(budgets[category].limit)}</span>
                  <button
                    onClick={() => {
                      setEditingBudget(budgets[category]);
                      setBudgetForm({ category: budgets[category].category, limit: budgets[category].limit });
                    }}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(budgets[category]._id)}
                    className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">No budgets set. Use the form above to set one.</p>
          )}
        </div>
      </div>
    </div>
  );

  // Loader while loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-medium">Loading...</div>
      </div>
    );
  }

  // Return main JSX
  return (
    
    <div className="bg-gray-950 min-h-screen text-gray-200 p-4 sm:p-8">
      
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        <header className="p-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Money Manager</h1>
          <p className="text-gray-400 mt-2">Your Personal Financial Dashboard</p>
        </header>
        <nav className="bg-gray-800 p-2">
          <ul className="flex justify-around text-sm sm:text-base font-semibold">
            <li>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`p-3 rounded-2xl transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`p-3 rounded-2xl transition-colors ${activeTab === 'expenses' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              >
                Expenses
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('income')}
                className={`p-3 rounded-2xl transition-colors ${activeTab === 'income' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              >
                Income
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('budget')}
                className={`p-3 rounded-2xl transition-colors ${activeTab === 'budget' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              >
                Budget
              </button>
            </li>
          </ul>
        </nav>
        <main>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'expenses' && renderExpenseTracker()}
          {activeTab === 'income' && renderIncomeTracker()}
          {activeTab === 'budget' && renderBudgeting()}
        </main>
      </div>
    </div>
  );
};

export default App;
