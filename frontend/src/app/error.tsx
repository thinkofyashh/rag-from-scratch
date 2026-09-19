"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <h1>AskLearnly could not load</h1>
      <p>The workspace hit an unexpected problem.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
