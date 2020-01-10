// 设置为私有方法
const [
	getVerticalDistanceString,
	getEventInputPosition,
	addDistanceLabel,
	getLabelPosition,
	getDistanceString,
	getHorizontalDistanceString
] = [
	Symbol('getVerticalDistanceString'),
	Symbol('getEventInputPosition'),
	Symbol('addDistanceLabel'),
	Symbol('getLabelPosition'),
	Symbol('getDistanceString'),
	Symbol('getHorizontalDistanceString')
]
class CesiumTool {
	constructor(Cesium, viewer) {
		if (!Cesium) {
			throw new Error(
				'Cesium is not define in cesiumTool.（实例化CesiumTool的时候没有定义Cesium类）'
			)
		}
		if (!viewer) {
			throw new Error(
				'viewer is not define in cesiumTool.（实例化CesiumTool的时候没有定义viewer实例）'
			)
		}
		this.Cesium = Cesium
		this.viewer = viewer
	}
	/* default label */
	get label() {
		return {
			font: '14px monospace',
			showBackground: true,
			horizontalOrigin: this.Cesium.HorizontalOrigin.CENTER,
			verticalOrigin: this.Cesium.VerticalOrigin.CENTER,
			pixelOffset: new this.Cesium.Cartesian2(0, 0),
			eyeOffset: new this.Cesium.Cartesian3(0, 0, -50),
			fillColor: this.Cesium.Color.WHITE
		}
	}
	/**
	 * 获取输入事件的位置
	 * @param {Object} position 输入事件对象中的position
	 * @return {Cartesian3} 输入事件的位置
	 **/
	handelMeasure() {
		const handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
		const polylines = this.viewer.scene.primitives.add(
			new this.Cesium.PolylineCollection()
		)
		const points = this.viewer.scene.primitives.add(
			new this.Cesium.PointPrimitiveCollection()
		)

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
							label: this.label
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
								'measureheight',
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
							'measureheight',
							point3GeoPosition,
							point1GeoPosition,
							verticalLabel
						)
					}
				}
			}
		}, this.Cesium.ScreenSpaceEventType.LEFT_CLICK)
	}
	startTriangulation() {
		let handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
		let points = this.viewer.scene.primitives.add(
			new this.Cesium.PointPrimitiveCollection()
		)
		let polylines = this.viewer.scene.primitives.add(
			new this.Cesium.PolylineCollection()
		)
		let point1,
			point2,
			point1GeoPosition,
			point2GeoPosition,
			polyline1,
			polyline2,
			polyline3,
			distanceLabel,
			verticalLabel,
			horizontalLabel

		let circle = this.viewer.entities.add({
			ellipse: {
				material: this.Cesium.Color.WHITE.withAlpha(0.3),
				show: false,
				semiMinorAxis: 50,
				semiMajorAxis: 50
			}
		})
		handler.setInputAction(({ position }) => {
			if (this.viewer.scene.mode !== this.Cesium.SceneMode.MORPHING) {
				let cartesian = this[getEventInputPosition](position)
				if (this.Cesium.defined(cartesian)) {
					if (points.length === 2) {
						points.removeAll()
						polylines.removeAll()
						this.viewer.entities.remove(distanceLabel)
						this.viewer.entities.remove(horizontalLabel)
						this.viewer.entities.remove(verticalLabel)
					}
					//add first point
					if (points.length === 0) {
						circle.show = false
						point1 = points.add({
							position: cartesian,
							color: this.Cesium.Color.RED
						})
					} // add second point and lines
					else if (points.length === 1) {
						circle.show = true
						point2 = points.add({
							position: cartesian,
							color: this.Cesium.Color.RED
						})
						// 点的笛卡尔坐标转换为制图坐标。
						point1GeoPosition = this.Cesium.Cartographic.fromCartesian(
							point1.position
						)
						point2GeoPosition = this.Cesium.Cartographic.fromCartesian(
							point2.position
						)

						// 三根线的两点位置
						let pl1Positions = [point1.position, point2.position]
						let pl2Positions = []
						let pl3Positions = []
						let labelZ
						if (point2GeoPosition.height >= point1GeoPosition.height) {
							pl2Positions = [
								point2.position,
								new this.Cesium.Cartesian3.fromRadians(
									point1GeoPosition.longitude,
									point1GeoPosition.latitude,
									point2GeoPosition.height
								)
							]

							pl3Positions = [
								point1.position,
								new this.Cesium.Cartesian3.fromRadians(
									point1GeoPosition.longitude,
									point1GeoPosition.latitude,
									point2GeoPosition.height
								)
							]

							circle.position = point2.position
							circle.ellipse.height = point2GeoPosition.height
							circle.ellipse.show = true
							labelZ =
								point1GeoPosition.height +
								(point2GeoPosition.height - point1GeoPosition.height) /
									2.0
						} else {
							pl2Positions = [
								point1.position,
								new this.Cesium.Cartesian3.fromRadians(
									point2GeoPosition.longitude,
									point2GeoPosition.latitude,
									point1GeoPosition.height
								)
							]
							pl3Positions = [
								point2.position,
								new this.Cesium.Cartesian3.fromRadians(
									point2GeoPosition.longitude,
									point2GeoPosition.latitude,
									point1GeoPosition.height
								)
							]

							circle.position = point1.position
							circle.ellipse.height = point1GeoPosition.height
							circle.ellipse.show = true
							labelZ =
								point2GeoPosition.height +
								(point1GeoPosition.height - point2GeoPosition.height) /
									2.0
						}

						polyline1 = polylines.add({
							show: true,
							positions: pl1Positions,
							width: 2,
							material: new this.Cesium.Material({
								fabric: {
									type: 'Color',
									uniforms: {
										color: this.Cesium.Color.BURLYWOOD
									}
								}
							})
						})
						polyline2 = polylines.add({
							show: true,
							positions: pl2Positions,
							width: 1,
							material: new this.Cesium.Material({
								fabric: {
									type: 'PolylineDash',
									uniforms: {
										color: this.Cesium.Color.BURLYWOOD
									}
								}
							})
						})
						polyline3 = polylines.add({
							show: true,
							positions: pl3Positions,
							width: 1,
							material: new this.Cesium.Material({
								fabric: {
									type: 'PolylineDash',
									uniforms: {
										color: this.Cesium.Color.BURLYWOOD
									}
								}
							})
						})

						verticalLabel = this.viewer.entities.add({
							label: this.label
						})
						horizontalLabel = this.viewer.entities.add({
							label: this.label
						})
						distanceLabel = this.viewer.entities.add({
							label: this.label
						})
						this[addDistanceLabel](
							point1,
							point2,
							labelZ,
							'triangulation',
							point1GeoPosition,
							point2GeoPosition,
							verticalLabel,
							horizontalLabel,
							distanceLabel
						)
					}
				}
			}
		}, this.Cesium.ScreenSpaceEventType.LEFT_CLICK)
	}

	[addDistanceLabel](
		p1,
		p2,
		height,
		type,
		point1GeoPosition,
		point2GeoPosition,
		verticalLabel,
		horizontalLabel,
		distanceLabel
	) {
		const ellipsoid = this.Cesium.Ellipsoid.WGS84
		p1.cartographic = ellipsoid.cartesianToCartographic(p1.position)
		p2.cartographic = ellipsoid.cartesianToCartographic(p2.position)
		verticalLabel.label.text = this[getVerticalDistanceString](
			point1GeoPosition,
			point2GeoPosition
		)

		if (type === 'measureheight') {
			if (point2GeoPosition.height >= point1GeoPosition.height) {
				verticalLabel.position = this[getLabelPosition](p2, p2, height)
			} else {
				verticalLabel.position = this[getLabelPosition](p1, p1, height)
			}
			return
		}

		if (type === 'triangulation') {
			distanceLabel.label.text = this[getDistanceString](
				p1,
				p2,
				point1GeoPosition,
				point2GeoPosition
			)
			horizontalLabel.label.text = this[getHorizontalDistanceString](p1, p2)
			distanceLabel.position = this[getLabelPosition](p1, p2, height)
			if (point2GeoPosition.height >= point1GeoPosition.height) {
				verticalLabel.position = this[getLabelPosition](p1, p1, height)
				horizontalLabel.position = this[getLabelPosition](
					p2,
					p1,
					point2GeoPosition.height
				)
			} else {
				verticalLabel.position = this[getLabelPosition](p2, p2, height)
				horizontalLabel.position = this[getLabelPosition](
					p1,
					p2,
					point1GeoPosition.height
				)
			}
		}
	}

	[getHorizontalDistanceString](p1, p2) {
		const geodesic = new this.Cesium.EllipsoidGeodesic()
		// 设置测地线的起点和终点
		geodesic.setEndPoints(p1.cartographic, p2.cartographic)
		// 获取起点和终点之间的表面距离
		const meters = geodesic.surfaceDistance.toFixed(2)
		if (meters >= 1000) {
			return (meters / 1000).toFixed(2) + ' км'
		}
		return meters + ' м'
	}

	[getDistanceString](point1, point2, point1GeoPosition, point2GeoPosition) {
		const geodesic = new this.Cesium.EllipsoidGeodesic()
		geodesic.setEndPoints(point1.cartographic, point2.cartographic)
		const horizontalMeters = geodesic.surfaceDistance.toFixed(2)
		const heights = [point1GeoPosition.height, point2GeoPosition.height]
		const verticalMeters =
			Math.max.apply(Math, heights) - Math.min.apply(Math, heights)
		const meters = Math.pow(
			Math.pow(horizontalMeters, 2) + Math.pow(verticalMeters, 2),
			0.5
		)
		if (meters >= 1000) {
			return (meters / 1000).toFixed(2) + ' км'
		}
		return meters.toFixed(2) + ' м'
	}
	// 设置垂直label文字
	[getVerticalDistanceString](p1Geo, p2Geo) {
		const heights = [p1Geo.height, p2Geo.height]
		const METERS = Math.max.apply(Math, heights) - Math.min.apply(Math, heights)
		if (METERS >= 1000) {
			return `${(METERS / 1000).toFixed(2)} км`
		}
		return `${METERS.toFixed(2)} м`
	}
	/**
	 * 获取Label的位置
	 * @return {Cartesian3} Label的位置
	 **/
	[getLabelPosition](p1, p2, height) {
		const geodesic = new this.Cesium.EllipsoidGeodesic()
		const scratch = new this.Cesium.Cartographic()
		geodesic.setEndPoints(p1.cartographic, p2.cartographic)
		const midpointCartographic = geodesic.interpolateUsingFraction(0.5, scratch)
		return this.Cesium.Cartesian3.fromRadians(
			midpointCartographic.longitude,
			midpointCartographic.latitude,
			height
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
