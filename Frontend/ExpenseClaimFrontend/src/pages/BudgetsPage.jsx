import React, { useState, useEffect } from "react";
import { BudgetService } from "../services/budgetService";
import { SummaryService } from "../services/summaryService";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    department: "",
    month: 1,
    year: new Date().getFullYear(),
    budgetAmount: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const months = [
    { value: 1, label: "Jan" },
    { value: 2, label: "Feb" },
    { value: 3, label: "Mar" },
    { value: 4, label: "Apr" },
    { value: 5, label: "May" },
    { value: 6, label: "Jun" },
    { value: 7, label: "Jul" },
    { value: 8, label: "Aug" },
    { value: 9, label: "Sep" },
    { value: 10, label: "Oct" },
    { value: 11, label: "Nov" },
    { value: 12, label: "Dec" },
  ];

  useEffect(() => {
    fetchDepartments();
    fetchBudgets();
  }, []);

  // Auto-dismiss error message after 5 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const fetchDepartments = async () => {
    try {
      const data = await SummaryService.getDepartments();
      setDepartments(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, department: data[0] }));
      }
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await BudgetService.getBudgets();
      setBudgets(data);
    } catch (err) {
      console.error("Failed to fetch budgets", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        ...formData,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        budgetAmount: parseFloat(formData.budgetAmount),
      };

      await BudgetService.addBudget(payload);
      setSuccessMsg("Budget added successfully!");
      setFormData((prev) => ({
        ...prev,
        budgetAmount: "",
      }));
      fetchBudgets();
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to add budget.";
      setErrorMsg(msg);
    }
  };

  const startEditing = (budget) => {
    setEditingId(budget.id);
    setEditAmount(budget.budgetAmount.toString());
    setErrorMsg("");
    setSuccessMsg("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditAmount("");
  };

  const handleUpdateBudget = async (id) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await BudgetService.updateBudget(id, parseFloat(editAmount));
      setSuccessMsg("Budget updated successfully!");
      setEditingId(null);
      setEditAmount("");
      fetchBudgets();
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to update budget.";
      setErrorMsg(msg);
    }
  };

  const getMonthLabel = (mValue) => {
    const found = months.find((m) => m.value === mValue);
    return found ? found.label : mValue;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
      {/* Add Budget Inline Form */}
      <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-6 shadow-sm shrink-0">
        <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-4">
          Add New Budget
        </h3>
        <form onSubmit={handleAddBudget} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
              Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
              className="w-full h-10 rounded border border-border-subtle bg-surface px-3 font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary text-primary outline-none"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="w-32">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
              Month
            </label>
            <select
              name="month"
              value={formData.month}
              onChange={handleInputChange}
              required
              className="w-full h-10 rounded border border-border-subtle bg-surface px-3 font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary text-primary outline-none"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-32">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
              Year
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              required
              placeholder="Year"
              className="w-full h-10 rounded border border-border-subtle bg-surface px-3 font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary text-primary outline-none"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
              Budget Amount (INR)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              name="budgetAmount"
              value={formData.budgetAmount}
              onChange={handleInputChange}
              required
              placeholder="0.00"
              className="w-full h-10 rounded border border-border-subtle bg-surface px-3 font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary text-primary outline-none"
            />
          </div>

          <button
            type="submit"
            className="h-10 bg-secondary hover:bg-secondary-container text-white px-5 rounded font-semibold text-body-sm transition-all duration-150 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Budget</span>
          </button>
        </form>
      </div>

      {/* Budget List Table */}
      <div className="bg-surface-container-lowest border border-border-subtle rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-border-subtle bg-surface-container-low shrink-0">
          <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
            Active Department Budgets
          </h3>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          </div>
        ) : budgets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">
              account_balance_wallet
            </span>
            <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
              No Budgets Set Up
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Use the form above to add your first department budget.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse font-body-sm text-body-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-container-low text-on-surface-variant font-semibold">
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Month</th>
                  <th className="py-4 px-6">Year</th>
                  <th className="py-4 px-6 text-right">Budget Amount</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => (
                  <tr
                    key={budget.id}
                    className="border-b border-border-subtle hover:bg-surface-container-lowest transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-primary">
                      {budget.department}
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant">
                      {getMonthLabel(budget.month)}
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant tabular-nums">
                      {budget.year}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-primary tabular-nums">
                      {editingId === budget.id ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="border border-secondary rounded py-1 px-2 font-body-sm text-body-sm text-right outline-none focus:ring-1 focus:ring-secondary w-32"
                        />
                      ) : (
                        `₹${budget.budgetAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {editingId === budget.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUpdateBudget(budget.id)}
                            className="bg-secondary text-white p-1.5 rounded hover:bg-secondary-container transition-all cursor-pointer flex items-center"
                            title="Save"
                          >
                            <span className="material-symbols-outlined text-[18px]">save</span>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-surface-container-high text-on-surface-variant p-1.5 rounded hover:bg-surface-container-highest transition-all cursor-pointer flex items-center"
                            title="Cancel"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(budget)}
                          className="text-secondary hover:text-secondary-container font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                          <span>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Toast Notification */}
      {(errorMsg || successMsg) && (
        <div className={`fixed bottom-6 right-6 bg-white border border-border-subtle rounded-xl p-4 shadow-xl flex items-center gap-3 z-50 max-w-sm border-l-4 animate-fade-in ${
          errorMsg ? "border-l-status-rejected" : "border-l-status-approved"
        }`}>
          <span className={`material-symbols-outlined ${
            errorMsg ? "text-status-rejected" : "text-status-approved"
          }`}>
            {errorMsg ? "error" : "check_circle"}
          </span>
          <div className="flex-grow min-w-0">
            <h4 className="font-semibold text-xs text-primary uppercase tracking-wider">
              {errorMsg ? "Error" : "Success"}
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 break-words">
              {errorMsg || successMsg}
            </p>
          </div>
          <button
            onClick={() => {
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
