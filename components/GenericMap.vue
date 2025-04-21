<template>
  <div class="relative flex w-full flex-1 flex-grow">
    <!-- Map Container -->
    <div id="map" ref="mapContainer" class="w-full flex-1 flex-grow"></div>

    <!-- Layer Selector Button -->
    <div class="absolute bottom-4 left-4 z-[1000]">
      <button
        @click="toggleLayerSelector"
        class="bg-white p-2 rounded shadow-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Layers
      </button>

      <!-- Layer Selector Dropdown -->
      <div
        v-if="showLayerSelector"
        class="mt-2 bg-white p-4 rounded shadow-md w-64"
      >
        <label for="baseLayerSelect" class="block text-sm font-medium text-gray-700 mb-1">Base Layers:</label>
        <select
          id="baseLayerSelect"
          v-model="selectedBaseLayer"
          @change="updateBaseLayer"
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option v-for="(layer, key) in baseLayers" :key="key" :value="key">
            {{ key }}
          </option>
        </select>

        <label for="overlayLayerSelect" class="block text-sm font-medium text-gray-700 mt-4 mb-1">Overlay Layers:</label>
        <div v-for="(layer, key) in overlayLayers" :key="key" class="flex items-center space-x-2">
          <input
            type="checkbox"
            :id="`overlay-${key}`"
            :value="key"
            v-model="activeOverlayLayers"
            @change="updateOverlayLayers"
            class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label :for="`overlay-${key}`" class="text-sm text-gray-700">{{ key }}</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Use defineComponent with SSR: false to make this component client-only
export default {
  name: 'GenericMap',
  ssr: false
}
</script>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue' // Import watch
import { useRoute } from 'vue-router'

const props = defineProps({
  center: {
    type: Array,
    default: () => [51.1657, 10.4515],
    validator: (value) => value.length === 2 && value.every((v) => typeof v === 'number')
  },
  zoom: {
    type: Number,
    default: 6
  },
  baseLayers: {
    type: Object,
    default: () => ({})
  },
  overlayLayers: {
    type: Object,
    default: () => ({})
  },
  mapInit: {
    type: Function,
    default: () => {}
  },
  maxZoom: {
    type: Number,
    default: 20
  }
})

// --- Get Current Route ---
const route = useRoute()

// --- Local Storage Key (Page Specific) ---
// Use a base key + route path for uniqueness per page
const storageKey = computed(() => `mapSettings_${route.path}`)

// --- Refs ---
const mapContainer = ref(null)
const map = ref(null)
const currentBaseLayer = ref(null)
const overlayLayerRefs = ref({})
const showLayerSelector = ref(false)
const markerClusterGroup = ref(null)

// --- Refs for Persisted State (initialized with defaults/props) ---
const mapCenter = ref([...props.center]) // Use local refs for center/zoom
const mapZoom = ref(props.zoom)
const selectedBaseLayer = ref(null) // Initialize later after loading storage
const activeOverlayLayers = ref([]) // Initialize later after loading storage

// Computed property to check if layers exist
const hasLayers = computed(() => Object.keys(props.baseLayers).length > 0 || Object.keys(props.overlayLayers).length > 0)

// Leaflet reference
let L = null

// --- Load Settings ---
function loadMapSettings() {
  if (!process.client) return // Only run on client

  const savedSettings = localStorage.getItem(storageKey.value) // Use computed key
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings)
      mapCenter.value = settings.center || [...props.center]
      mapZoom.value = settings.zoom || props.zoom
      // Ensure the saved layer key still exists in the current props
      selectedBaseLayer.value = settings.selectedBaseLayer && props.baseLayers[settings.selectedBaseLayer]
        ? settings.selectedBaseLayer
        : Object.keys(props.baseLayers)[0]
      // Filter saved overlay keys to only include those present in current props
      activeOverlayLayers.value = (settings.activeOverlayLayers || []).filter(key => props.overlayLayers[key])
      console.log(`Loaded map settings from localStorage for ${storageKey.value}:`, settings)
      return true // Indicate settings were loaded
    } catch (e) {
      console.error(`Failed to parse map settings from localStorage for ${storageKey.value}:`, e)
      localStorage.removeItem(storageKey.value) // Clear invalid data for this specific key
    }
  }
  // Default initialization if no valid settings found
  selectedBaseLayer.value = Object.keys(props.baseLayers)[0]
  activeOverlayLayers.value = [] // Start with no overlays active by default
  return false // Indicate settings were not loaded
}

// --- Save Settings ---
function saveMapSettings() {
  if (!process.client || !map.value) return // Only run on client and if map exists

  const settings = {
    center: map.value.getCenter(), // Get current center from map
    zoom: map.value.getZoom(),     // Get current zoom from map
    selectedBaseLayer: selectedBaseLayer.value,
    activeOverlayLayers: activeOverlayLayers.value
  }
  try {
    // Corrected typo: valulocalStorage -> localStorage and storageKey.e -> storageKey.value
    localStorage.setItem(storageKey.value, JSON.stringify(settings)) // Use computed key
    // console.log(`Saved map settings to localStorage for ${storageKey.value}:`, settings); // Optional: for debugging
  } catch (e) {
    console.error(`Failed to save map settings to localStorage for ${storageKey.value}:`, e)
  }
}

// --- Lifecycle Hooks ---
onMounted(() => {
  if (process.client) {
    loadMapSettings() // Load settings before initializing map
    initLeaflet()
  }
})

