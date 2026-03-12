<script setup lang="ts">
// 初始化主题
useTheme()
</script>

<template>
  <BaseLoadingScreen />
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
