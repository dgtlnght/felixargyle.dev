<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { doc, onSnapshot, runTransaction, type DocumentSnapshot, serverTimestamp } from 'firebase/firestore';
  import { auth, db } from '$lib/firebase';
  import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
  
  export let data: { id: string };

  interface Lobby {
    id: string;
    players: string[];
    gameId: string | null;
    createdAt: any;
  }

  let lobbyId = data.id;
  let lobby: Lobby | null = null;
  let currentUser: User | null = null;
  let loading = true;
  let unsubscribe: (() => void) | null = null;
  let lobbyDocRef: any;

  // Authenticates the user (anonymous)
  async function ensureLogin(): Promise<User | null> {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log('[Auth] Signed in:', user.uid);
          resolve(user);
        } else {
          try {
            const anonUser = (await signInAnonymously(auth)).user;
            console.log('[Auth] Signed in anonymously:', anonUser.uid);
            resolve(anonUser);
          } catch (e) {
            console.error('[Auth] Failed anonymous login:', e);
            resolve(null);
          }
        }
      });
    });
  }

  // Subscribe to lobby snapshot
  function subscribeLobby() {
    if (!lobbyDocRef) return;
    console.log('[Lobby] Subscribing...');
    unsubscribe = onSnapshot(lobbyDocRef, (snap: DocumentSnapshot<Lobby>) => {
      if (!snap.exists()) {
        console.warn('[Lobby] Lobby does not exist!');
        return;
      }

      lobby = snap.data() as Lobby;
      console.log('[Lobby] Snapshot:', lobby);

      // Redirect if game is ready
      if (lobby.gameId) {
        console.log('[Lobby] Game ready, redirecting...');
        goto(`/game/${lobby.gameId}`);
      }

      loading = false;
    }, (err) => {
      console.error('[Lobby] Snapshot error:', err);
    });
  }

  // Join the lobby safely
  async function joinLobby() {
    if (!lobbyDocRef || !currentUser) return;
    console.log('[Lobby] Attempting join...');

    try {
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(lobbyDocRef) as DocumentSnapshot<Lobby>;
        if (!snap.exists()) throw new Error('Lobby does not exist');

        const data = snap.data() as Lobby;
        if (!data.players.includes(currentUser!.uid)) {
          const updatedPlayers = [...data.players, currentUser!.uid];
          const updates: Partial<Lobby> = {
            players: updatedPlayers,
            // create gameId if second player joins
            gameId: (!data.gameId && updatedPlayers.length === 2) ? crypto.randomUUID() : data.gameId,
            createdAt: data.createdAt || serverTimestamp()
          };

          transaction.update(lobbyDocRef, updates);
          console.log('[Lobby] Joined successfully:', updates);
        }
      });
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        console.error('[Lobby] Permission denied. Check Firestore rules.');
      } else {
        console.error('[Lobby] Failed to join lobby:', e);
      }
    }
  }

  onMount(async () => {
    console.log('[Lobby] Mounting page...');
    currentUser = await ensureLogin();

    if (currentUser) {
      console.log('[Lobby] Current user:', currentUser.uid);
      lobbyDocRef = doc(db, 'lobbies', lobbyId);
      subscribeLobby();

      // Attempt to join automatically if not already in lobby
      try {
        await joinLobby();
      } catch (e) {
        console.error('[Lobby] Auto-join failed:', e);
      }
    } else {
      console.error('[Lobby] Could not authenticate user!');
    }
  });

  onDestroy(() => {
    if (unsubscribe) {
      console.log('[Lobby] Unsubscribing...');
      unsubscribe();
    }
  });
</script>

{#if loading}
  <p>killing families.....</p>
{:else}
  <div class="lobby-wrapper">
    <h2>Lobby: {lobbyId}</h2>
    <p>Players: {lobby?.players?.length || 0} / 2</p>
    <ul>
      {#each lobby?.players || [] as p}
        <li>{p}</li>
      {/each}
    </ul>

    {#if lobby && (lobby.players?.length || 0) < 2}
      <p>Waiting for opponent to join...</p>
    {/if}

    {#if currentUser && lobby && !(lobby.players?.includes(currentUser.uid))}
      <button on:click={joinLobby}>Join Lobby</button>
    {/if}
  </div>
{/if}