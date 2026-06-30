import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function SubmitClaimPage() {
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    employeeName: "",
    department: "",
    category: "",
    amount: "",
    expenseDate: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const categories = [
    { value: "TRAVEL", label: "Travel" },
    { value: "FOOD", label: "Food" },
    { value: "ACCOMMODATION", label: "Accommodation" },
    { value: "OFFICE_SUPPLIES", label: "Office Supplies" },
    { value: "EQUIPMENT", label: "Equipment" },
    { value: "OTHER", label: "Other" },
  ];

  // Fetch departments on load
  useEffect(() => {
    apiClient
      .get("/departments")
      .then((res) => {
        setDepartments(res.data);
        if (res.data.length > 0) {
          setFormData((prev) => ({ ...prev, department: res.data[0] }));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch departments", err);
      });
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

  // Today's date in YYYY-MM-DD for the max attribute
  const todayStr = new Date().toISOString().split("T")[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      await apiClient.post("/claims", payload);
      setSuccessMsg("Expense claim submitted successfully!");
      setFormData({
        employeeName: "",
        department: departments[0] || "",
        category: "",
        amount: "",
        expenseDate: "",
        description: "",
      });
    } catch (err) {
      const serverMsg = err.response?.data?.message ?? "Failed to submit claim. Please try again.";
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] w-full flex flex-col lg:flex-row gap-gutter-grid mt-6 mx-auto">
      {/* Left Panel: Instructions (1/3 width) */}
      <aside className="w-full lg:w-1/3 flex flex-col gap-stack-md pt-2">
        <div className="bg-surface-container border border-border-subtle rounded-xl p-6 ambient-shadow">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-secondary text-[24px]">info</span>
            <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Submission Rules</h3>
          </div>
          <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant list-disc pl-5">
            <li>
              <strong>No Future Claims</strong>: The expense date must be today or in the past.
            </li>
            <li>
              <strong>Budget Matching</strong>: Claims are checked against the department's monthly budget during approval.
            </li>
            <li>
              <strong>Exceeding Limits</strong>: If approving a claim exceeds the monthly budget, it will remain pending.
            </li>
            <li>
              <strong>Description</strong>: Please provide clear descriptions for faster processing.
            </li>
          </ul>
        </div>
      </aside>

      {/* Right Panel: Form (2/3 width) */}
      <div className="flex-grow bg-surface-container-lowest border border-border-subtle rounded-xl p-8 shadow-sm lg:w-2/3">
        <h3 className="font-headline-md text-headline-md text-primary font-bold mb-6">New Expense Claim</h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee Name */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
              Employee Name *
            </label>
            <input
              type="text"
              name="employeeName"
              value={formData.employeeName}
              onChange={handleChange}
              required
              placeholder="e.g. John Doe"
              className="w-full h-11 rounded-lg border border-border-subtle bg-surface px-4 font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary text-primary transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Department */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full h-11 rounded-lg border border-border-subtle bg-surface px-3 font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary text-primary transition-all outline-none"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full h-11 rounded-lg border border-border-subtle bg-surface px-3 font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary text-primary transition-all outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Amount */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
                Amount (INR) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                placeholder="0.00"
                className="w-full h-11 rounded-lg border border-border-subtle bg-surface px-4 font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary text-primary transition-all outline-none"
              />
            </div>

            {/* Expense Date */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
                Expense Date *
              </label>
              <input
                type="date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={handleChange}
                required
                max={todayStr}
                className="w-full h-11 rounded-lg border border-border-subtle bg-surface px-4 font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary text-primary transition-all outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Provide a description of the expense..."
              className="w-full rounded-lg border border-border-subtle bg-surface p-4 font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary text-primary transition-all outline-none resize-none"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-container transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  <span>Submit Claim</span>
                </>
              )}
            </button>
          </div>
        </form>
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
