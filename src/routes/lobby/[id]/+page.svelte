<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { getFirestore, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
  import { getAuth, signInAnonymously } from 'firebase/auth';
  import { app } from '$lib/firebase'; // your firebase initialization

  const db = getFirestore(app);
  const auth = getAuth(app);

  export let params: { id: string }; // lobby ID from URL
  let lobbyId: string = params.id;
  let userId: string;
  let unsubscribeLobby: () => void;

  async function ensureLogin() {
    if (!auth.currentUser) {
      const userCred = await signInAnonymously(auth);
      userId = userCred.user.uid;
      console.log('[Lobby] Authenticated user:', userId);
    } else {
      userId = auth.currentUser.uid;
      console.log('[Lobby] User already authenticated:', userId);
    }
  }

  async function joinLobby() {
    const lobbyRef = doc(db, 'lobbies', lobbyId);

    unsubscribeLobby = onSnapshot(lobbyRef, async (snapshot) => {
      const data = snapshot.data();

      if (!data) {
        console.error('[Lobby] Lobby does not exist!');
        return;
      }

      // Add user to lobby if not present
      if (!data.players?.includes(userId)) {
        await updateDoc(lobbyRef, {
          players: [...(data.players || []), userId]
        });
        console.log('[Lobby] Added user to lobby');
        return; // wait for snapshot update
      }

      console.log('[Lobby] Lobby updated:', data);

      // Check if lobby is full
      if (data.players.length >= 2) {
        if (!data.gameId) {
          // Create a new game document
          const gameRef = doc(db, 'games', crypto.randomUUID());
          await setDoc(gameRef, {
            gameId: gameRef.id,
            boardFEN: 'start', // initial board FEN
            createdAt: new Date(),
          });

          await updateDoc(lobbyRef, { gameId: gameRef.id });
          console.log('[Lobby] Created game and updated lobby:', gameRef.id);
        } else {
          console.log('[Lobby] Game ready, redirecting...');
          if (unsubscribeLobby) unsubscribeLobby();
          goto(`/game/${data.gameId}`);
        }
      }
    });
  }

  onMount(async () => {
    console.log('[Lobby] Mounting lobby page:', lobbyId);
    await ensureLogin();
    await joinLobby();
  });

  onDestroy(() => {
    if (unsubscribeLobby) unsubscribeLobby();
    console.log('[Lobby] Unsubscribed from lobby updates.');
  });
</script>

<main class="p-4">
  <h1 class="text-2xl font-bold">Lobby {lobbyId}</h1>
  <p class="mt-2 text-gray-600">Waiting for opponent...</p>
</main>
