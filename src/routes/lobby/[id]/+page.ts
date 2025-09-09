// src/routes/lobby/[id]/+page.ts
import type { Load } from '@sveltejs/kit';

interface LobbyPageParams {
  id: string;
}

export const load: Load = ({ params }: { params: LobbyPageParams }) => {
  return { id: params.id };
};
