<Sidebar />

<!--  Main  -->
<main class="w-100 min-vh-100 overflow-auto pb-5">
  <Navbar />

  <slot />
</main>

<script context="module">
  import Sidebar from "$lib/component/Sidebar.svelte";
  import Navbar from "$lib/component/Navbar.svelte";
</script>