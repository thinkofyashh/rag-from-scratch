type AskPageProps = {
  searchParams: Promise<{ documentId?: string }>;
};

export default async function AskPage({ searchParams }: AskPageProps) {
  const { documentId } = await searchParams;

  return (
    <main>
      <h1>AskLearnly</h1>
      <p>Workspace foundation ready.</p>
      {documentId ? <p>Selected Learnly document: {documentId}</p> : null}
    </main>
  );
}
