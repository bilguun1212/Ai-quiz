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

  
    const existingArticle = await prisma.article.findFirst({
      where: {
        userId: dbUser.id,
        content: text,
      },
      include: { quizzes: true },
    });

    if (existingArticle) {
      return NextResponse.json(existingArticle);
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

  
    const newArticle = await prisma.article.create({
      data: {
        title: title || "Гарчиггүй",
        content: text,
        summary: aiData.summary || "",
        userId: dbUser.id, 
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

    return NextResponse.json(newArticle);

  } catch (error: any) {
    console.error("АЛДАА ГАРЛАА:", error);
    return NextResponse.json({ 
      error: error.message || "Сервер алдаа" 
    }, { status: 500 });
  }
}