import { Instagram } from "lucide-react";

// Placeholder posts — will be replaced by live Instagram Graph API data
const placeholderPosts = [
  { id: "1", title: "TinyTTS", caption: "The World's Smallest AI Voice Model — 1.6M params, 3.4MB", gradient: "from-orange-500/20 to-pink-500/20" },
  { id: "2", title: "uscode/", caption: "Track Changes in US Federal Law Using Git", gradient: "from-blue-500/20 to-cyan-500/20" },
  { id: "3", title: "badclaude", caption: "Whip Claude into shape when it goes too slow", gradient: "from-purple-500/20 to-pink-500/20" },
  { id: "4", title: "honker", caption: "SQLite extension: NOTIFY/LISTEN semantics", gradient: "from-emerald-500/20 to-teal-500/20" },
  { id: "5", title: "pvlib", caption: "Photovoltaic energy systems toolbox", gradient: "from-yellow-500/20 to-orange-500/20" },
  { id: "6", title: "warp", caption: "The agentic dev environment, born of the terminal", gradient: "from-indigo-500/20 to-blue-500/20" },
  { id: "7", title: "Ruflo", caption: "Multi-agent AI orchestration for Claude Code", gradient: "from-red-500/20 to-pink-500/20" },
  { id: "8", title: "leaf", caption: "Terminal Markdown previewer — GUI-like experience", gradient: "from-green-500/20 to-emerald-500/20" },
];

// Duplicate the array so the marquee loops seamlessly
const loopPosts = [...placeholderPosts, ...placeholderPosts];

export const InstagramSlider = () => {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
      <div className="mb-8 flex items-end justify-between gap-4 px-1">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live feed
          </div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Latest <span className="text-gradient-brand">drops</span>
          </h2>
        </div>
        <a
          href="https://www.instagram.com/githubsignals"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
        >
          <Instagram className="h-4 w-4" />
          @githubsignals →
        </a>
      </div>

      {/* Marquee */}
      <div
        className="group relative overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div className="flex w-max animate-marquee gap-5 group-hover:[animation-play-state:paused]">
          {loopPosts.map((post, idx) => (
            <article
              key={`${post.id}-${idx}`}
              className="group/card relative h-80 w-64 flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-5">
                <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
                  <Instagram className="h-3 w-3" />
                  Drop
                </div>
                <h3 className="text-lg font-semibold leading-tight">{post.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Showing sample drops · Connect Instagram Graph API to stream live posts
      </p>
    </section>
  );
};

