<template>
  <ClientOnly>
    <MapWrapper
      :map-component="GenericMap"
      :map-props="mapProps"
    />
  </ClientOnly>
  <ClientOnly>
      <DetailsPanel 
        ref="detailsRef"
        :title="markerTitle" 
        :content="markerContent" 
        :is-visible="detailsPanelVisible"
        @close="hideDetailsPanel"
      />
      <template #fallback>
        <!-- Fallback content for SSR -->
        <div class="hidden">Loading details panel...</div>
      </template>
    </ClientOnly>
</template>

<script setup>
// import MapSettings from '~/utils/mapApp'
import { ref, computed } from 'vue'
import GenericMap from '~/components/GenericMap.vue'
import { useTileLayers } from '~/composables/useTileLayers'
import { useWeatherData } from '~/composables/useWeatherData'

import L from 'leaflet'

const mapRef = ref(null)
const markerClusterGroupRef = ref(null)
const detailsPanelVisible = ref(false)
const markerTitle = ref('')
const markerContent = ref('')

const config = useRuntimeConfig()
const weatherApiBaseUrl = computed(() => config.public.weatherApiBaseUrl)

const tileLayers = useTileLayers()
const { fetchForecastData, formatForecastData } = useWeatherData()

const mapInit = (map, clusterGroup) => {
  mapRef.value = map
  markerClusterGroupRef.value = clusterGroup
  fetchMarkersByBounds()

  map.on('moveend', fetchMarkersByBounds)

  map.on('click', (e) => {
    if (detailsPanelVisible.value) {
      detailsPanelVisible.value = false
    }
  })
}

const renderMarkers = (clusterGroup, markers) => {
  if (!clusterGroup) return

  clusterGroup.clearLayers()

  markers.forEach((marker) => {
    const { geometry, properties } = marker
    const latLng = [geometry.coordinates[1], geometry.coordinates[0]]
    const markerInstance = L.marker(latLng)

    const popupContent = `<h3>${properties.station_name}</h3>`
    markerInstance.bindPopup(popupContent)

    markerInstance.on('click', () => {
      fetchForecastData(marker.id)
        .then((data) => {
          markerContent.value = formatForecastData(data)
          markerTitle.value = properties.station_name || marker.id
          detailsPanelVisible.value = true
        })
    })

    clusterGroup.addLayer(markerInstance)
  })
}

async function fetchMarkersByBounds() {
  const map = mapRef.value
  const clusterGroup = markerClusterGroupRef.value
  if (!map || !clusterGroup) return

  const bounds = map.getBounds()
  const url = `${weatherApiBaseUrl.value}/climate/v1/mosmix/bounds?xmin=${bounds.getWest().toFixed(6)}&ymin=${bounds.getSouth().toFixed(6)}&xmax=${bounds.getEast().toFixed(6)}&ymax=${bounds.getNorth().toFixed(6)}`

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
    const data = await response.json()

    renderMarkers(clusterGroup, data.features || [])
  } catch (error) {
    console.error("Error fetching markers:", error)
  }
}

const hideDetailsPanel = () => {
  detailsPanelVisible.value = false
}

const mapProps = {
  center: [54.817, 9.4515],
  zoom: 11,
  baseLayers: tileLayers.baseLayers,
  overlayLayers: tileLayers.overlayLayers,
  mapInit: mapInit
}
</script>
