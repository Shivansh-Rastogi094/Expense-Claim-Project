import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function SummaryPage() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Fetch departments on mount
  useEffect(() => {
    apiClient
      .get("/departments")
      .then((res) => {
        setDepartments(res.data);
        if (res.data.length > 0) {
          setSelectedDept(res.data[0]);
        }
      })
      .catch((err) => console.error("Failed to fetch departments", err));
  }, []);

  // Fetch summary when parameters change
  useEffect(() => {
    if (selectedDept && selectedMonth && selectedYear) {
      fetchSummary();
    }
  }, [selectedDept, selectedMonth, selectedYear]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/summary", {
        params: {
          department: selectedDept,
          month: selectedMonth,
          year: selectedYear,
        },
      });
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch summary", err);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const getMonthLabel = (val) => {
    const found = months.find((m) => m.value === val);
    return found ? found.label : "";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
      {/* Controls Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-surface-container-lowest p-5 rounded-xl border border-border-subtle shadow-sm">
        <div>
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            {selectedDept ? `${selectedDept} Department` : "Select Department"}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Financial summary for {getMonthLabel(selectedMonth)} {selectedYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Selector */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="appearance-none bg-surface border border-border-subtle rounded-lg py-2 pl-4 pr-10 font-body-sm text-body-sm text-primary focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="appearance-none bg-surface border border-border-subtle rounded-lg py-2 pl-4 pr-10 font-body-sm text-body-sm text-primary focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Input */}
          <div>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="bg-surface border border-border-subtle rounded-lg py-2 px-4 font-body-sm text-body-sm text-primary focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all w-24"
              placeholder="Year"
            />
          </div>
        </div>
      </div>

      {/* Summary Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary"></div>
        </div>
      ) : !summary ? (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-10 text-center flex-1 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">
            insert_chart
          </span>
          <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
            No Summary Data Available
          </h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Ensure you have selected a department, month, and year.
          </p>
        </div>
      ) : (
        <div className="space-y-6 flex-1">
          {/* Main Financial Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-grid">
            {/* Monthly Budget */}
            <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-1 ambient-shadow">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Monthly Budget
              </span>
              <span className="text-2xl font-bold text-primary tabular-nums mt-1">
                ₹{summary.monthlyBudget.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <div className="text-[11px] text-on-surface-variant mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">account_balance</span>
                <span>Assigned limit</span>
              </div>
            </div>

            {/* Total Approved */}
            <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-1 ambient-shadow">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Total Approved
              </span>
              <span className="text-2xl font-bold text-status-approved tabular-nums mt-1">
                ₹{summary.totalApprovedExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <div className="text-[11px] text-status-approved mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>Budget utilized</span>
              </div>
            </div>

            {/* Total Pending */}
            <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-1 ambient-shadow">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Total Pending
              </span>
              <span className="text-2xl font-bold text-status-pending tabular-nums mt-1">
                ₹{summary.totalPendingExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <div className="text-[11px] text-status-pending mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">pending</span>
                <span>Awaiting review</span>
              </div>
            </div>

            {/* Remaining Budget */}
            <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-1 ambient-shadow">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Remaining Budget
              </span>
              <span className={`text-2xl font-bold tabular-nums mt-1 ${
                summary.remainingBudget < 0 ? "text-status-rejected animate-pulse" : "text-secondary"
              }`}>
                ₹{summary.remainingBudget.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <div className={`text-[11px] mt-2 flex items-center gap-1 ${
                summary.remainingBudget < 0 ? "text-status-rejected" : "text-on-surface-variant"
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {summary.remainingBudget < 0 ? "warning" : "payments"}
                </span>
                <span>
                  {summary.remainingBudget < 0 ? "Budget exceeded!" : "Available balance"}
                </span>
              </div>
            </div>
          </div>

          {/* Counts Grid */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-6 shadow-sm">
            <h4 className="font-headline-sm text-headline-sm text-primary font-bold mb-4">
              Expense Claims Volume
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Pending Count */}
              <div className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border-subtle">
                <div className="w-12 h-12 rounded-full bg-status-pending/10 text-status-pending flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">pending</span>
                </div>
                <div>
                  <span className="block text-2xl font-bold text-primary tabular-nums">
                    {summary.pendingCount}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">Pending Claims</span>
                </div>
              </div>

              {/* Approved Count */}
              <div className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border-subtle">
                <div className="w-12 h-12 rounded-full bg-status-approved/10 text-status-approved flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">check_circle</span>
                </div>
                <div>
                  <span className="block text-2xl font-bold text-primary tabular-nums">
                    {summary.approvedCount}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">Approved Claims</span>
                </div>
              </div>

              {/* Rejected Count */}
              <div className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border-subtle">
                <div className="w-12 h-12 rounded-full bg-status-rejected/10 text-status-rejected flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">cancel</span>
                </div>
                <div>
                  <span className="block text-2xl font-bold text-primary tabular-nums">
                    {summary.rejectedCount}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">Rejected Claims</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
