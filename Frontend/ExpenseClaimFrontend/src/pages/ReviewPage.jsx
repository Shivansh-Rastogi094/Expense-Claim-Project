import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function ReviewPage() {
  const [pendingClaims, setPendingClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [reviewRemark, setReviewRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchPendingClaims();
  }, []);

  // Fetch budget summary when selected claim changes
  useEffect(() => {
    if (selectedClaim) {
      fetchBudgetSummary(selectedClaim);
      setReviewRemark("");
      setErrorMsg("");
      setSuccessMsg("");
    } else {
      setBudgetSummary(null);
    }
  }, [selectedClaim]);

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

  const fetchPendingClaims = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/claims", { params: { status: "PENDING" } });
      setPendingClaims(res.data);
      if (res.data.length > 0) {
        setSelectedClaim(res.data[0]);
      } else {
        setSelectedClaim(null);
      }
    } catch (err) {
      console.error("Failed to fetch pending claims", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetSummary = async (claim) => {
    try {
      const date = new Date(claim.expenseDate);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const res = await apiClient.get("/summary", {
        params: {
          department: claim.department,
          month,
          year,
        },
      });
      setBudgetSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch budget summary", err);
      setBudgetSummary(null);
    }
  };

  const handleApprove = async () => {
    if (!selectedClaim) return;
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await apiClient.put(`/claims/${selectedClaim.id}/approve`, {
        reviewRemark: reviewRemark.trim() || "Approved",
      });
      setSuccessMsg("Claim approved successfully!");
      // Remove approved claim from local list
      const updatedClaims = pendingClaims.filter((c) => c.id !== selectedClaim.id);
      setPendingClaims(updatedClaims);
      if (updatedClaims.length > 0) {
        setSelectedClaim(updatedClaims[0]);
      } else {
        setSelectedClaim(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to approve claim.";
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedClaim) return;
    if (!reviewRemark.trim()) {
      setErrorMsg("A review remark is required to reject a claim.");
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await apiClient.put(`/claims/${selectedClaim.id}/reject`, {
        reviewRemark: reviewRemark.trim(),
      });
      setSuccessMsg("Claim rejected successfully!");
      const updatedClaims = pendingClaims.filter((c) => c.id !== selectedClaim.id);
      setPendingClaims(updatedClaims);
      if (updatedClaims.length > 0) {
        setSelectedClaim(updatedClaims[0]);
      } else {
        setSelectedClaim(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to reject claim.";
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCategory = (cat) => {
    if (!cat) return "";
    return cat.charAt(0) + cat.slice(1).toLowerCase().replace("_", " ");
  };

  const getMonthName = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <div className="max-w-6xl w-full flex flex-col md:flex-row gap-gutter-grid mt-6 mx-auto h-[calc(100vh-120px)]">
      {/* Left Pane: Pending Claims List (1/2 width) */}
      <div className="w-full md:w-5/12 bg-surface-container-lowest border border-border-subtle rounded-xl flex flex-col overflow-hidden shadow-sm h-full">
        <div className="p-4 border-b border-border-subtle bg-surface-container-low flex justify-between items-center shrink-0">
          <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
            Pending Reviews
          </h3>
          <span className="bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums">
            {pendingClaims.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
          {loading && pendingClaims.length === 0 ? (
            <div className="flex items-center justify-center py-20 h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
            </div>
          ) : pendingClaims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 h-full">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">
                fact_check
              </span>
              <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
                All Caught Up!
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                There are no pending claims to review.
              </p>
            </div>
          ) : (
            pendingClaims.map((claim) => (
              <div
                key={claim.id}
                onClick={() => setSelectedClaim(claim)}
                className={`p-4 cursor-pointer hover:bg-surface transition-all duration-150 relative ${
                  selectedClaim?.id === claim.id
                    ? "bg-surface-container-low border-l-4 border-l-secondary"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="font-body-sm text-body-sm font-semibold text-primary truncate">
                    {claim.employeeName}
                  </span>
                  <span className="font-label-sm text-label-sm font-bold text-primary tabular-nums shrink-0">
                    ₹{claim.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-on-surface-variant">
                  <span>{claim.department}</span>
                  <span className="tabular-nums">{claim.expenseDate}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Pane: Review Details (1/2 width) */}
      <div className="flex-grow bg-surface-container-lowest border border-border-subtle rounded-xl shadow-sm h-full flex flex-col overflow-hidden md:w-7/12">
        {selectedClaim ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-border-subtle bg-surface-container-low shrink-0">
              <span className="text-xs font-semibold text-on-surface-variant">
                CLAIM ID: #{selectedClaim.id}
              </span>
              <h3 className="font-headline-md text-headline-md text-primary font-bold mt-0.5">
                Review Details
              </h3>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Claim Information Grid */}

              {/* Claim Information Grid */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-surface p-4 rounded-xl border border-border-subtle">
                <div>
                  <span className="block text-xs text-on-surface-variant font-medium">Employee</span>
                  <span className="font-body-sm text-body-sm font-semibold text-primary">
                    {selectedClaim.employeeName}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-on-surface-variant font-medium">Department</span>
                  <span className="font-body-sm text-body-sm font-semibold text-primary">
                    {selectedClaim.department}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-on-surface-variant font-medium">Category</span>
                  <span className="font-body-sm text-body-sm font-semibold text-primary">
                    {formatCategory(selectedClaim.category)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-on-surface-variant font-medium">Date</span>
                  <span className="font-body-sm text-body-sm font-semibold text-primary tabular-nums">
                    {selectedClaim.expenseDate}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs text-on-surface-variant font-medium">Amount</span>
                  <span className="text-xl font-bold text-secondary tabular-nums">
                    ₹{selectedClaim.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {selectedClaim.description && (
                  <div className="col-span-2">
                    <span className="block text-xs text-on-surface-variant font-medium">Description</span>
                    <p className="font-body-sm text-body-sm text-on-surface mt-1 bg-white p-3 rounded border border-border-subtle">
                      {selectedClaim.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Budget Impact Panel */}
              {budgetSummary && (
                <div className="bg-surface p-4 rounded-xl border border-border-subtle space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Budget Context ({getMonthName(selectedClaim.expenseDate)})
                    </span>
                    <span className="text-xs font-label-sm text-label-sm font-semibold text-on-surface-variant">
                      {selectedClaim.department}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded border border-border-subtle">
                      <span className="block text-[10px] text-on-surface-variant uppercase">Monthly Budget</span>
                      <span className="text-xs font-bold text-primary tabular-nums">
                        ₹{budgetSummary.monthlyBudget.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-border-subtle">
                      <span className="block text-[10px] text-on-surface-variant uppercase">Approved</span>
                      <span className="text-xs font-bold text-status-approved tabular-nums">
                        ₹{budgetSummary.totalApprovedExpense.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-border-subtle">
                      <span className="block text-[10px] text-on-surface-variant uppercase">Remaining</span>
                      <span className={`text-xs font-bold tabular-nums ${
                        budgetSummary.remainingBudget.compareTo
                          ? (budgetSummary.remainingBudget < 0 ? "text-status-rejected" : "text-primary")
                          : (budgetSummary.remainingBudget < 0 ? "text-status-rejected" : "text-primary")
                      }`}>
                        ₹{budgetSummary.remainingBudget.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Budget Warning */}
                  {budgetSummary.monthlyBudget === 0 ? (
                    <div className="text-xs text-status-rejected flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      <span>No budget defined for this department and month. Approval will fail.</span>
                    </div>
                  ) : budgetSummary.totalApprovedExpense + selectedClaim.amount > budgetSummary.monthlyBudget ? (
                    <div className="text-xs text-status-rejected flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      <span>Approving this claim will exceed the remaining budget!</span>
                    </div>
                  ) : (
                    <div className="text-xs text-status-approved flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>This claim is within the remaining budget.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Review Input */}
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant">
                  Review Remark
                </label>
                <textarea
                  value={reviewRemark}
                  onChange={(e) => setReviewRemark(e.target.value)}
                  rows="3"
                  placeholder="e.g. Approved within quarterly limit / Missing official receipt..."
                  className="w-full rounded-lg border border-border-subtle bg-surface p-4 font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary text-primary transition-all outline-none resize-none"
                ></textarea>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-5 border-t border-border-subtle bg-surface flex gap-4 shrink-0">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 h-11 bg-status-rejected/10 hover:bg-status-rejected/20 text-status-rejected font-semibold rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">cancel</span>
                <span>Reject</span>
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading || (budgetSummary && budgetSummary.monthlyBudget === 0)}
                className="flex-1 h-11 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-container transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">check_circle</span>
                <span>Approve</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
            <span className="material-symbols-outlined text-[64px] mb-3">rate_review</span>
            <p className="font-body-md text-body-md">Select a pending claim to review details.</p>
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
