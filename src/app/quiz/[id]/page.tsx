"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  RefreshCw,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  articleId: string;
  question: string;
  options: string[];
  answer: number;
  createdAt: string;
  updatedAt: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  quizzes: Question[];
}

interface UserScore {
  id: string;
  userId: string;
  score: number;
  createdAt: string;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: string]: number;
  }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousScores, setPreviousScores] = useState<UserScore[]>([]);
  const [showPreviousScores, setShowPreviousScores] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  // Fetch article and quiz data
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/articles/${params.id}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch article");
        }

        const data = await response.json();

        // Check if article has quizzes
        if (!data.quizzes || data.quizzes.length === 0) {
          // Generate quizzes if none exist
          const quizResponse = await fetch("/api/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: data.content, title: data.title }),
            signal: controller.signal,
          });

          if (!quizResponse.ok) {
            throw new Error("Failed to generate quiz");
          }

          const quizData = await quizResponse.json();

          // Save quizzes to database
          const saveResponse = await fetch(
            `/api/articles/${params.id}/quizzes`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ quizzes: quizData.quizzes }),
              signal: controller.signal,
            }
          );

          if (!saveResponse.ok) {
            throw new Error("Failed to save quiz");
          }

          // Fetch updated article with quizzes
          const updatedResponse = await fetch(`/api/articles/${params.id}`, {
            signal: controller.signal,
          });
          const updatedData = await updatedResponse.json();
          setArticle(updatedData);
        } else {
          setArticle(data);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Ignore abort errors
        }
        console.error("Error:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
    
    return () => controller.abort();
  }, [params.id]);

  // Fetch previous scores
  useEffect(() => {
    const fetchPreviousScores = async () => {
      if (!article) return;

      try {
        const response = await fetch(`/api/scores?articleId=${article.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch previous scores");
        }

        const data = await response.json();
        setPreviousScores(data);
      } catch (error) {
        console.error("Error fetching previous scores:", error);
      }
    };

    fetchPreviousScores();
  }, [article]);

  // Start timer when quiz begins
  useEffect(() => {
    if (article && !showResults) {
      setStartTime(Date.now());
    }
  }, [article, showResults]);

  // Calculate time spent
  const getTimeSpent = () => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000); // Convert to seconds
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Handle next question or finish quiz
  const handleNextQuestion = () => {
    if (!article || !article.quizzes || article.quizzes.length === 0) return;

    if (currentQuestionIndex < article.quizzes.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowResults(true);
      calculateScore();
    }
  };

  // Calculate final score
  const calculateScore = () => {
    if (!article || !article.quizzes || article.quizzes.length === 0) return;

    let correctAnswers = 0;
    article.quizzes.forEach((question) => {
      if (
        selectedAnswers[question.id] === parseInt(question.answer.toString())
      ) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round(
      (correctAnswers / article.quizzes.length) * 100
    );
    setScore(finalScore);
  };

  // Save score to database
  const handleSubmitScore = async () => {
    if (
      !article ||
      !article.quizzes ||
      article.quizzes.length === 0 ||
      isSubmitting
    )
      return;

    setIsSubmitting(true);
    try {
      const timeSpent = getTimeSpent();
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: article.id,
          score: score,
          timeSpent: timeSpent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save score");
      }

      // Fetch updated scores
      const scoresResponse = await fetch(`/api/scores?articleId=${article.id}`);
      if (scoresResponse.ok) {
        const data = await scoresResponse.json();
        setPreviousScores(data);
      }

      toast.success("Score saved successfully!");
      setShowPreviousScores(true);
    } catch (error) {
      console.error("Error saving score:", error);
      toast.error("Failed to save score. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restart quiz
  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setScore(0);
    setShowResults(false);
    setShowPreviousScores(false);
  };

  // Go back to home
  const handleGoHome = () => {
    router.push("/");
  };

  // Toggle previous scores view
  const togglePreviousScores = () => {
    setShowPreviousScores(!showPreviousScores);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading quiz...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !article) {
    return (
      <div className="flex justify-center items-center p-8 min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error || "Article not found"}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleGoHome} className="w-full">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check if quiz exists
  if (!article.quizzes || article.quizzes.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">No Quiz Available</CardTitle>
            <CardDescription>
              This article doesn't have a quiz yet.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleGoHome} className="w-full">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestion = article.quizzes[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / article.quizzes.length) * 100;
  const isLastQuestion = currentQuestionIndex === article.quizzes.length - 1;

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleGoHome}
            className="flex gap-2 items-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{article.title}</CardTitle>
            <CardDescription>
              {showResults
                ? "Quiz completed!"
                : `Question ${currentQuestionIndex + 1} of ${
                    article.quizzes.length
                  }`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={progress} className="h-2" />

            {!showResults ? (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {currentQuestion.question}
                  </h3>
                  <RadioGroup
                    value={
                      selectedAnswers[currentQuestion.id]?.toString() || ""
                    }
                    onValueChange={(value) =>
                      handleAnswerSelect(currentQuestion.id, parseInt(value))
                    }
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={index.toString()}
                          id={`option-${index}`}
                        />
                        <Label htmlFor={`option-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers[currentQuestion.id] === undefined}
                  >
                    {isLastQuestion ? "Finish Quiz" : "Next Question"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="mb-2 text-2xl font-bold">Quiz Completed!</h3>
                  <p className="text-lg">Your score: {score}%</p>
                </div>

                {!showPreviousScores ? (
                  <>
                    <div className="space-y-4">
                      {article.quizzes.map((question, index) => {
                        const userAnswer = selectedAnswers[question.id];
                        const correctAnswer = parseInt(
                          question.answer.toString()
                        );
                        const isCorrect = userAnswer === correctAnswer;

                        return (
                          <div key={question.id} className="space-y-2">
                            <div className="flex gap-2 items-start">
                              {isCorrect ? (
                                <CheckCircle2 className="mt-1 w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="mt-1 w-5 h-5 text-red-500" />
                              )}
                              <div>
                                <p className="font-medium">
                                  Question {index + 1}: {question.question}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Your answer: {question.options[userAnswer]}
                                </p>
                                {!isCorrect && (
                                  <p className="text-sm text-green-600">
                                    Correct answer:{" "}
                                    {question.options[correctAnswer]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 justify-end">
                      <Button variant="outline" onClick={handleRestartQuiz}>
                        <RefreshCw className="mr-2 w-4 h-4" />
                        Restart Quiz
                      </Button>
                      <Button
                        onClick={handleSubmitScore}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Save Score"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold">
                        Your Quiz History
                      </h3>
                      <Button variant="outline" onClick={togglePreviousScores}>
                        Back to Results
                      </Button>
                    </div>

                    {previousScores.length > 0 ? (
                      <div className="space-y-4">
                        {previousScores.map((score, index) => (
                          <div
                            key={score.id}
                            className="flex justify-between items-center p-4 rounded-lg border"
                          >
                            <div>
                              <p className="font-medium">
                                Attempt {previousScores.length - index}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(score.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">
                                {score.score}%
                              </p>
                              {index > 0 && (
                                <p
                                  className={`text-sm ${
                                    score.score >
                                    previousScores[index - 1].score
                                      ? "text-green-500"
                                      : score.score <
                                        previousScores[index - 1].score
                                      ? "text-red-500"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {score.score > previousScores[index - 1].score
                                    ? "↑ Improved"
                                    : score.score <
                                      previousScores[index - 1].score
                                    ? "↓ Decreased"
                                    : "→ Same"}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p>No previous scores found.</p>
                      </div>
                    )}

                    <div className="flex gap-4 justify-end mt-6">
                      <Button variant="outline" onClick={handleRestartQuiz}>
                        <RefreshCw className="mr-2 w-4 h-4" />
                        Take Quiz Again
                      </Button>
                      <Button onClick={handleGoHome}>
                        <Home className="mr-2 w-4 h-4" />
                        Go to Home
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
