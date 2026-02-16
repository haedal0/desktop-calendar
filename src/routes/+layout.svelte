<script lang="ts">
	import { onMount } from 'svelte';
	import { getDb } from '$lib/db';

	onMount(async () => {
		try {
			await getDb();
			console.log('Database initialized');
		} catch (error) {
			console.error('Failed to initialize database:', error);
		}
	});
</script>

<slot />
