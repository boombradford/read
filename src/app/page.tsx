import { FeedManager } from "@/components/feed-manager";
import { ArticleGrid } from "@/components/article-grid";
import { BriefingView } from "@/components/briefing-view";
import { ClientProvider } from "@/components/providers";

export default function Home() {
  return (
    <main className="min-h-screen pb-20 pt-6 md:pt-8 px-3 md:px-4">
      <ClientProvider>
        <div className="max-w-[1600px] mx-auto w-full">
          <BriefingView />
          <ArticleGrid />
          <FeedManager />
        </div>
      </ClientProvider>
    </main>
  );
}

