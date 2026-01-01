import { FeedManager } from "@/components/feed-manager";
import { ArticleGrid } from "@/components/article-grid";
import { BriefingView } from "@/components/briefing-view";

export default function Home() {
  return (
    <main className="min-h-screen pb-20 pt-8">
      <div className="max-w-[1600px] mx-auto">
        <BriefingView />
        <ArticleGrid />
        <FeedManager />
      </div>
    </main>
  );
}

