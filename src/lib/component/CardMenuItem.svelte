<li class="nav-item">
  <a class="nav-link {disabled && 'disabled'}" aria-current="page" href="{base + href}" aria-disabled="{disabled}"
     class:active="{typeof active !== 'undefined' ? active : matching(
            $page.url.pathname,
            base + href,
            startsWith,
            matchingList
          )}"
  ><slot/></a>
</li>

<script>
  import { page } from "$app/stores";
  import { base } from "$app/paths";

  export let href
  export let startsWith = false;
  export let disabled = false;
  export let matchingList = [];
  export let active;

  function matching(path, pathName, startsWith = false, matchingList) {
    return (
      matchingList.length > 0 ? matchingList.filter((item) => path + $page.url.search === base + item).length > 0 : (startsWith && path.startsWith(pathName))||
      path.toUpperCase() === pathName.toUpperCase() ||
      path.toUpperCase() === (pathName + "/").toUpperCase()
    );
  }
</script>