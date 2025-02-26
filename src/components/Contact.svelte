<script>
	import { language } from '$stores/main';
	// import img_1 from '$images/about/1.png?enhanced';
</script>

<svelte:head>
	<title>Adam Smith - Contact</title>
	<meta charset="UTF-8" />
	<meta name="description" content="Adam Smith - Contact" />
	<script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Adam Smith - Contact",
      "name": "Adam Smith - Contact",
      "description": "Adam Smith - Contact"
    }
	</script>
	<meta name="keywords" content="Contact, Adam Smith, Adam, Smith" />
</svelte:head>
<div class="flex gap-8 flex-col">
	<p class="text-2xl font-extrabold tracking-tight text-center">
		{$language == 'en' ? 'Contact' : '問い合わせ'}
	</p>
	<p class="text-5xl text-center">{$language == 'en' ? 'ADD SOMETHING HERE' : 'ここに追加する'}</p>
</div>
