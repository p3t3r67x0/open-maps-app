<template>
    <div class="w-full h-full flex-grow flex flex-col relative" id="main-content">
      <ClientOnly>
        <component
          :is="mapComponent"
          ref="mapRef"
          v-bind="mapProps"
        >
          <slot></slot>
        </component>
        <template #fallback>
          <div class="w-full h-full flex-grow flex items-center justify-center bg-gray-100">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p>Loading map...</p>
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>
  </template>
  
  <script setup>
  import { ref, defineProps } from 'vue'
  
  // Props to pass
  defineProps({
    mapComponent: {
      type: [Object, Function], // Can be a component
      required: true
    },
    mapProps: {
      type: Object,
      required: true
    }
  })
  
  const mapRef = ref(null)
  </script>