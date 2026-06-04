"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { quizService } from "@/app/services/quizService";
import { QuizView } from "@/components/user/quiz-view";
import { Quiz, QuizQuestion, Profile } from "@/app/types";
import { Loader2 } from "lucide-react";

export function QuizPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setProfile(user);

    const loadQuizData = async () => {
      if (!id) return;
      try {
        // Check if already completed
        const completions = await quizService.getCompletions(user.id);
        const alreadyCompleted = completions?.some((c: any) => c.quiz_id === id);
        if (alreadyCompleted) {
          router.push("/user/news");
          return;
        }

        const quizData = await quizService.getQuizById(id);
        if (!quizData) {
          router.push("/user/news");
          return;
        }

        setQuiz(quizData as any);
        setQuestions((quizData.quiz_questions || []) as any);
      } catch (err) {
        console.error("Error loading quiz:", err);
        router.push("/user/news");
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [user, authLoading, id, router]);

  const handleSubmit = async (score: number, pointsEarned: number): Promise<void> => {
    if (!user || !quiz) return;
    await quizService.submitQuizCompletion(user.id, quiz.id, score, pointsEarned);
  };

  if (authLoading || loading || !profile || !quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span>Cargando Quiz...</span>
        </div>
      </div>
    );
  }

  return (
    <QuizView
      profile={profile}
      quiz={quiz}
      questions={questions}
      onSubmit={handleSubmit}
    />
  );
}
export default QuizPage;
