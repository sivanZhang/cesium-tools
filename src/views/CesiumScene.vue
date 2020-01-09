<template>
	<div id="cesiumContainer"></div>
</template>
<script>
const Cesium = require('cesium/Cesium')
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
			let viewer = new Cesium.Viewer('cesiumContainer', {
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
			var layers = viewer.scene.imageryLayers

			const { camera, scene, entities } = viewer
			const { globe } = scene

			const ellipsoid = Cesium.Ellipsoid.WGS84
			const LINEPOINTCOLOR = Cesium.Color.BURLYWOOD
			// 在连接两个提供的行星点的椭球上初始化一个测地线。
			const geodesic = new Cesium.EllipsoidGeodesic()
			const tileset = new Cesium.Cesium3DTileset({
				url: './Tileset/tileset.json'
			})
			layers.addImageryProvider(new Cesium.IonImageryProvider({ assetId: 3 }))
			globe.depthTestAgainstTerrain = true
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

			//  线的可渲染集合
			handelMeasure()
			function handelMeasure() {
				const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
				const polylines = scene.primitives.add(new Cesium.PolylineCollection())
				const points = scene.primitives.add(new Cesium.PointPrimitiveCollection())
				const label = {
					font: '14px monospace',
					showBackground: true,
					horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
					verticalOrigin: Cesium.VerticalOrigin.CENTER,
					pixelOffset: new Cesium.Cartesian2(0, 0),
					eyeOffset: new Cesium.Cartesian3(0, 0, -50),
					fillColor: Cesium.Color.WHITE
				}
				let handler2,
					verticalLabel,
					circle,
					polyline,
					point1,
					point3,
					point2,
					point1GeoPosition,
					point3GeoPosition
				handler.setInputAction(function({ position }) {
					if (scene.mode !== Cesium.SceneMode.MORPHING) {
						let plPositions = []
						// 鼠标触发的位置的笛卡尔坐标
						const cartesian = getMouseEventPosition(position)

						if (Cesium.defined(cartesian)) {
							if (points.length === 2 && points.contains(point3)) {
								points.removeAll()
								polylines.removeAll()
								entities.remove(verticalLabel)
								entities.remove(circle)
							}
							//add first point

							if (points.length === 0) {
								verticalLabel = entities.add({
									label: label
								})
								circle = entities.add({
									id: 'custom_circle',
									ellipse: {
										material: Cesium.Color.WHITE.withAlpha(0.3),
										show: false,
										semiMinorAxis: 50,
										semiMajorAxis: 50
									}
								})
								polyline = polylines.add({
									show: false,
									width: 2,
									material: new Cesium.Material({
										fabric: {
											type: 'Color',
											uniforms: {
												color: LINEPOINTCOLOR
											}
										}
									})
								})
								point1 = points.add({
									position: cartesian,
									color: Cesium.Color.RED
								})
								point2 = points.add({
									color: Cesium.Color.RED
								})
								point1GeoPosition = Cesium.Cartographic.fromCartesian(
									cartesian
                )
								polyline.show = true
                circle.ellipse.show = true
                

								handler2 = new Cesium.ScreenSpaceEventHandler(
									scene.canvas
								)
								handler2.setInputAction(function({ endPosition }) {
									const hoverCartesian = getMouseEventPosition(
										endPosition
									)
									const point2GeoPosition = Cesium.Cartographic.fromCartesian(
										hoverCartesian
									)
									point2.position = hoverCartesian
									let labelHeight
									if (
										point2GeoPosition.height >=
										point1GeoPosition.height
									) {
										plPositions = [
											point1.position,
											new Cesium.Cartesian3.fromRadians(
												point1GeoPosition.longitude,
												point1GeoPosition.latitude,
												point2GeoPosition.height
											)
										]
										labelHeight =
											point1GeoPosition.height +
											(point2GeoPosition.height -
												point1GeoPosition.height)
										/* circle.position = point1.position
                    circle.ellipse.height = point2GeoPosition.height */
									} else {
										plPositions = [
											point2.position,
											new Cesium.Cartesian3.fromRadians(
												point2GeoPosition.longitude,
												point2GeoPosition.latitude,
												point1GeoPosition.height
											)
										]

										/* circle.position = point2.position
                    circle.ellipse.height = point1GeoPosition.height */
										labelHeight =
											point2GeoPosition.height +
											(point1GeoPosition.height -
												point2GeoPosition.height)
									}
									polyline.positions = plPositions
									addDistanceLabel(
										point1,
										point2,
										labelHeight,
										point2GeoPosition,
										point1GeoPosition,
										verticalLabel
									)
								}, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
							} // add second point and lines
							else if (!points.contains(point3)) {
								handler2 &&
									(handler2.removeInputAction(
										Cesium.ScreenSpaceEventType.MOUSE_MOVE
									),
									handler2.destroy(),
									(handler2 = null))
								points.remove(point2)
								point3 = points.add({
									position: cartesian,
									color: Cesium.Color.RED
								})
								point3GeoPosition = Cesium.Cartographic.fromCartesian(
									point3.position
								)
								let labelHeight
								if (
									point3GeoPosition.height >= point1GeoPosition.height
								) {
									plPositions = [
										point1.position,
										new Cesium.Cartesian3.fromRadians(
											point1GeoPosition.longitude,
											point1GeoPosition.latitude,
											point3GeoPosition.height
										)
									]

									circle.position = point1.position
									circle.ellipse.height = point3GeoPosition.height
									circle.ellipse.show = true

									labelHeight =
										point1GeoPosition.height +
										(point3GeoPosition.height -
											point1GeoPosition.height)
								} else {
									plPositions = [
										point3.position,
										new Cesium.Cartesian3.fromRadians(
											point3GeoPosition.longitude,
											point3GeoPosition.latitude,
											point1GeoPosition.height
										)
									]

									circle.position = point3.position
									circle.ellipse.height = point1GeoPosition.height
									circle.ellipse.show = true

									labelHeight =
										point3GeoPosition.height +
										(point1GeoPosition.height -
											point3GeoPosition.height)
								}
								polyline.positions = plPositions
								addDistanceLabel(
									point1,
									point3,
									labelHeight,
									point3GeoPosition,
									point1GeoPosition,
									verticalLabel
								)
							}
						}
					}
				}, Cesium.ScreenSpaceEventType.LEFT_CLICK)
			}
			function addDistanceLabel(p1, p2, height, p1Geo, p2Geo, verticalLabel) {
				p1.cartographic = ellipsoid.cartesianToCartographic(p1.position)
				p2.cartographic = ellipsoid.cartesianToCartographic(p2.position)
				/* 
        point1.longitude = parseFloat(Cesium.Math.toDegrees(point1.position.x))
        point1.latitude = parseFloat(Cesium.Math.toDegrees(point1.position.y))
        point3.longitude = parseFloat(Cesium.Math.toDegrees(point3.position.x))
        point3.latitude = parseFloat(Cesium.Math.toDegrees(point3.position.y))
         */
				verticalLabel.label.text = getVerticalDistanceString(p1Geo, p2Geo)
				if (p2Geo.height >= p1Geo.height) {
					verticalLabel.position = getLabelPosition(p2, p2, height)
				} else {
					verticalLabel.position = getLabelPosition(p1, p1, height)
				}
			}
			// 设置label文字
			function getVerticalDistanceString(p1Geo, p2Geo) {
				var heights = [p1Geo.height, p2Geo.height]
				const METERS =
					Math.max.apply(Math, heights) - Math.min.apply(Math, heights)
				if (METERS >= 1000) {
					return `高度差：${(METERS / 1000).toFixed(2)} км`
				}
				return `高度差：${METERS.toFixed(2)} м`
			}

			function getLabelPosition(p1, p2, height) {
				var scratch = new Cesium.Cartographic()
				geodesic.setEndPoints(p1.cartographic, p2.cartographic)
				var midpointCartographic = geodesic.interpolateUsingFraction(0.5, scratch)
				return Cesium.Cartesian3.fromRadians(
					midpointCartographic.longitude,
					midpointCartographic.latitude,
					height + 10
				)
			}
			/**
			 * 获取输入事件的位置
			 * @param {Object} position 输入事件对象中的position
			 * @return {Cartesian3} 输入事件的位置
			 **/
			function getMouseEventPosition(position) {
				let cartesian = null
				const pickedObject = scene.pick(position)
				if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
					cartesian = scene.pickPosition(position)
				} else {
					let ray = camera.getPickRay(position)
					cartesian = globe.pick(ray, scene)
				}
				return cartesian
			}
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

.contorler {
	position: absolute;
	z-index: 1000;
}

.contorler button {
	background: rgb(25, 190, 107);
	color: #fff;
	outline: none;
	border: 1px solid rgb(19, 138, 78);
	padding: 6px 12px;
	cursor: pointer;
	border-radius: 4px;
}
</style>
