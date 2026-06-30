import apiClient from "../api/apiClient";

export class ClaimService {
  static async submitClaim(claimData) {
    const res = await apiClient.post("/claims", claimData);
    return res.data;
  }

  static async getClaims(filters) {
    const res = await apiClient.get("/claims", { params: filters });
    return res.data;
  }

  static async approveClaim(id, reviewRemark) {
    const res = await apiClient.put(`/claims/${id}/approve`, { reviewRemark });
    return res.data;
  }

  static async rejectClaim(id, reviewRemark) {
    const res = await apiClient.put(`/claims/${id}/reject`, { reviewRemark });
    return res.data;
  }
}
