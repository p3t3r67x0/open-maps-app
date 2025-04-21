/**
 * Composable to provide tile layer configurations
 */
export const useTileLayers = () => {
  return {
    baseLayers: {
      'Future OSM DE/DK': {
        url: 'https://tiles.oklabflensburg.de/fosm/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="dc:rights">OpenStreetMap</a> contributors'
      },
      'OSM Graustufen DE/DK': {
        url: 'https://tiles.oklabflensburg.de/sgm/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="dc:rights">OpenStreetMap</a> contributors'
      },
      'Kulturnacht FL': {
        url: 'https://tiles.oklabflensburg.de/knf/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="dc:rights">OpenStreetMap</a> contributors'
      },
      'OSM Bright DE/DK': {
        url: 'https://tiles.oklabflensburg.de/osm/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="dc:rights">OpenStreetMap</a> contributors'
      }
    },
    overlayLayers: {
      'Orthophotos SH': {
        url: 'https://dienste.gdi-sh.de/WMS_SH_DOP20col_OpenGBD',
        layers: 'sh_dop20_rgb',
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution: '&copy; <a href="https://www.schleswig-holstein.de/DE/landesregierung/ministerien-behoerden/LVERMGEOSH" target="_blank" rel="dc:rights">GeoBasis-DE/LVermGeo SH</a>/<a href="https://creativecommons.org/licenses/by/4.0/" rel="dc:rights">CC BY 4.0</a>'
      },
      'XPlan Flensburg': {
        url: 'https://tiles.oklabflensburg.de/xplan/{z}/{x}/{y}.png',
        attribution: '<a href="https://geodaten.schleswig-holstein.de/gaialight-sh/_apps/dladownload/lizenz.html" target="_blank" rel="dc:rights">©GeoBasis-DE/LVermGeo SH/CC BY 4.0</a>'
      },
      'Grid3857': {
        url: 'https://tiles.oklabflensburg.de/grid3857/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="dc:rights">OpenStreetMap</a> contributors'
      }
    }
  }
}
