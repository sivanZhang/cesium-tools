<template>
	<div id="cesiumContainer"></div>
</template>
<script>
const Cesium = require('cesium/Cesium')
import CesiumTool from "./cesiumTool";
export default {
	name: 'CesiumScene',
	data() {
		return {}
	},
	mounted() {
		this.init()
	},
	beforeDestroy() {},
	methods: {
		init() {
			Cesium.Ion.defaultAccessToken =
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkODZjOGY4Yy1jOGEzLTRlNzMtYTdlMS03ZWQ5MmE4M2RkMzEiLCJpZCI6MjA0NTYsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1Nzc0NzI0Nzd9.3OfoKjLexR3j8kcepsM_h0hj1vEpS0jd_aw9n-izLKk'
			const viewer = new Cesium.Viewer('cesiumContainer', {
				terrainProvider: new Cesium.createWorldTerrain({
					requestVertexNormals: true,
					url: Cesium.IonResource.fromAssetId(3957)
				}),
				baseLayerPicker: false,
				fullscreenButton: false,
				scene3DOnly: true,
				animation: false,
				timeline: false,
				navigationHelpButton: false,
				navigationInstructionsInitiallyVisible: false,
				geocoder: false
			})
			const { camera, scene } = viewer
			const layers = scene.imageryLayers
			layers.addImageryProvider(new Cesium.IonImageryProvider({ assetId: 3 }))
			const { globe } = scene
			globe.depthTestAgainstTerrain = true
			const tileset = new Cesium.Cesium3DTileset({
				url: './Tileset/tileset.json'
			})
			tileset.readyPromise
				.then(function() {
					camera.viewBoundingSphere(
						tileset.boundingSphere,
						new Cesium.HeadingPitchRange(0, -0.5, 0)
					)
					camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
					const heightOffset = 70.0
					const boundingSphere = tileset.boundingSphere
					const cartographic = Cesium.Cartographic.fromCartesian(
						boundingSphere.center
					)
					const surface = Cesium.Cartesian3.fromRadians(
						cartographic.longitude,
						cartographic.latitude,
						0.0
					)
					const offset = Cesium.Cartesian3.fromRadians(
						cartographic.longitude,
						cartographic.latitude,
						heightOffset
					)
					const translation = Cesium.Cartesian3.subtract(
						offset,
						surface,
						new Cesium.Cartesian3()
					)
					tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation)
					scene.primitives.add(tileset)
				})
				.otherwise(function(error) {
					throw error
				})
			const cesiumTool =new CesiumTool(Cesium,viewer)
			cesiumTool.startTriangulation()
		}
	}
}
</script>

<style lang="scss" scoped>
@import url('~cesium/Widgets/widgets.css');
#cesiumContainer {
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
	overflow: hidden;
	position: relative;
}
</style>
