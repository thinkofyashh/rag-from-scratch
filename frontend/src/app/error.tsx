"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="routeState">
      <span className="routeStateMark">!</span>
      <p className="routeStateEyebrow">Workspace interrupted</p>
      <h1>AskLearnly could not load.</h1>
      <p>The workspace hit an unexpected problem. Your Learnly notes were not changed.</p>
      <button className="routeStateAction" type="button" onClick={reset}>
        Reload workspace
      </button>
    </main>
  );
}
