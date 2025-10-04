const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const MONGO_URI = 'mongodb+srv://rishavjha771:8qRIAVWwFDFzWlTq@cluster0.tzjm4zy.mongodb.net/ExpenseTrackerDB';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define Schemas and Models
const expenseSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  category: String,
  date: Date,
}, { timestamps: true });

const incomeSchema = new mongoose.Schema({
  source: String,
  amount: Number,
  date: Date,
}, { timestamps: true });

const budgetSchema = new mongoose.Schema({
  category: String,
  limit: Number,
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
const Income = mongoose.model('Income', incomeSchema);
const Budget = mongoose.model('Budget', budgetSchema);

const app = express();

app.use(cors());
app.use(express.json());

// Expense Routes
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;
    const expense = new Expense({ description, amount, category, date });
    await expense.save();
    res.status(201).json(expense);
  } catch {
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Expense not found' });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Income Routes
app.get('/api/incomes', async (req, res) => {
  try {
    const incomes = await Income.find().sort({ date: -1 });
    res.json(incomes);
  } catch {
    res.status(500).json({ error: 'Failed to fetch incomes' });
  }
});

app.post('/api/incomes', async (req, res) => {
  try {
    const { source, amount, date } = req.body;
    const income = new Income({ source, amount, date });
    await income.save();
    res.status(201).json(income);
  } catch {
    res.status(500).json({ error: 'Failed to add income' });
  }
});

app.put('/api/incomes/:id', async (req, res) => {
  try {
    const updated = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Income not found' });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update income' });
  }
});

