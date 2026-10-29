import { Suspense } from "react";
import DocsView from "./DocsView";

async function DocsContent({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  return <DocsView collectionId={collectionId} />;
}

export default function MockDocsPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <DocsContent params={params} />
    </Suspense>
  );
}
