import { GameDetail } from "~/components/game-detail";

export default async function GamePage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}) {
  const { id } = await params;
  return <GameDetail gameId={id} />;
}