onBeforeUnmount(() => {
  // Clean up Leaflet map on component unmount
  if (map.value) {
    // Remove event listeners before removing map
    map.value.off('moveend', saveMapSettings)
    map.value.off('zoomend', saveMapSettings)
    map.value.remove()
    map.value = null
  }
  if (markerClusterGroup.value) {
    markerClusterGroup.value.clearLayers()
    markerClusterGroup.value = null
  }
})

// --- Watchers to Save Settings ---
watch(selectedBaseLayer, saveMapSettings)
watch(activeOverlayLayers, saveMapSettings, { deep: true }) // Use deep watch for array changes

// --- Computed Base Layers (no change needed here) ---
const baseLayers = computed(() => {
  const storedBaseLayers = localStorage.getItem('leafletBaseLayers') // Keep separate storage for layer definitions if needed
  return storedBaseLayers ? JSON.parse(storedBaseLayers) : props.baseLayers
})

// --- Leaflet Initialization ---
async function initLeaflet() {
  // Keep separate storage for base layer definitions if needed, or remove if not used elsewhere
  const leafletBaseLayers = localStorage.getItem('leafletBaseLayers')
  if (!leafletBaseLayers) {
    localStorage.setItem('leafletBaseLayers', JSON.stringify(props.baseLayers))
  }

  try {
    const leaflet = await import('leaflet')
    L = leaflet.default
    await import('leaflet.markercluster')
    await import('leaflet.markercluster/dist/MarkerCluster.css')
    await import('leaflet.markercluster/dist/MarkerCluster.Default.css')

    await nextTick()

    if (!mapContainer.value) {
      console.error('Map container reference is not available')
      return
    }

    // Initialize map using loaded/default center and zoom
    const mapInstance = L.map(mapContainer.value, {
      zoomControl: false,
      maxZoom: props.maxZoom
    }).setView(mapCenter.value, mapZoom.value) // Use refs here
    map.value = mapInstance

    // Add event listeners to save view changes
    mapInstance.on('moveend', saveMapSettings)
    mapInstance.on('zoomend', saveMapSettings)

    markerClusterGroup.value = L.markerClusterGroup()
    mapInstance.addLayer(markerClusterGroup.value)

    if (typeof props.mapInit === 'function') {
      try {
        props.mapInit(mapInstance, markerClusterGroup.value)
      } catch (error) {
        console.error('Error in mapInit function:', error)
      }
    }

    // Add the initial base layer (using potentially loaded selection)
    updateBaseLayer()

    // Initialize overlay layers refs
    Object.keys(props.overlayLayers).forEach(key => {
      const layerConfig = props.overlayLayers[key]
      const layer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        opacity: layerConfig.opacity || 1,
        maxZoom: layerConfig.maxZoom || 20,
        maxNativeZoom: layerConfig.maxNativeZoom
      })
      overlayLayerRefs.value[key] = layer
    })

    // Apply initially active overlay layers (using potentially loaded selection)
    updateOverlayLayers()

    // Call overlayFunction if provided (no change needed)
    if (typeof props.overlayFunction === 'function') {
      try {
        props.overlayFunction(mapInstance, markerClusterGroup.value)
      } catch (error) {
        console.error('Error in overlayFunction:', error)
      }
    }

  } catch (error) {
    console.error('Failed to initialize Leaflet map:', error)
  }
}

// --- Layer Update Functions (no need to call saveMapSettings here, watchers handle it) ---
function updateBaseLayer() {
  if (!map.value || !L || !selectedBaseLayer.value) {
    // console.error('Map, Leaflet, or selectedBaseLayer not ready for updateBaseLayer.')
    return
  }

  if (currentBaseLayer.value) {
    map.value.removeLayer(currentBaseLayer.value)
  }

  const layerConfig = props.baseLayers[selectedBaseLayer.value]
  if (!layerConfig) {
    console.error('Base layer configuration not found for:', selectedBaseLayer.value)
    // Attempt to fall back to the first available layer if the saved one is invalid
    const firstLayerKey = Object.keys(props.baseLayers)[0]
    if (firstLayerKey && firstLayerKey !== selectedBaseLayer.value) { // Prevent infinite loop if first key is also bad
        selectedBaseLayer.value = firstLayerKey
        // Re-add the layer *now* if the map is already initialized.
        const fallbackConfig = props.baseLayers[firstLayerKey];
        if (fallbackConfig) {
             try {
                currentBaseLayer.value = L.tileLayer(fallbackConfig.url, {
                  attribution: fallbackConfig.attribution,
                  maxZoom: fallbackConfig.maxZoom || 20,
                  maxNativeZoom: fallbackConfig.maxNativeZoom
                }).addTo(map.value)
              } catch (error) {
                console.error('Error adding fallback base layer:', error)
              }
        }
    }
    return // Exit here if the original config was not found
  }

  try {
    currentBaseLayer.value = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom || 20,
      maxNativeZoom: layerConfig.maxNativeZoom
    }).addTo(map.value)
  } catch (error) {
    console.error('Error adding base layer:', error)
  }
}

function updateOverlayLayers() {
  if (!map.value || !L) return

  Object.keys(overlayLayerRefs.value).forEach(key => {
    const layer = overlayLayerRefs.value[key]
    if (activeOverlayLayers.value.includes(key)) {
      if (!map.value.hasLayer(layer)) {
        layer.addTo(map.value)
      }
    } else {
      if (map.value.hasLayer(layer)) {
        map.value.removeLayer(layer)
      }
    }
  })
}

// --- Toggle Layer Selector (no change needed) ---
function toggleLayerSelector() {
  showLayerSelector.value = !showLayerSelector.value
}
</script>