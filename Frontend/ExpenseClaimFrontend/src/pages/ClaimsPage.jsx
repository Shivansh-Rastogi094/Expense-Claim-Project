import React, { useState, useEffect } from "react";
import { ClaimService } from "../services/claimService";
import { SummaryService } from "../services/summaryService";

export default function ClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [filterDept, setFilterDept] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const categories = [
    { value: "TRAVEL", label: "Travel" },
    { value: "FOOD", label: "Food" },
    { value: "ACCOMMODATION", label: "Accommodation" },
    { value: "OFFICE_SUPPLIES", label: "Office Supplies" },
    { value: "EQUIPMENT", label: "Equipment" },
    { value: "OTHER", label: "Other" },
  ];

  const statuses = [
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

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

  // Fetch departments
  useEffect(() => {
    SummaryService.getDepartments()
      .then((data) => setDepartments(data))
      .catch((err) => console.error("Failed to fetch departments", err));
  }, []);

  // Fetch claims when filters change
  useEffect(() => {
    fetchClaims();
  }, [filterDept, filterMonth, filterYear, filterStatus, filterCategory]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDept) params.department = filterDept;
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;

      const data = await ClaimService.getClaims(params);
      setClaims(data);
    } catch (err) {
      console.error("Failed to fetch claims", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterDept("");
    setFilterMonth("");
    setFilterYear("");
    setFilterStatus("");
    setFilterCategory("");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "badge badge-approved";
      case "PENDING":
        return "badge badge-pending";
      case "REJECTED":
        return "badge badge-rejected";
      default:
        return "badge";
    }
  };

  const formatCategory = (cat) => {
    const found = categories.find((c) => c.value === cat);
    return found ? found.label : cat;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-surface-container-lowest p-4 rounded-xl border border-border-subtle shadow-sm">
        {/* Department Filter */}
        <div className="relative">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="appearance-none bg-surface border border-border-subtle rounded-full py-2 pl-4 pr-10 font-body-sm text-body-sm text-primary focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none bg-surface border border-border-subtle rounded-full py-2 pl-4 pr-10 font-body-sm text-body-sm text-primary focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-surface border border-border-subtle rounded-full py-2 pl-4 pr-10 font-body-sm text-body-sm text-primary focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div className="relative">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="appearance-none bg-surface border border-border-subtle rounded-full py-2 pl-4 pr-10 font-body-sm text-body-sm text-primary focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all cursor-pointer"
          >
            <option value="">All Months</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div className="relative">
          <input
            type="number"
            placeholder="Year (e.g. 2026)"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-surface border border-border-subtle rounded-full py-2 px-4 font-body-sm text-body-sm text-primary focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all w-36"
          />
        </div>

        {/* Clear Filters */}
        {(filterDept || filterCategory || filterStatus || filterMonth || filterYear) && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-4 py-2 hover:bg-surface-container-high rounded-full font-body-sm text-body-sm text-on-surface-variant transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Claims List Table */}
      <div className="bg-surface-container-lowest border border-border-subtle rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary"></div>
          </div>
        ) : claims.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3">
              search_off
            </span>
            <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
              No Claims Found
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Try adjusting your filters or submit a new expense claim.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse font-body-sm text-body-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-container-low text-on-surface-variant font-semibold">
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Remark</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr
                    key={claim.id}
                    className="border-b border-border-subtle hover:bg-surface-container-lowest transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-primary">
                      {claim.employeeName}
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant">
                      {claim.department}
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant">
                      {formatCategory(claim.category)}
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant tabular-nums">
                      {claim.expenseDate}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-primary tabular-nums">
                      ₹{claim.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={getStatusClass(claim.status)}>{claim.status}</span>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant italic truncate max-w-[200px]">
                      {claim.reviewRemark || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
