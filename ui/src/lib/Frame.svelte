<script lang="ts">
	export let id: string;
</script>

<div {id} class="absolute inset-0 h-full w-full grid place-content-center">
	<slot />
</div>
