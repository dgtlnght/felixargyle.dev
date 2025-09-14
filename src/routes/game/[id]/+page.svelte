<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { getFirestore, doc, onSnapshot, updateDoc } from 'firebase/firestore';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  import { Chess } from 'chess.js';
  import ChessBoard from 'chessboardjs';
  import 'chessboardjs/dist/chessboard-1.0.0.min.css';

  const db = getFirestore();
  const auth = getAuth();

  let gameId: string = '';
  let userId: string | null = null;
  let playerColor: 'w' | 'b' | null = null;
  let players: string[] = [];
  let game: any;
  let board: any;

  let unsubscribe: (() => void) | null = null;

  // Load gameId from URL and auth state
  onMount(() => {
    const unsubPage = page.subscribe(($page) => {
      if ($page.params.id) gameId = $page.params.id;
    });

    onAuthStateChanged(auth, (user) => {
      if (user) userId = user.uid;
    });

    const gameRef = doc(db, 'games', gameId);

    unsubscribe = onSnapshot(gameRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      // Assign players and determine color
      players = data.players || [];
      if (userId) {
        playerColor = players[0] === userId ? 'w' : players[1] === userId ? 'b' : null;
      }

      // Initialize chess.js game
      if (!game) game = new Chess();
      if (data.fen) game.load(data.fen);

      // Initialize chessboard.js board
      if (!board) {
        board = ChessBoard('board1', {
          draggable: true,
          position: game.fen(),
          orientation: playerColor === 'b' ? 'black' : 'white',
          onDragStart: (source, piece) => {
            // Only allow moving own pieces and when it's their turn
            if (!playerColor) return false;
            const pieceColor = piece[0]; // 'wP', 'bK', etc.
            const turn = game.turn(); // 'w' or 'b'
            return pieceColor === playerColor && turn === playerColor;
          },
          onDrop: (source, target) => {
            const move = game.move({ from: source, to: target, promotion: 'q' });
            if (move === null) return 'snapback';

            // Update board and save to Firebase
            board.position(game.fen());
            updateDoc(gameRef, { fen: game.fen(), currentTurn: game.turn() }).catch(console.error);
          },
          onSnapEnd: () => {
            board.position(game.fen());
          }
        });
      } else {
        board.position(game.fen());
      }
    });

    return () => unsubPage();
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });
</script>

<main class="p-4">
  <h1 class="text-2xl font-bold mb-4">Chess Game</h1>

  {#if players.length < 2}
    <p>Waiting for opponent...</p>
  {:else}
    <p>Your color: {playerColor}</p>
    <p>Current turn: {game?.turn()}</p>
  {/if}

  <div id="board1" class="mx-auto mt-4"></div>
</main>

<style>
  #board1 {
    width: 400px;
    margin: auto;
  }
</style>
