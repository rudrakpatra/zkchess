<script lang="ts">
    import { page } from '$app/stores';
</script>
<div>
    <h1>Player {$page.url.searchParams.get("key")}</h1>
</div>