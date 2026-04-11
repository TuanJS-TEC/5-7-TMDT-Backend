<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
</script>

<template>
  <main class="page">
    <Card>
      <template #title>Car Marketplace Admin</template>
      <template #content>
        <p class="mb-3">Vue 3 + PrimeVue scaffold is ready for API integration.</p>
        <router-link to="/listings">
          <Button label="Open Listings" icon="pi pi-list" />
        </router-link>
      </template>
    </Card>
  </main>
</template>
