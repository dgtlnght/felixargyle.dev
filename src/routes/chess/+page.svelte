<script lang="ts">
import { onMount } from 'svelte';
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { app } from '$lib/firebase';
import { goto } from '$app/navigation';


const db = getFirestore(app);
const lobbiesCol = collection(db, 'lobbies');


let lobbies: any[] = [];
let loading = true;


onMount(() => {
const q = query(lobbiesCol, orderBy('createdAt', 'desc'));
const unsubscribe = onSnapshot(q, (snap) => {
lobbies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
loading = false;
});
return () => unsubscribe();
});


async function createLobby() {
const newLobby = {
createdAt: new Date(),
players: [],
gameId: null
};


const docRef = await addDoc(lobbiesCol, newLobby);
goto(`/lobby/${docRef.id}`);
}
</script>


{#if loading}
<p>Loading lobbies...</p>
{:else}
<div class="home-wrapper">
<h2>Open Lobbies</h2>
<button on:click={createLobby}>Create New Lobby</button>


{#if lobbies.length === 0}
<p>No lobbies yet.</p>
{:else}
<ul>
{#each lobbies as lobby}
<li>
<a href={`/lobby/${lobby.id}`}>Lobby {lobby.id} ({lobby.players?.length || 0}/2)</a>
</li>
{/each}
</ul>
{/if}
</div>
{/if}


<style>
.home-wrapper { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:1rem; }
button { padding:0.5rem 1rem; font-size:1rem; border-radius:0.5rem; border:none; background:#34a853; color:white; cursor:pointer; }
button:hover { background:#0f8b42; }
ul { list-style:none; padding:0; display:flex; flex-direction:column; gap:0.5rem; }
a { text-decoration:none; color:#4285f4; font-weight:500; }
a:hover { text-decoration:underline; }
</style>