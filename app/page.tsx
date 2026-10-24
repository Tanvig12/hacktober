import { CaptureFlow } from "@/components/CaptureFlow";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isDemoModeEnabled } from "@/lib/env";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="max-w-2xl text-xl font-semibold sm:text-2xl">
          Take a photo of something you&rsquo;re about to throw away.
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          You get a safety check, three ways to give it a second life, and where
          each material should go.
        </p>
        <CaptureFlow demoEnabled={isDemoModeEnabled()} />
      </main>
      <SiteFooter />
    </>
  );
}
