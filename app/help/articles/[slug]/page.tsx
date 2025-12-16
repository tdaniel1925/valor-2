"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { MarkdownContent } from "@/components/help/MarkdownContent";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Separator } from "@/components/ui";
import {
  ChevronRight, Home, ThumbsUp, ThumbsDown, Eye, Calendar,
  Tag, Share2, Printer, BookOpen, ArrowLeft
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  summary: string;
  content: string;
  videoUrl?: string;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  publishedAt: string;
  updatedAt: string;
  authorId: string;
  parent?: {
    id: string;
    title: string;
    slug: string;
    category: string;
  };
  children: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: string;
    tags: string[];
  }>;
  relatedArticles: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: string;
    tags: string[];
  }>;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = params.slug as string;
  const [feedback, setFeedback] = useState<"helpful" | "not-helpful" | null>(null);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: HelpArticle }>({
    queryKey: ["help-article", slug],
    queryFn: async () => {
      const res = await fetch(`/api/help/articles/${slug}`);
      if (!res.ok) throw new Error("Article not found");
      return res.json();
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (isHelpful: boolean) => {
      const res = await fetch(`/api/help/articles/${slug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHelpful }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-article", slug] });
    },
  });

  const handleFeedback = (isHelpful: boolean) => {
    const feedbackType = isHelpful ? "helpful" : "not-helpful";
    setFeedback(feedbackType);
    feedbackMutation.mutate(isHelpful);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.summary,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-5xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data?.success) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-5xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Article Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                The help article you're looking for doesn't exist or has been removed.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => router.back()} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Link href="/help">
                  <Button>
                    <Home className="h-4 w-4 mr-2" />
                    Help Center
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const article = data.data;

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <Link href="/help" className="hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1">
                <Home className="h-4 w-4" />
                Help Center
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 dark:text-gray-100">{article.category}</span>
              {article.parent && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <Link
                    href={`/help/articles/${article.parent.slug}`}
                    className="hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    {article.parent.title}
                  </Link>
                </>
              )}
            </nav>

            {/* Article Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="outline">{article.category}</Badge>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Updated {formatDate(article.updatedAt)}
                  </span>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {article.title}
              </h1>

              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {article.summary}
              </p>

              {/* Article Actions */}
              <div className="flex items-center gap-3">
                <Button onClick={handlePrint} variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <Separator className="mb-8" />

            {/* Video (if available) */}
            {article.videoUrl && (
              <div className="mb-8">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <iframe
                    src={article.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Article Content */}
            <Card className="mb-8">
              <CardContent className="p-6 md:p-8">
                <MarkdownContent content={article.content} />
              </CardContent>
            </Card>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap mb-8">
                <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Feedback Section */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Was this article helpful?
                </h3>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => handleFeedback(true)}
                    variant={feedback === "helpful" ? "default" : "outline"}
                    disabled={feedback !== null}
                    className="flex-1 sm:flex-none"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Yes ({article.helpfulCount})
                  </Button>
                  <Button
                    onClick={() => handleFeedback(false)}
                    variant={feedback === "not-helpful" ? "default" : "outline"}
                    disabled={feedback !== null}
                    className="flex-1 sm:flex-none"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    No ({article.notHelpfulCount})
                  </Button>
                </div>
                {feedback && (
                  <p className="mt-4 text-sm text-green-600 dark:text-green-400">
                    Thank you for your feedback!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Child Articles */}
            {article.children.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Related Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {article.children.map((child) => (
                      <Link key={child.id} href={`/help/articles/${child.slug}`}>
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {child.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {child.summary}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 space-y-6">
              {/* Table of Contents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">On This Page</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-2">
                    {article.content
                      .split("\n")
                      .filter((line) => line.startsWith("## "))
                      .map((heading, index) => {
                        const text = heading.replace(/^## /, "");
                        const id = text.toLowerCase().replace(/\s+/g, "-");
                        return (
                          <a
                            key={index}
                            href={`#${id}`}
                            className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {text}
                          </a>
                        );
                      })}
                  </nav>
                </CardContent>
              </Card>

              {/* Related Articles */}
              {article.relatedArticles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Related Articles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {article.relatedArticles.map((related) => (
                        <Link key={related.id} href={`/help/articles/${related.slug}`}>
                          <div className="group cursor-pointer">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                              {related.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {related.summary}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {related.category}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Need More Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/help/contact">
                    <Button variant="outline" className="w-full justify-start">
                      Contact Support
                    </Button>
                  </Link>
                  <Link href="/community">
                    <Button variant="outline" className="w-full justify-start">
                      Community Forum
                    </Button>
                  </Link>
                  <Link href="/help">
                    <Button variant="outline" className="w-full justify-start">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Help Center
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
