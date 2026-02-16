<script lang="ts">
	import { onMount } from 'svelte';
	import { getDb, getWindowState, saveWindowState } from '$lib/db';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { currentMonitor, availableMonitors } from '@tauri-apps/api/window';
	import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi';

	onMount(async () => {
		try {
			await getDb();
			console.log('Database initialized');
		} catch (error) {
			console.error('Failed to initialize database:', error);
			return;
		}

		// Restore window state
		try {
			const saved = await getWindowState();
			if (saved) {
				const monitors = await availableMonitors();
				const positionValid = monitors.some((m) => {
					const pos = m.position;
					const size = m.size;
					return (
						saved.x >= pos.x &&
						saved.x < pos.x + size.width &&
						saved.y >= pos.y &&
						saved.y < pos.y + size.height
					);
				});

				const win = getCurrentWindow();
				await win.setSize(new PhysicalSize(saved.width, saved.height));
				if (positionValid) {
					await win.setPosition(new PhysicalPosition(saved.x, saved.y));
				}
			}
		} catch (error) {
			console.error('Failed to restore window state:', error);
		}

		// Listen for move/resize events and save with debounce
		let debounceTimer: ReturnType<typeof setTimeout> | null = null;

		async function persistState() {
			try {
				const win = getCurrentWindow();
				const pos = await win.outerPosition();
				const size = await win.outerSize();
				const monitor = await currentMonitor();
				await saveWindowState({
					x: pos.x,
					y: pos.y,
					width: size.width,
					height: size.height,
					monitor_name: monitor?.name ?? null,
				});
			} catch (error) {
				console.error('Failed to save window state:', error);
			}
		}

		function debouncedSave() {
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(persistState, 500);
		}

		const win = getCurrentWindow();
		const unlistenMoved = await win.onMoved(debouncedSave);
		const unlistenResized = await win.onResized(debouncedSave);

		return () => {
			if (debounceTimer) clearTimeout(debounceTimer);
			unlistenMoved();
			unlistenResized();
		};
	});
</script>

<slot />
