"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Sparkles, BookOpen, Save } from "lucide-react";
import { toast } from "sonner";

interface ArticleFormProps {
  title: string;
  content: string;
  summary: string | null;
  loading: boolean;
  isSaving?: boolean;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onGenerateSummary: (e: React.FormEvent) => void;
  onSaveArticle: () => void;
  onGenerateQuiz: () => void;
}

export default function ArticleForm({
  title,
  content,
  summary,
  loading,
  isSaving = false,
  onTitleChange,
  onContentChange,
  onGenerateSummary,
  onSaveArticle,
  onGenerateQuiz,
}: ArticleFormProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleGenerateSummary = (e: React.FormEvent) => {
    if (!isSignedIn) {
      e.preventDefault();
      toast.error("Please sign in to generate summaries");
      router.push("/login");
      return;
    }
    onGenerateSummary(e);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2 items-center mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <CardTitle className="text-3xl">Article Quiz Generator</CardTitle>
        </div>
        <CardDescription>
          Paste your article content below to generate a summary and quiz
          questions. Your articles will be saved in the sidebar for future
          reference.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleGenerateSummary}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex gap-2 items-center">
              <FileText className="w-4 h-4" />
              Article Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter a title for your article..."
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content" className="flex gap-2 items-center">
              <FileText className="w-4 h-4" />
              Article Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Paste your article content here..."
              className="min-h-[200px]"
              required
            />
          </div>
          {summary && (
            <div className="space-y-2">
              <Label className="flex gap-2 items-center">
                <BookOpen className="w-4 h-4" />
                Summary
              </Label>
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <p className="text-sm">{summary}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={loading || !content}
            className="flex-1"
          >
            {loading ? "Generating..." : "Generate Summary"}
          </Button>
          {summary && (
            <>
              <Button
                type="button"
                onClick={onSaveArticle}
                disabled={loading || !title || isSaving}
                variant="outline"
                className="flex gap-2 items-center"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Article"}
              </Button>
              <Button
                type="button"
                onClick={onGenerateQuiz}
                disabled={loading}
                className="flex-1"
              >
                Generate Quiz
              </Button>
            </>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
