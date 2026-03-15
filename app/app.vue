<script setup lang="ts">
// 初始化主题
useTheme()
</script>

<template>
  <BaseLoadingScreen />
  <UApp :toaster="{ position: 'top-right' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
