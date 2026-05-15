<script setup lang="ts">
const theme = useTheme()

// Apply class on html during SSR + client (no flash)
useHead(() => ({
  htmlAttrs: { class: theme.isDark.value ? 'dark' : '' },
}))
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
