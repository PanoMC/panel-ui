<script>
  import { sanitize } from '@jill64/universal-sanitizer'
  import { marked } from "marked";

  marked.use({
    gfm: true
  })

  export let content
</script>

{@html marked.parse(sanitize(content))}