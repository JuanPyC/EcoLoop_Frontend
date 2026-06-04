import { createClient } from "@/lib/supabase/client";

export const quizService = {
  async getQuizzes(activeOnly = false) {
    const supabase = createClient();
    let query = supabase.from("quizzes").select("*, quiz_questions (*)").order("created_at");

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getQuizById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("quizzes")
      .select("*, quiz_questions (*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async submitQuizCompletion(userId: string, quizId: string, score: number, pointsEarned: number) {
    const supabase = createClient();
    const { data, error } = await supabase.from("quiz_completions").insert({
      user_id: userId,
      quiz_id: quizId,
      score,
      points_earned: pointsEarned,
    });

    if (error) throw error;
    
    // Also need to add eco points to the user's profile
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("eco_points")
      .eq("id", userId)
      .single();

    if (!profileError && userProfile) {
      const newPoints = (userProfile.eco_points || 0) + pointsEarned;
      await supabase.from("profiles").update({ eco_points: newPoints }).eq("id", userId);
    }

    return data;
  },

  async getCompletions(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("quiz_completions")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  },
};
export default quizService;
