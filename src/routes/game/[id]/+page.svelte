<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { page } from '$app/stores';
  import { getFirestore, doc, onSnapshot, updateDoc, DocumentSnapshot } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import { app } from '$lib/firebase';
  import { Chess } from 'chess.js';

  interface Game {
    id: string;
    board: string;          // FEN string
    moves: { from: string; to: string }[];
    turn: 'w' | 'b';
    updatedAt: Date;
  }

  const db = getFirestore(app);
  const auth = getAuth(app);

  let gameId: string | undefined;
  let gameDocRef: any;
  let game: Game | null = null;
  let loading = true;
  let chess: Chess;
  let currentUser: any = null;

  onMount(async () => {
    currentUser = auth.currentUser;
    if (!currentUser) return;

    const $p = get(page);
    gameId = $p.params.id;
    if (!gameId) return;

    gameDocRef = doc(db, 'games', gameId);

    onSnapshot(gameDocRef, (snap: DocumentSnapshot<Game>) => {
      if (snap.exists()) {
        game = snap.data() as Game;
        chess = new Chess(game.board);
        loading = false;
      } else {
        console.error('Game does not exist');
      }
    });
  });

  async function movePiece(from: string, to: string) {
    if (!game || !chess) return;
    const move = chess.move({ from, to, promotion: 'q' });
    if (move) {
      game.board = chess.fen();
      game.moves.push({ from, to });
      game.turn = chess.turn() as 'w' | 'b';
      await updateDoc(gameDocRef, {
        board: game.board,
        moves: game.moves,
        turn: game.turn,
        updatedAt: new Date(),
      });
    }
  }
</script>

{#if loading}
  <p>Loading game...</p>
{:else}
  <div class="chessboard-wrapper">
    <!-- Minimal chessboard rendering -->
    <p>Chessboard will render here using PNGs from /pieces/</p>
    <!-- Implement drag-and-drop or click-to-move in ChessBoard.svelte -->
  </div>
{/if}

<style>
  .chessboard-wrapper { display:flex; flex-direction:column; align-items:center; padding:1rem; }
</style>
