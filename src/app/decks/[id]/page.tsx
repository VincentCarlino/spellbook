import { notFound } from "next/navigation";

import { getDeck } from "~/server/actions/decks";
import { DeckEditor } from "./_components/DeckEditor";

export default async function DeckEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deck = await getDeck(id);

  if (!deck) notFound();

  return <DeckEditor deck={deck} />;
}
