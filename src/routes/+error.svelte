{#if $page.status === 401 && $page.error?.inlineLogin}
  <AuthShell>
    <Login />
  </AuthShell>
{:else}
  <Error />
{/if}

<script>
  /**
   * A 401 raised by `requireSignedIn` (a SERVERS install, nobody signed in) is not an error to
   * read about: the login form renders right here, at the address the visitor asked for, and a
   * successful sign-in reloads that same address. Everything else is the usual error page.
   */
  import { page } from '$app/stores';

  import AuthShell from '$lib/layouts/AuthShell.svelte';
  import Error from '$lib/pages/Error.svelte';
  import Login from '$lib/pages/auth/Login.svelte';
</script>
