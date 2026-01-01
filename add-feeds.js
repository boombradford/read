// Paste this into your browser console on localhost:3000 to add all feeds

const feeds = [
  { url: 'https://www.theverge.com/rss/index.xml', title: 'The Verge' },
  { url: 'https://news.ycombinator.com/rss', title: 'Hacker News' },
  { url: 'https://www.technologyreview.com/feed.rss', title: 'MIT Technology Review' },
  { url: 'https://feeds.venturebeat.com/feed', title: 'VentureBeat' },
  { url: 'http://arxiv.org/rss/cs.AI', title: 'arXiv AI' },
  { url: 'https://openai.com/feed.xml', title: 'OpenAI Blog' },
  { url: 'https://huggingface.co/blog/feed.xml', title: 'Hugging Face Blog' },
  { url: 'https://www.deepmind.google/blog/feed.xml', title: 'DeepMind Blog' }
];

async function addFeeds() {
  console.log('Starting to add feeds...');

  for (const feed of feeds) {
    try {
      const res = await fetch(`/api/feed?url=${encodeURIComponent(feed.url)}`);
      if (res.ok) {
        const data = await res.json();

        // Get current storage
        const storage = localStorage.getItem('rss-feed-storage');
        const state = storage ? JSON.parse(storage) : { state: { subscriptions: [] } };

        // Check if feed already exists
        const exists = state.state.subscriptions.some(s => s.url === feed.url);

        if (!exists) {
          state.state.subscriptions.push({
            id: crypto.randomUUID(),
            url: feed.url,
            title: data.title || feed.title
          });

          localStorage.setItem('rss-feed-storage', JSON.stringify(state));
          console.log(`✓ Added: ${data.title || feed.title}`);
        } else {
          console.log(`⊘ Already exists: ${feed.title}`);
        }
      } else {
        console.log(`✗ Failed to validate: ${feed.title}`);
      }
    } catch (error) {
      console.log(`✗ Error adding ${feed.title}:`, error);
    }
  }

  console.log('Done! Refresh the page to see your new feeds.');
  setTimeout(() => window.location.reload(), 1000);
}

addFeeds();
