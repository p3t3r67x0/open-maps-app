<template>
  <MapWrapper
    :map-component="GenericMap"
    :map-props="mapProps"
  />
</template>

<script setup>
import GenericMap from '~/components/GenericMap.vue'
import { useTileLayers } from '~/composables/useTileLayers'

const tileLayers = useTileLayers()

const mapProps = {
  center: [54.817, 9.4515],
  zoom: 12,
  baseLayers: tileLayers.baseLayers,
  overlayLayers: tileLayers.overlayLayers
}
</script>
