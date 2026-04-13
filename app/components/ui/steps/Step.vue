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
        /** Additional CSS classes to apply to the step item */
        class?: HtmlHTMLAttributes["class"];
    }>(),
    {}
);

const styles = cn(
    "before:absolute before:-left-4 before:flex before:h-8 before:w-8 before:items-center before:justify-center before:rounded-full before:bg-secondary before:text-sm before:text-secondary-foreground before:content-[counter(step)] before:[counter-increment:step]",
    props.class
);
</script>