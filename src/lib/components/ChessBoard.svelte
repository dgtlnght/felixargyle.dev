<script lang="ts">
  import { onMount } from 'svelte';
  import { getFirestore, doc, onSnapshot, updateDoc, DocumentSnapshot } from 'firebase/firestore';
  import { app } from '$lib/firebase';
  import { Chess } from 'chess.js';

  type Square =
    | 'a1'|'a2'|'a3'|'a4'|'a5'|'a6'|'a7'|'a8'
    | 'b1'|'b2'|'b3'|'b4'|'b5'|'b6'|'b7'|'b8'
    | 'c1'|'c2'|'c3'|'c4'|'c5'|'c6'|'c7'|'c8'
    | 'd1'|'d2'|'d3'|'d4'|'d5'|'d6'|'d7'|'d8'
    | 'e1'|'e2'|'e3'|'e4'|'e5'|'e6'|'e7'|'e8'
    | 'f1'|'f2'|'f3'|'f4'|'f5'|'f6'|'f7'|'f8'
    | 'g1'|'g2'|'g3'|'g4'|'g5'|'g6'|'g7'|'g8'
    | 'h1'|'h2'|'h3'|'h4'|'h5'|'h6'|'h7'|'h8';

  interface Game {
    id: string;
    board: string;
    moves: { from: Square; to: Square }[];
    turn: 'w' | 'b';
    updatedAt: Date;
  }

  const db = getFirestore(app);

  export let gameId: string;
  let gameDocRef: any;
  let game: Game | null = null;
  let loading = true;
  let chess: Chess;
  let selectedSquare: Square | null = null;

  const files: string[] = ['a','b','c','d','e','f','g','h'];
  const ranks: number[] = [8,7,6,5,4,3,2,1];

  onMount(() => {
    gameDocRef = doc(db, 'games', gameId);

    onSnapshot(gameDocRef, (snap: DocumentSnapshot<Game>) => {
      if (snap.exists()) {
        game = snap.data() as Game;
        chess = new Chess(game.board);
        loading = false;
      }
    });
  });

  async function handleSquareClick(squareStr: string) {
    const square = squareStr as Square;
    if (!chess) return;

    if (selectedSquare) {
      const move = chess.move({ from: selectedSquare, to: square, promotion: 'q' });
      if (move && game) {
        game.board = chess.fen();
        game.moves.push({ from: selectedSquare, to: square });
        game.turn = chess.turn() as 'w' | 'b';
        await updateDoc(gameDocRef, {
          board: game.board,
          moves: game.moves,
          turn: game.turn,
          updatedAt: new Date(),
        });
      }
      selectedSquare = null;
    } else {
      selectedSquare = square;
    }
  }
</script>

{#if loading}
  <p>Loading game...</p>
{:else}
  <div class="chessboard">
    {#each ranks as rank}
      <div class="rank">
        {#each files as file}
          <button
            type="button"
            class="square {selectedSquare === `${file}${rank}` ? 'selected' : ''}"
            on:click={() => handleSquareClick(`${file}${rank}`)}
          >
            {#if chess.get(`${file}${rank}` as Square)}
              <img src={`/pieces/${chess.get(`${file}${rank}` as Square)?.color}${chess.get(`${file}${rank}` as Square)?.type.toUpperCase()}.png`}
                   alt="{chess.get(`${file}${rank}` as Square)?.type}" />
            {/if}
          </button>
        {/each}
      </div>
    {/each}
  </div>
{/if}

<style>
  .chessboard { display: grid; grid-template-rows: repeat(8, 60px); grid-gap: 0; }
  .rank { display: grid; grid-template-columns: repeat(8, 60px); }
  button.square {
    all: unset;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: beige;
    border: 1px solid black;
    cursor: pointer;
  }
  button.square.selected { background-color: #ffd700; }
  img { width: 50px; height: 50px; pointer-events: none; }
</style>
