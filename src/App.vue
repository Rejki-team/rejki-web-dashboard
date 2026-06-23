<script setup lang="ts">
// Root aplikasi: outlet router + container toast global.
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/ui/ToastContainer.vue'
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
