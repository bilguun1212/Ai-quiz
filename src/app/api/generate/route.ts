import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function POST(req: Request) {
  try {
   
    const { userId: clerkId } = auth(); 
    const user = await currentUser();

    if (!clerkId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, title } = body;

    
    const dbUser = await prisma.user.upsert({
      where: { clerkId: clerkId },
      update: { name: user.firstName || "User" },
      create: { 
        clerkId: clerkId, 
        email: user.emailAddresses[0].emailAddress,
        name: user.firstName || "User"
      },
    });

  
    // 2. Өмнө нь үүссэн эсэхийг шалгах (Дубликат сэргийлэл)
    // Now using upsert for atomic operation - prevents race conditions
    const article = await prisma.article.upsert({
      where: {
        userId_content: {
          userId: dbUser.id,
          content: text,
        },
      },
      update: {
        // If exists, just return it (no update needed)
      },
      create: {
        title: title || "Гарчиггүй",
        content: text,
        summary: "", // Will be updated after AI call
        userId: dbUser.id,
      },
      include: { quizzes: true },
    });

    // If article already has quizzes, return it
    if (article.quizzes && article.quizzes.length > 0) {
      return NextResponse.json(article);
    }

   
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "Чи бол боловсролын туслах. Хариуг ЗААВАЛ JSON форматаар өг: {'summary': 'текст', 'quizzes': [{'question': 'string', 'options': ['array'], 'answer': 'string'}]}. Түлхүүр үг нь ЗААВАЛ 'quizzes' байх ёстой." 
        },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }, 
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("AI хариу өгсөнгүй");
    
    const aiData = JSON.parse(content);
 
    const quizArray = aiData.quizzes || aiData.quiz || [];

    // 4. Update article with AI-generated content and create quizzes
    const updatedArticle = await prisma.article.update({
      where: { id: article.id },
      data: {
        summary: aiData.summary || "",
        quizzes: {
          create: quizArray.map((q: any) => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
          })),
        },
      },
      include: { quizzes: true }
    });

    return NextResponse.json(updatedArticle);

  } catch (error: any) {
    console.error("АЛДАА ГАРЛАА:", error);
    return NextResponse.json({ 
      error: error.message || "Сервер алдаа" 
    }, { status: 500 });
  }
}