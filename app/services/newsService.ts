import { createClient } from "@/lib/supabase/client";

export const newsService = {
  async getNews(publishedOnly = false) {
    const supabase = createClient();
    let query = supabase.from("news_articles").select("*, profiles (full_name)").order("created_at", { ascending: false });

    if (publishedOnly) {
      query = query.eq("published", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getNewsById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase.from("news_articles").select("*, profiles (full_name)").eq("id", id).single();
    if (error) throw error;
    return data;
  },
};
export default newsService;
