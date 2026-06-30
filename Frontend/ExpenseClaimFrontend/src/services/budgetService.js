import apiClient from "../api/apiClient";

export class BudgetService {
  static async getBudgets() {
    const res = await apiClient.get("/budgets");
    return res.data;
  }

  static async addBudget(budgetData) {
    const res = await apiClient.post("/budgets", budgetData);
    return res.data;
  }

  static async updateBudget(id, budgetAmount) {
    const res = await apiClient.put(`/budgets/${id}`, { budgetAmount });
    return res.data;
  }
}
