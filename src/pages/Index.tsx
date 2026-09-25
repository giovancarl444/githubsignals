import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { Github, Instagram, Mail, Sparkles, ArrowRight } from "lucide-react";
import { InstagramSlider } from "@/components/InstagramSlider";

const Index = () => {
  const [email, setEmail] = useState("");
  const [showFeed, setShowFeed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setSubmitting(true);
    // Placeholder — wire to backend later
    setTimeout(() => {
      toast.success("You're on the list. Tomorrow's drop incoming.");
      setEmail("");
      setSubmitting(false);
    }, 600);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Decorative grid */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" aria-hidden />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-sunset shadow-glow">
            <Github className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            GitHub <span className="text-gradient-brand">Signals</span>
          </span>
        </div>
        <a
          href="https://www.instagram.com/githubsignals"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur transition hover:text-foreground"
        >
          <Instagram className="h-4 w-4" />
          <span className="hidden sm:inline">@githubsignals</span>
        </a>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-16 text-center sm:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Spotted on Hacker News · 8.9K followers</span>
        </div>

        <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          The daily scout for{" "}
          <span className="text-gradient-brand">open-source</span> projects worth your stars.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
          One repo a day. Plain-English pitch. Straight from the front page of Hacker News
          to your inbox — before everyone else clones it.
        </p>

        {/* Newsletter */}
        <form
          onSubmit={handleSubscribe}
          className="mx-auto mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dev.inbox"
              aria-label="Email address"
              className="h-12 border-border bg-card/80 pl-10 text-base backdrop-blur focus-visible:ring-primary"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="h-12 bg-gradient-sunset px-6 text-base font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
          >
            {submitting ? "Joining…" : "Get the drops"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Free forever. One email a day. Unsubscribe with one click.
        </p>

        {/* Toggle Instagram feed */}
        <div className="mt-12">
          <button
            onClick={() => setShowFeed((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition hover:border-primary/50 hover:bg-card"
          >
            <Instagram className="h-4 w-4 text-primary" />
            {showFeed ? "Hide Instagram feed" : "Show Instagram feed"}
          </button>
        </div>
      </section>

      {/* Instagram feed (placeholder) */}
      {showFeed && <InstagramSlider />}

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} GitHub Signals</p>
          <p>Built for developers. Powered by curiosity.</p>
        </div>
      </footer>
    </main>
  );
};

export default Index;

