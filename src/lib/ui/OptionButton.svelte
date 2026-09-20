<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    selected,
    onclick,
    children,
    class: klass = '',
    role = 'radio',
  }: {
    selected: boolean
    onclick: () => void
    children: Snippet
    class?: string
    role?: 'radio' | 'checkbox'
  } = $props()
</script>

<button
  type="button"
  {role}
  aria-checked={role === 'radio' ? selected : undefined}
  aria-pressed={role === 'checkbox' ? selected : undefined}
  class="ae-opt {klass}"
  {onclick}
>
  {@render children()}
</button>
