export default class MapSettings {
    constructor() {
        this.lat = 54.0
        this.lon = 9.5
        this.zoomLevel = 12
    }

    getLatitude() {
        return this.lat
    }
    getLongitude() {
        return this.lon
    }
    getZoomLevel() {
        return this.zoomLevel
    }
}