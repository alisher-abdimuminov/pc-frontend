<template>
    <div :class="styles">
        <slot />
    </div>
</template>

<script lang="ts" setup>
import type { HtmlHTMLAttributes } from "vue";
import { cn } from "~/lib/utils";

const props = withDefaults(
    defineProps<{
        /** Additional CSS classes to apply to the steps container */
        class?: HtmlHTMLAttributes["class"];
    }>(),
    {}
);

const styles = cn(
    "relative ml-4 border-l pl-7 [counter-reset:step]",
    props.class
);
</script>