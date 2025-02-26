<script>
	import { language } from '$stores/main';
	// import img_1 from '$images/about/1.png?enhanced';
</script>

<svelte:head>
	<title>Adam Smith - Blog</title>
	<meta charset="UTF-8" />
	<meta name="description" content="Adam Smith - Blog" />
	<script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Adam Smith - Blog",
      "name": "Adam Smith - Blog",
      "description": "Adam Smith - Blog"
    }
	</script>
	<meta name="keywords" content="Blog, Adam Smith, Adam, Smith" />
</svelte:head>
<div class="flex gap-8 flex-col">
	<p class="text-2xl font-extrabold tracking-tight text-center">
		{$language == 'en' ? 'Blog' : 'ブログ'}
	</p>
	<p class="text-5xl text-center">{$language == 'en' ? 'ADD SOMETHING HERE' : 'ここに追加する'}</p>
</div>
