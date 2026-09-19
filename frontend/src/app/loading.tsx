export default function LoadingPage() {
  return (
    <main className="routeState" aria-busy="true" aria-label="Loading AskLearnly">
      <span className="routeStateMark routeStateMarkLoading">A</span>
      <p className="routeStateEyebrow">Opening your learning workspace</p>
      <h1>Gathering your library…</h1>
    </main>
  );
}
