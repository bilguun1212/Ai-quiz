"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ArticleForm from "@/components/ArticleForm";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
}

export default function Home() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [articleLoading, setArticleLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Prevent double saves
  const isSavingRef = useRef(false); // Ref to prevent race conditions

  const [summary, setSummary] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchArticles = async () => {
      try {
        const response = await fetch("/api/articles", {
          signal: controller.signal,
        });
        const data = await response.json();
        setArticles(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Ignore abort errors
        }
        console.error("Error fetching articles:", error);
      } finally {
        setArticleLoading(false);
      }
    };

    fetchArticles();
    
    return () => controller.abort();
  }, []);

  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Текстээ оруулна уу");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       
        body: JSON.stringify({ 
          text: content, 
          title: title || "Гарчиггүй" 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSummary(data.summary);
        toast.success("Summary амжилттай үүслээ!");
      } else {
      
        toast.error(data.error || "Алдаа гарлаа");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async () => {
    // Prevent double saves
    if (isSavingRef.current || loading) {
      toast.error("Save in progress, please wait...");
      return;
    }

    if (!summary || !title) {
      toast.error("Гарчиг оруулаад, эхлээд Summary үүсгэнэ үү");
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setLoading(true);
    
    try {
      const saveResponse = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content, 
          summary,
          quizzes: [],
        }),
      });

      if (saveResponse.ok) {
        toast.success("Амжилттай хадгалагдлаа!");
       
        const response = await fetch("/api/articles");
        const data = await response.json();
        setArticles(data);
        
        setTitle("");
        setContent("");
        setSummary(null);
      } else {
        const error = await saveResponse.json();
        toast.error(error.error || "Хадгалахад алдаа гарлаа");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Хадгалахад алдаа гарлаа");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!content.trim()) {
      toast.error("Текст хоосон байна");
      return;
    }
    
    setLoading(true);
    try {
     
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || content.substring(0, 40) + "...",
          text: content, 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Тест амжилттай үүслээ, шилжиж байна...");
        router.push(`/quiz/${result.id}`);
      } else {
        const data = await response.json();
        toast.error(data.error || "Тест үүсгэхэд алдаа гарлаа");
      }
    } catch (error) {
      toast.error("Хүсэлт явуулахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar articles={articles} loading={articleLoading} />
      <main className="flex-1 p-8 min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl">
          <ArticleForm
            title={title}
            content={content}
            summary={summary}
            loading={loading}
            isSaving={isSaving}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onGenerateSummary={handleGenerateSummary}
            onSaveArticle={handleSaveArticle}
            onGenerateQuiz={handleGenerateQuiz}
          />
        </div>
      </main>
    </div>
  );
}