app.delete('/api/incomes/:id', async (req, res) => {
  try {
    const deleted = await Income.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Income not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

// Budget Routes
app.get('/api/budgets', async (req, res) => {
  try {
    const budgetsArray = await Budget.find();
    const budgets = budgetsArray.reduce((acc, b) => {
      acc[b.category] = b;
      return acc;
    }, {});
    res.json(budgets);
  } catch {
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const { category, limit } = req.body;
    let budget = await Budget.findOne({ category });
    if (budget) {
      budget.limit = limit;
    } else {
      budget = new Budget({ category, limit });
    }
    await budget.save();
    res.status(201).json(budget);
  } catch {
    res.status(500).json({ error: 'Failed to set budget' });
  }
});

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const updated = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Budget not found' });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const deleted = await Budget.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Budget not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});


const GEMINI_API_KEY_MAIN = 'AIzaSyCWgS2C2_tCfxEB5v7w1yLe6UzVcAirMVw';
const GEMINI_URL_MAIN = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';


async function fetchAllFinanceData() {
  const budgetsArray = await Budget.find();
  const budgets = budgetsArray.reduce((acc, b) => {
    acc[b.category] = b;
    return acc;
  }, {});

  const incomes = await Income.find().sort({ date: -1 });
  const expenses = await Expense.find().sort({ date: -1 });

  return { budgets, incomes, expenses };
}

app.post('/run-gemini', async (req, res) => {
  try {
    const financeData = await fetchAllFinanceData();

    const description = req.body.description || 
      "Summarize my current income, categorized expenses, and budgets. List overspending categories and offer savings advice.";

    const geminiPrompt = `${description}\n\nData:\n${JSON.stringify(financeData)}`;

    const geminiRes = await axios.post(
      `${GEMINI_URL_MAIN}?key=${GEMINI_API_KEY_MAIN}`,
      {
        contents: [
          { parts: [{ text: geminiPrompt }] }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    res.json(geminiRes.data);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

// Get expenses by date range and group by category
app.post('/api/expenses/report', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    const expenses = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          expenses: { $push: "$$ROOT" }
          
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report', details: err.message });
  }
});
 {/*expenses: { $push: "$$ROOT" } */}

// app.delete('/api/expenses', async (req, res) => {
//   try {
//     const result = await Expense.deleteMany({});
//     res.json({ success: true, deletedCount: result.deletedCount });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to delete all expenses' });
//   }
// });



app.delete('/api/expenses', async (req, res) => {
  try {
    // Fetch all expenses without deleting
    const expenses = await Expense.find({});

    // Log each expense to console for verification
    expenses.forEach(expense => {
      console.log('Dummy delete log - Expense:', expense.description, expense.amount, expense.category);
    });

    // Send dummy success response with count of expenses found
    res.json({ success: true, message: 'Dummy delete: did not delete expenses', totalExpenses: expenses.length });
  } catch (err) {
    res.status(500).json({ error: 'Dummy delete failed', details: err.message });
  }
});



//PDF Generation route can be added here if needed
const PDFDocument = require('pdfkit'); // Add at top with other requires

// Add this route after your existing routes:

// POST /api/expenses/report/pdf - generate PDF report by date range
// app.post('/api/expenses/report/pdf', async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;
//     if (!startDate || !endDate) {
//       return res.status(400).json({ error: 'startDate and endDate are required' });
//     }

//     // Aggregate expenses grouped by category
//     const expenses = await Expense.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(startDate),
//             $lte: new Date(endDate)
//           }
//         }
//       },
//       {
//         $group: {
//           _id: "$category",
//           totalAmount: { $sum: "$amount" }
//         }
//       },
//       { $sort: { totalAmount: -1 } }
//     ]);

//     // Create PDF document
//     const doc = new PDFDocument();
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename=Expense_Report_${startDate}_to_${endDate}.pdf`
//     );

//     doc.pipe(res);

//     // Title
//     doc.fontSize(18).text('Expense Report (By Category)', { align: 'center' });
//     doc.moveDown();

//     // Dates
//     doc.fontSize(12).text(`Start Date: ${startDate}`);
//     doc.text(`End Date: ${endDate}`);
//     doc.moveDown();

//     // Table header
//     doc.fontSize(14).text('Category', { continued: true, width: 200 });
//     doc.text('Total', { align: 'right' });
//     doc.moveDown();

//     // Table rows
//     expenses.forEach(item => {
//       doc.fontSize(12).text(item._id, { continued: true, width: 200 });
//       doc.text(`₹${Number(item.totalAmount).toLocaleString()}`, { align: 'right' });
//     });

//     doc.end();

//   } catch (err) {
//     console.error('PDF generation error:', err);
//     res.status(500).json({ error: err.message });
//   }
// });



// app.post('/api/expenses/report/pdf', async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;
//     if (!startDate || !endDate) {
//       return res.status(400).json({ error: 'startDate and endDate are required' });
//     }

//     const expenses = await Expense.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(startDate),
//             $lte: new Date(endDate)
//           }
//         }
//       },
//       {
//         $group: {
//           _id: "$category",
//           totalAmount: { $sum: "$amount" }
//         }
//       },
//       { $sort: { totalAmount: -1 } }
//     ]);

//     const grandTotal = expenses.reduce((sum, e) => sum + e.totalAmount, 0);

//     const doc = new PDFDocument({ margin: 40, size: "A4" });
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=Expense_Report_${startDate}_to_${endDate}.pdf`
//     );

//     doc.pipe(res);

//     // Title
//     doc.fontSize(18).text("Expense Report (By Category)", { align: "center" });
//     doc.moveDown();

//     // Dates
//     doc.fontSize(12).text(`Start Date: ${startDate}`);
//     doc.text(`End Date: ${endDate}`);
//     doc.moveDown(1.5);

//     // Table layout
//     const itemX = 50;
//     const amountX = 400;
//     let y = doc.y;

//     doc.fontSize(14).text("Category", itemX, y, { bold: true });
//     doc.text("Total", amountX, y, { align: "right" });

//     y += 20;
//     doc.moveTo(itemX, y).lineTo(550, y).stroke();
//     y += 10;

//     // Rows
//     doc.fontSize(12);
//     expenses.forEach(({ _id, totalAmount }) => {
//       doc.text(_id, itemX, y);
//       doc.text(`${Number(totalAmount).toLocaleString()}`, amountX, y, {
//         align: "right",
//       });
//       y += 20;
//     });

//     // Grand total
//     y += 10;
//     doc.moveTo(itemX, y).lineTo(550, y).stroke();
//     y += 10;

//     doc.fontSize(14).text("Grand Total", itemX, y, { bold: true });
//     doc.text(`${grandTotal.toLocaleString()}`, amountX, y, {
//       align: "right",
//       bold: true,
//     });

//     doc.end();
//   } catch (err) {
//     console.error("PDF generation error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

//const PDFDocument = require('pdfkit');
// const moment = require('moment');
// //const axios = require('axios');

// // Helper to format currency
// function formatCurrency(amount) {
//   return `₹${Number(amount).toLocaleString('en-IN')}`;
// }

// app.post('/api/expenses/report/pdf', async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;
//     if (!startDate || !endDate) {
//       return res.status(400).json({ error: 'startDate and endDate are required' });
//     }

//     // Fetch your finance data
//     const { budgets, incomes, expenses } = await fetchAllFinanceData();

//     // Filter incomes/expenses by date
//     const filteredExpenses = expenses.filter(
//       e => new Date(e.date) >= new Date(startDate) && new Date(e.date) <= new Date(endDate)
//     );
//     const filteredIncomes = incomes.filter(
//       i => new Date(i.date) >= new Date(startDate) && new Date(i.date) <= new Date(endDate)
//     );

//     // Summary calcs
//     const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
//     const perCategory = {};
//     filteredExpenses.forEach(e => {
//       if (!perCategory[e.category]) perCategory[e.category] = { total: 0, items: [] };
//       perCategory[e.category].total += e.amount;
//       perCategory[e.category].items.push(e);
//     });
//     // Compare budgets
//     const overspent = [];
//     for (let [category, { total }] of Object.entries(perCategory)) {
//       if (budgets[category] && total > budgets[category].limit) {
//         overspent.push(category);
//       }
//     }

//     // Optionally, call Gemini for AI summary/advice (async, can be awaited/flushed)
//     const geminiPrompt =
//       `Summarize the following period's income, category-wise expenses, and compare with budgets. ` +
//       `Flag overspending and provide savings/efficiency tips. Data: ` +
//       JSON.stringify({ budgets, incomes: filteredIncomes, expenses: filteredExpenses });
//     let aiAdvice = '';
//     try {
//       const geminiRes = await axios.post(
//         `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
//         {
//           contents: [{ parts: [{ text: geminiPrompt }] }]
//         },
//         { headers: { "Content-Type": "application/json" } }
//       );
//       aiAdvice = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
//     } catch (e) {
//       aiAdvice = 'AI summary not available.';
//     }

//     // PDF generation
//     const doc = new PDFDocument({ margin: 40, size: "A4" });
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=Expense_Report_${startDate}_to_${endDate}.pdf`);
//     doc.pipe(res);

//     // Title/Header
//     doc.fontSize(20).text("DETAILED EXPENSE REPORT", { align: "center" });
//     doc.moveDown();
//     doc.fontSize(13)
//       .text(`Period: ${moment(startDate).format('LL')} to ${moment(endDate).format('LL')}`)
//       .moveDown();

//     // Summary
//     doc.fontSize(14).text("Summary", { underline: true });
//     doc.fontSize(12)
//       .text(`Total Income: ${formatCurrency(totalIncome)}`)
//       .text(`Total Expenses: ${formatCurrency(
//         filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
//       )}`)
//       .text(`Net Savings: ${formatCurrency(
//         totalIncome - filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
//       )}`);
//     doc.moveDown();

//     // Overspending Alert
//     if (overspent.length > 0) {
//       doc
//         .fontSize(12)
//         .fillColor('red')
//         .text(`Overspent categories: ${overspent.join(', ')}`)
//         .fillColor('black');
//     } else {
//       doc
//         .fontSize(12)
//         .fillColor('green')
//         .text('No overspending detected. Well done!')
//         .fillColor('black');
//     }
//     doc.moveDown();

//     // Table header
//     doc.fontSize(14).text("Expense Breakdown By Category", { underline: true });
//     doc.moveDown(0.5);
//     const itemX = 50, amountX = 260, budgetX = 360, statusX = 460, yInit = doc.y;
//     doc.fontSize(12)
//       .text("Category", itemX, yInit)
//       .text("Total", amountX, yInit)
//       .text("Budget", budgetX, yInit)
//       .text("Status", statusX, yInit);
//     doc.moveTo(itemX, doc.y + 15).lineTo(550, doc.y + 15).stroke();
//     let y = doc.y + 25;

//     // Table rows
//     Object.entries(perCategory).forEach(([cat, data]) => {
//       const limit = budgets[cat]?.limit;
//       const status = limit
//         ? (data.total > limit ? 'Overspent' : 'Within Budget')
//         : 'No Budget';
//       const color = status === 'Overspent' ? 'red' : (status === 'Within Budget' ? 'green' : 'black');
//       doc
//         .fillColor('black')
//         .text(cat, itemX, y)
//         .text(formatCurrency(data.total), amountX, y)
//         .text(limit ? formatCurrency(limit) : "-", budgetX, y)
//         .fillColor(color)
//         .text(status, statusX, y)
//         .fillColor('black');
//       y += 20;
//     });

//     // Income/Expense Tables (optional: List all transactions in appendix)
//     doc.addPage()
//       .fontSize(15)
//       .text("All Income Records", { underline: true });
//     doc.moveDown(0.7);
//     filteredIncomes.forEach(inc => {
//       doc.fontSize(11).text(
//         `[${moment(inc.date).format('DD MMM YYYY')}] ${inc.description || ''} - ${formatCurrency(inc.amount)}`
//       );
//     });

//     doc.addPage()
//       .fontSize(15)
//       .text("All Expense Records", { underline: true });
//     doc.moveDown(0.7);
//     filteredExpenses.forEach(exp => {
//       doc.fontSize(11).text(
//         `[${moment(exp.date).format('DD MMM YYYY')}] ${exp.category}: ${exp.description || ''} - ${formatCurrency(exp.amount)}`
//       );
//     });

//     // Optional: Additional analytics, chart images, etc.

//     // Final Gemini AI Advice
//     doc.addPage()
//       .fontSize(14)
//       .text("AI Insights & Suggestions", { underline: true })
//       .moveDown(0.7)
//       .fontSize(12)
//       .fillColor('gray')
//       .text(aiAdvice, { align: "left" })
//       .fillColor('black');

//     doc.end();
//   } catch (err) {
//     console.error("PDF generation error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

//const PDFDocument = require('pdfkit');
//const moment = require('moment');
//const axios = require('axios');

// For loading environment variables (best practice for API keys)
// require('dotenv').config();

/**
 * =============================================================================
 * CONFIGURATION
 * Centralizes layout and style settings for easy maintenance.
 * =============================================================================
 */
/**
 * Expense Report PDF Generation Module
 *
 * This module provides a professional, robust, and maintainable solution for generating
 * detailed financial PDF reports. It processes financial data, fetches AI-powered insights
 * from the Gemini API, and constructs a well-formatted PDF document.
 *
 * Key Features:
 * - Modular design with single-responsibility functions.
 * - Centralized configuration for easy styling and layout changes.
 * - Automatic pagination to handle lists of any length.
 * - Transactions are sorted by date and visually grouped for readability.
 * - Graceful error handling for both PDF generation and external API calls.
 *
 * @requires pdfkit - For PDF document creation.
 * @requires moment - For robust date formatting.
 * @requires axios - For making HTTP requests to the Gemini API.
 * @requires dotenv - (Recommended) For managing environment variables like API keys.
 */

//const PDFDocument = require('pdfkit');
const moment = require('moment');
//const axios = require('axios');

// For loading environment variables (best practice for API keys)
// require('dotenv').config();

/**
 * =============================================================================
 * CONFIGURATION
 * Centralizes layout and style settings for easy maintenance.
 * =============================================================================
 */
const LAYOUT_CONFIG = {
    MARGIN: 40,
    FONT_SIZES: {
        H1: 20,
        H2: 15,
        H3: 14,
        BODY: 12,
        SMALL: 11,
    },
    COLORS: {
        PRIMARY: 'black',
        SECONDARY: 'gray',
        SUCCESS: 'green',
        DANGER: 'red',
    },
    COLUMNS: {
        CATEGORY: 50,
        AMOUNT: 260,
        BUDGET: 360,
        STATUS: 460,
        END: 550,
    }
};

/**
 * =============================================================================
 * DATA PROCESSING & EXTERNAL SERVICES
 * Functions for processing data and interacting with external APIs.
 * =============================================================================
 */

/**
 * Processes raw financial data to generate summaries and categorizations.
 * @param {object} financeData - The raw data containing budgets, incomes, and expenses.
 * @param {string} startDate - The start date for filtering (e.g., '2025-09-01').
 * @param {string} endDate - The end date for filtering (e.g., '2025-09-30').
 * @returns {object} A structured object with processed financial summaries.
 */
function processFinancialData(financeData, startDate, endDate) {
    const { budgets, incomes, expenses } = financeData;

    // MODIFIED: Date filters have been removed to include all records.
    const filteredIncomes = incomes;
    const filteredExpenses = expenses;

    const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const expensesByCategory = {};
    filteredExpenses.forEach(e => {
        if (!expensesByCategory[e.category]) {
            expensesByCategory[e.category] = { total: 0, items: [] };
        }
        expensesByCategory[e.category].total += e.amount;
        expensesByCategory[e.category].items.push(e);
    });

    const overspentCategories = Object.entries(expensesByCategory)
        .filter(([category, { total }]) => budgets[category] && total > budgets[category].limit)
        .map(([category]) => category);

    return {
        startDate,
        endDate,
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses,
        filteredIncomes,
        filteredExpenses,
        expensesByCategory,
        overspentCategories,
        budgets
    };
}

/**
 * Fetches AI-powered insights from the Gemini API.
 * @param {object} data - The processed financial data.
 * @returns {Promise<string>} A string containing AI-generated advice.
 */
async function getAiInsights(data) {
    const prompt = `Summarize the following financial period. Total income was ${formatCurrency(data.totalIncome)} and total expenses were ${formatCurrency(data.totalExpenses)}. Highlight any overspending compared to budgets and provide actionable savings tips. Data: ${JSON.stringify({ budgets: data.budgets, expenses: data.filteredExpenses })}`;

    try {
        // Use environment variables for API URL and Key in a real application
        const GEMINI_URL = GEMINI_URL_MAIN || 'YOUR_GEMINI_API_ENDPOINT';
        const GEMINI_API_KEY = GEMINI_API_KEY_MAIN || 'YOUR_GEMINI_API_KEY';

        const response = await axios.post(
            `${GEMINI_URL}?key=${GEMINI_API_KEY}`, { contents: [{ parts: [{ text: prompt }] }] }, { headers: { "Content-Type": "application/json" } }
        );
        return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No AI summary available.';
    } catch (error) {
        console.error("Gemini API call failed:", error.message);
        return 'AI summary could not be generated at this time.';
    }
}

/**
 * =============================================================================
 * PDF GENERATION HELPERS
 * Functions dedicated to drawing specific parts of the PDF document.
 * =============================================================================
 */

function formatCurrency(amount) {
    // Removed the Rupee symbol to prevent font issues.
    return `${Number(amount).toLocaleString('en-IN')}`;
}

function generateHeader(doc, data) {
    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.H1).text("Detailed Expense Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.BODY).text(
        `Period: ${moment(data.startDate).format('LL')} to ${moment(data.endDate).format('LL')}`
    );
    doc.moveDown(2);
}

function generateSummary(doc, data) {
    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.H2).text("Financial Summary", { underline: true });
    doc.moveDown();
    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.BODY)
        .text(`Total Income: ${formatCurrency(data.totalIncome)}`)
        .text(`Total Expenses: ${formatCurrency(data.totalExpenses)}`)
        .text(`Net Savings: ${formatCurrency(data.netSavings)}`);
    doc.moveDown();

    if (data.overspentCategories.length > 0) {
        doc.fillColor(LAYOUT_CONFIG.COLORS.DANGER)
            .text(`Overspent Categories: ${data.overspentCategories.join(', ')}`);
    } else {
        doc.fillColor(LAYOUT_CONFIG.COLORS.SUCCESS)
            .text('No overspending detected. Well done!');
    }
    doc.fillColor(LAYOUT_CONFIG.COLORS.PRIMARY).moveDown(2);
}

function generateBreakdownTable(doc, data) {
    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.H2).text("Expense Breakdown by Category", { underline: true });
    doc.moveDown();

    const tableTop = doc.y;
    const { CATEGORY, AMOUNT, BUDGET, STATUS, END } = LAYOUT_CONFIG.COLUMNS;

    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.BODY)
        .text("Category", CATEGORY, tableTop)
        .text("Total Spent", AMOUNT, tableTop)
        .text("Budget", BUDGET, tableTop)
        .text("Status", STATUS, tableTop);
    doc.moveTo(CATEGORY, doc.y + 5).lineTo(END, doc.y + 5).stroke();
    doc.y += 15;

    Object.entries(data.expensesByCategory).forEach(([category, catData]) => {
        if (doc.y > doc.page.height - LAYOUT_CONFIG.MARGIN * 2) {
            doc.addPage();
        }
        const rowY = doc.y;
        const limit = data.budgets[category]?.limit;
        const status = limit ? (catData.total > limit ? 'Overspent' : 'Within Budget') : 'No Budget';
        const statusColor = status === 'Overspent' ? LAYOUT_CONFIG.COLORS.DANGER : (status === 'Within Budget' ? LAYOUT_CONFIG.COLORS.SUCCESS : LAYOUT_CONFIG.COLORS.PRIMARY);

        doc.text(category, CATEGORY, rowY)
            .text(formatCurrency(catData.total), AMOUNT, rowY)
            .text(limit ? formatCurrency(limit) : "—", BUDGET, rowY)
            .fillColor(statusColor).text(status, STATUS, rowY).fillColor(LAYOUT_CONFIG.COLORS.PRIMARY);
        doc.y += 20;
    });
}

/**
 * Generates a list of transactions, sorted and grouped by date with visual gaps.
 * @param {PDFDocument} doc - The PDFKit document instance.
 * @param {string} title - The title for the section.
 * @param {Array} items - The array of transaction items to list.
 * @param {Function} formatter - A function that formats a single item into a string.
 */
function generateTransactionList(doc, title, items, formatter) {
    doc.addPage().fontSize(LAYOUT_CONFIG.FONT_SIZES.H2).text(title, { underline: true });
    doc.moveDown();

    let lastDate = null; // Keep track of the last date printed

    items.forEach(item => {
        if (doc.y > doc.page.height - LAYOUT_CONFIG.MARGIN) {
            doc.addPage();
            doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.H2).text(`${title} (continued)`, { underline: true }).moveDown();
            lastDate = null; // Reset on new page to avoid an initial gap
        }

        const currentDate = moment(item.date).format('YYYY-MM-DD');
        if (lastDate && lastDate !== currentDate) {
            doc.moveDown(0.75); // Add a visual gap between different dates
        }

        doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.SMALL).text(formatter(item));
        doc.moveDown(0.5);
        lastDate = currentDate;
    });
}


function generateAiSection(doc, aiAdvice) {
    doc.addPage().fontSize(LAYOUT_CONFIG.FONT_SIZES.H2).text("AI Insights & Suggestions", { underline: true });
    doc.moveDown();
    doc.fillColor(LAYOUT_CONFIG.COLORS.SECONDARY)
        .fontSize(LAYOUT_CONFIG.FONT_SIZES.BODY)
        .text(aiAdvice, { align: 'left' });
    doc.fillColor(LAYOUT_CONFIG.COLORS.PRIMARY);
}

/**
 * =============================================================================
 * EXPRESS ROUTE HANDLER
 * The main controller that orchestrates the PDF generation process.
 * Assumes 'app' is your Express instance.
 * =============================================================================
 */
app.post('/api/expenses/report/pdf', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        // 1. Fetch and Process Data
        const rawFinanceData = await fetchAllFinanceData(); // Assume this function exists and returns { budgets, incomes, expenses }
        const reportData = processFinancialData(rawFinanceData, startDate, endDate);

        // 2. Get AI Insights (can run in parallel with PDF setup)
        const aiAdvicePromise = getAiInsights(reportData);

        // 3. Set Up PDF Document and Headers
        const doc = new PDFDocument({ margin: LAYOUT_CONFIG.MARGIN, size: "A4" });
        const fileName = `Expense_Report_${moment(startDate).format('YYYY-MM-DD')}_to_${moment(endDate).format('YYYY-MM-DD')}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        doc.pipe(res);

        // 4. Build PDF Content
        generateHeader(doc, reportData);
        generateSummary(doc, reportData);
        generateBreakdownTable(doc, reportData);

        const sortedIncomes = [...reportData.filteredIncomes].sort((a, b) => new Date(a.date) - new Date(b.date));
        generateTransactionList(doc, "All Income Records", sortedIncomes,
            // ***** FIX IS HERE *****
            // Changed 'item.description' to 'item.source' to get the correct income source.
            // If your field is named 'category' or something else, change it here.
            (item) => `[${moment(item.date).format('DD MMM YYYY')}] ${item.source || 'Income'} - ${formatCurrency(item.amount)}`
        );

        const sortedExpenses = [...reportData.filteredExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));
        generateTransactionList(doc, "All Expense Records", sortedExpenses,
            (item) => `[${moment(item.date).format('DD MMM YYYY')}] ${item.category}: ${item.description || ''} - ${formatCurrency(item.amount)}`
        );

        // 5. Add AI section once the promise resolves
        const aiAdvice = await aiAdvicePromise;
        generateAiSection(doc, aiAdvice);

        // 6. Finalize the PDF
        doc.end();

    } catch (err) {
        console.error("PDF generation error:", err);
        // Ensure a response is sent even on failure, without sending a broken PDF
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate PDF report." });
        }
    }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
