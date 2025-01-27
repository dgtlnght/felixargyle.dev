<script lang="ts">
	import ModeSwitcher from './lib/ModeSwitcher.svelte';
</script>

<ModeSwitcher />
<style>
	.sticky-image {
	  position: -webkit-sticky; /* For Safari */
	  position: sticky;
	  bottom: 0; /* Stick it to the bottom of the screen */
	  left: 32.5%; /* Centers the image horizontally */
	  transform: translateX(-50%); /* Adjusts to exactly center the image */
	  width: 450px; /* Adjust width to make the image smaller */
	  height: auto; /* Maintains aspect ratio */
	  z-index: 1000; /* Keeps it on top of other content */
	}
	
	/* Optional: Adds some extra content for scrolling */
	.content {
	  height: 2000px; /* Makes the page scrollable */
	}
  </style>
  
  <div class="content bottom-0">
  </div>
  
<img class="sticky-image" src="src/p-trans.png" alt="felix :3" />

<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#d66a6f] text-2xl md:Zen-Kaku-Gothic-New">
	<h1 class='flex items-center justify-center text-5xl'>Welcome to felixargyle.dev!</h1>
	<br>
	<p>The personal website of dgtlnght!</p>
</div>
