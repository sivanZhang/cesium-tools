// 封装私有方法
const [
	getVerticalDistanceString,
	getEventInputPosition,
	addDistanceLabel,
	getLabelPosition
] = [
	Symbol('getVerticalDistanceString'),
	Symbol('getEventInputPosition'),
	Symbol('addDistanceLabel'),
	Symbol('getLabelPosition')
]
class CesiumTool {
	constructor(Cesium, viewer) {
		if (!Cesium) {
			throw new Error('Cesium is not define in cesiumTool.（实例化CesiumTool的时候没有传Cesium类）')
		}
		if (!viewer) {
			throw new Error('viewer is not define in cesiumTool.（实例化CesiumTool的时候没有传viewer实例）')
		}
		this.Cesium = Cesium
		this.viewer = viewer
    }
    /**
	 * 获取输入事件的位置
	 * @param {Object} position 输入事件对象中的position
	 * @return {Cartesian3} 输入事件的位置
	 **/
	handelMeasure(customlabel) {
		const handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
		const polylines = this.viewer.scene.primitives.add(
			new this.Cesium.PolylineCollection()
		)
		const points = this.viewer.scene.primitives.add(
			new this.Cesium.PointPrimitiveCollection()
		)
		let label = {
			font: '14px monospace',
			showBackground: true,
			horizontalOrigin: this.Cesium.HorizontalOrigin.CENTER,
			verticalOrigin: this.Cesium.VerticalOrigin.CENTER,
			pixelOffset: new this.Cesium.Cartesian2(0, 0),
			eyeOffset: new this.Cesium.Cartesian3(0, 0, -50),
			fillColor: this.Cesium.Color.WHITE
		}
		label = { ...label, customlabel }
		let handler2,
			verticalLabel,
			circle,
			polyline,
			point1,
			point3,
			point2,
			point1GeoPosition,
			point3GeoPosition
		handler.setInputAction(({ position }) => {
			if (this.viewer.scene.mode !== this.Cesium.SceneMode.MORPHING) {
				let plPositions = []
				// 鼠标触发的位置的笛卡尔坐标
				const cartesian = this[getEventInputPosition](position)

				if (this.Cesium.defined(cartesian)) {
					if (points.length === 2 && points.contains(point3)) {
						points.removeAll()
						polylines.removeAll()
						this.viewer.entities.remove(verticalLabel)
						this.viewer.entities.remove(circle)
					}
					if (points.length === 0) {
						verticalLabel = this.viewer.entities.add({
							label: label
						})
						circle = this.viewer.entities.add({
							ellipse: {
								material: this.Cesium.Color.WHITE.withAlpha(0.3),
								show: false,
								semiMinorAxis: 50,
								semiMajorAxis: 50
							}
						})
						polyline = polylines.add({
							show: false,
							width: 2,
							material: new this.Cesium.Material({
								fabric: {
									type: 'Color',
									uniforms: {
										color: this.Cesium.Color.fromBytes(210, 225, 100)
									}
								}
							})
						})
						point1 = points.add({
							position: cartesian,
							color: this.Cesium.Color.RED
						})
						point2 = points.add({
							color: this.Cesium.Color.RED
						})
						point1GeoPosition = this.Cesium.Cartographic.fromCartesian(
							cartesian
						)
						polyline.show = true
						circle.ellipse.show = true

						handler2 = new this.Cesium.ScreenSpaceEventHandler(
							this.viewer.scene.canvas
						)
						handler2.setInputAction(({ endPosition }) => {
							const hoverCartesian = this[getEventInputPosition](
								endPosition
							)
							const point2GeoPosition = this.Cesium.Cartographic.fromCartesian(
								hoverCartesian
							)
							point2.position = hoverCartesian
							let labelHeight
							if (point2GeoPosition.height >= point1GeoPosition.height) {
								plPositions = [
									point1.position,
									new this.Cesium.Cartesian3.fromRadians(
										point1GeoPosition.longitude,
										point1GeoPosition.latitude,
										point2GeoPosition.height
									)
								]
								labelHeight =
									point1GeoPosition.height +
									(point2GeoPosition.height - point1GeoPosition.height)
							} else {
								plPositions = [
									point2.position,
									new this.Cesium.Cartesian3.fromRadians(
										point2GeoPosition.longitude,
										point2GeoPosition.latitude,
										point1GeoPosition.height
									)
								]
								labelHeight =
									point2GeoPosition.height +
									(point1GeoPosition.height - point2GeoPosition.height)
							}
							polyline.positions = plPositions
							this[addDistanceLabel](
								point1,
								point2,
								labelHeight,
								point2GeoPosition,
								point1GeoPosition,
								verticalLabel
							)
						}, this.Cesium.ScreenSpaceEventType.MOUSE_MOVE)
					} // add second point and lines
					else if (!points.contains(point3)) {
						handler2 &&
							(handler2.removeInputAction(
								this.Cesium.ScreenSpaceEventType.MOUSE_MOVE
							),
							handler2.destroy(),
							(handler2 = null))
						points.remove(point2)
						point3 = points.add({
							position: cartesian,
							color: this.Cesium.Color.RED
						})
						point3GeoPosition = this.Cesium.Cartographic.fromCartesian(
							point3.position
						)
						let labelHeight
						if (point3GeoPosition.height >= point1GeoPosition.height) {
							plPositions = [
								point1.position,
								new this.Cesium.Cartesian3.fromRadians(
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
								(point3GeoPosition.height - point1GeoPosition.height)
						} else {
							plPositions = [
								point3.position,
								new this.Cesium.Cartesian3.fromRadians(
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
								(point1GeoPosition.height - point3GeoPosition.height)
						}
						polyline.positions = plPositions
						this[addDistanceLabel](
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
		}, this.Cesium.ScreenSpaceEventType.LEFT_CLICK)
	}
	[addDistanceLabel](p1, p2, height, p1Geo, p2Geo, verticalLabel) {
		const ellipsoid = this.Cesium.Ellipsoid.WGS84
		p1.cartographic = ellipsoid.cartesianToCartographic(p1.position)
		p2.cartographic = ellipsoid.cartesianToCartographic(p2.position)
		verticalLabel.label.text = this[getVerticalDistanceString](p1Geo, p2Geo)
		if (p2Geo.height >= p1Geo.height) {
			verticalLabel.position = this[getLabelPosition](p2, p2, height)
		} else {
			verticalLabel.position = this[getLabelPosition](p1, p1, height)
		}
	}
	// 设置label文字
	[getVerticalDistanceString](p1Geo, p2Geo) {
		const heights = [p1Geo.height, p2Geo.height]
		const METERS = Math.max.apply(Math, heights) - Math.min.apply(Math, heights)
		if (METERS >= 1000) {
			return `高度差：${(METERS / 1000).toFixed(2)} км`
		}
		return `高度差：${METERS.toFixed(2)} м`
	}

	[getLabelPosition](p1, p2, height) {
		const geodesic = new this.Cesium.EllipsoidGeodesic()
		const scratch = new this.Cesium.Cartographic()
		geodesic.setEndPoints(p1.cartographic, p2.cartographic)
		const midpointCartographic = geodesic.interpolateUsingFraction(0.5, scratch)
		return this.Cesium.Cartesian3.fromRadians(
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
	[getEventInputPosition](position) {
		let cartesian = null
		const pickedObject = this.viewer.scene.pick(position)
		if (
			this.viewer.scene.pickPositionSupported &&
			this.Cesium.defined(pickedObject)
		) {
			cartesian = this.viewer.scene.pickPosition(position)
		} else {
			let ray = this.viewer.camera.getPickRay(position)
			cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene)
		}
		return cartesian
	}
}
export default CesiumTool
