import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="routeState">
      <span className="routeStateMark">404</span>
      <p className="routeStateEyebrow">Nothing on this page</p>
      <h1>This path is not in your notes.</h1>
      <p>Return to the workspace and keep exploring your Learnly library.</p>
      <Link className="routeStateAction" href="/ask">
        Return to AskLearnly
      </Link>
    </main>
  );
}
