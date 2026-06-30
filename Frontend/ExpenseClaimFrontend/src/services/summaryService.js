import apiClient from "../api/apiClient";

export class SummaryService {
  static async getSummary(params) {
    const res = await apiClient.get("/summary", { params });
    return res.data;
  }

  static async getDepartments() {
    const res = await apiClient.get("/departments");
    return res.data;
  }
}
