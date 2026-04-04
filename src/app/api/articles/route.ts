import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const { title, content, summary, quizzes } = await req.json();

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    // Check for existing article with same content to prevent duplicates
    const existingArticle = await prisma.article.findFirst({
      where: {
        userId: user.id,
        content: content,
      },
      include: {
        quizzes: true,
      },
    });

    if (existingArticle) {
      return NextResponse.json(existingArticle);
    }

    const article = await prisma.article.create({
      data: {
        title,
        content,
        summary,
        userId: user.id,
        quizzes: {
          create: quizzes?.map((q: any) => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
          })) || [],
        },
      },
      include: {
        quizzes: true,
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const articles = await prisma.article.findMany({
      where: { user: { clerkId: clerkId } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}