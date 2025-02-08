<li class="nav-item">
  <a class="nav-link {disabled && 'disabled'}" aria-current="page" href="{base + href}" aria-disabled="{disabled}"
     class:active="{matching(
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


  function matching(path, pathName, startsWith = false, matchingList) {
    return (
      path.toUpperCase() === pathName.toUpperCase() ||
      path.toUpperCase() === (pathName + "/").toUpperCase() ||
      (startsWith && path.startsWith(pathName)) ||
      matchingList.filter((item) => path.startsWith(base + item)).length > 0
    );
  }
</script>