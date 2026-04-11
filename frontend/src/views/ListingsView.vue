<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { api } from '../api'

type Listing = {
  id: string
  title: string
  priceVnd: number
  status: string
  sellerId: string
}

const items = ref<Listing[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.get('/listings')
    items.value = response.data.items ?? []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="page">
    <Card>
      <template #title>Listings</template>
      <template #content>
        <DataTable :value="items" :loading="loading" paginator :rows="10" data-key="id">
          <Column field="title" header="Title" />
          <Column field="priceVnd" header="Price (VND)" />
          <Column field="sellerId" header="Seller" />
          <Column header="Status">
            <template #body="{ data }">
              <Tag :value="data.status" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </main>
</template>
