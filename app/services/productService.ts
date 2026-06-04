import { createClient } from "@/lib/supabase/client";

export const productService = {
  async getProducts(availableOnly = false) {
    const supabase = createClient();
    let query = supabase.from("products").select("*").order("name");

    if (availableOnly) {
      query = query.eq("is_available", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getProductById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },

  async redeemProduct(userId: string, productId: string, pointsSpent: number, quantity = 1) {
    const supabase = createClient();
    
    // Create redemption record
    const { data, error } = await supabase.from("redemptions").insert({
      user_id: userId,
      product_id: productId,
      points_spent: pointsSpent,
      quantity,
      status: "pending",
    });

    if (error) throw error;
    return data;
  },

  async getRedemptions(userId?: string) {
    const supabase = createClient();
    let query = supabase
      .from("redemptions")
      .select("*, profiles (*), products (*)")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};
export default productService;
