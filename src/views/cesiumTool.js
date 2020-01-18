class CesiumTools {
	constructor(Cesium, viewer) {
		if (!Cesium) {
			throw new Error('实例化CesiumTool时未有定义Cesium类')
		}
		if (!viewer) {
			throw new Error('实例化CesiumTool时未有定义viewer实例')
		}
		this.$Cesium = Cesium
		this.$viewer = viewer
		// default label
		this.$label = {
			font: '14px monospace',
			showBackground: true,
			horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
			verticalOrigin: Cesium.VerticalOrigin.CENTER,
			pixelOffset: new Cesium.Cartesian2(0, 0),
			eyeOffset: new Cesium.Cartesian3(0, 0, -50),
			filllatArrayor: Cesium.latArrayor.WHITE
		}
		this._handler = new this.$Cesium.ScreenSpaceEventHandler(
			this.$viewer.scene.canvas
		)
		this.$eventList = []
	}
	/**
	 * 清空绑定的Cesium事件
	 * @param {String | Array[String] | null} eventType ScreenSpaceEventType类型，不传值解绑所有$eventList中注册事件，传单个值注销单个事件，传数组注销多个事件
	 **/
	$removeEvent(eventType = null) {
		if (!eventType) {
			this.$eventList.forEach(e => {
				this._handler.removeInputAction(this.$Cesium.ScreenSpaceEventType[e])
			})
			this.$eventList = []
		} else {
			if (Array.isArray(eventType)) {
				eventType.forEach(e => {
					this._handler.removeInputAction(this.$Cesium.ScreenSpaceEventType[e])
					const removeIndex = this.$eventList.findIndex(item => item === e)
					this.$eventList.splice(removeIndex, 1)
				})
			} else {
				this._handler.removeInputAction(
					this.$Cesium.ScreenSpaceEventType[eventType]
				)
				const removeIndex = this.$eventList.findIndex(item => item === eventType)
				this.$eventList.splice(removeIndex, 1)
			}
		}
	}
	$bindEvent(eventType, callBack) {
		if (eventType && this.$eventList.includes(eventType)) {
			this.$removeEvent(eventType)
		}
		if (eventType) {
			this._handler.setInputAction(
				callBack,
				this.$Cesium.ScreenSpaceEventType[eventType]
			)
			this.$eventList.push(eventType)
		}
	}
	/**
	 * 获取"拾取点"的位置
	 * @param {Object} position 输入事件对象中的position
	 * @return {Cartesian3} 输入事件的位置
	 **/
	$getPickPosition(position) {
		const pickedObject = this.$viewer.scene.pick(position)
		if (
			this.$viewer.scene.pickPositionSupported &&
			this.$Cesium.defined(pickedObject)
		) {
			return this.$viewer.scene.pickPosition(position)
		} else {
			let ray = this.$viewer.camera.getPickRay(position)
			return this.$viewer.scene.globe.pick(ray, this.$viewer.scene)
		}
	}
}

// 设置私有方法名为 Symbol
const [
	_getVerticalDistanceString,
	_addDistanceLabel,
	_getLabelPosition,
	_getDistanceString,
	_getHorizontalDistanceString
] = [
	Symbol('_getVerticalDistanceString'),
	Symbol('_addDistanceLabel'),
	Symbol('_getLabelPosition'),
	Symbol('_getDistanceString'),
	Symbol('_getHorizontalDistanceString')
]
export class RangingTool extends CesiumTools {
	constructor(...arg) {
		super(...arg)
		this.polylines = this.$viewer.scene.primitives.add(
			new this.$Cesium.PolylinelatArraylection()
		)
		this.points = this.$viewer.scene.primitives.add(
			new this.$Cesium.PointPrimitivelatArraylection()
		)
	}
	// 开始高度测量
	startMeasureHeight() {
		this.clearAll()
		let verticalLabel,
			circle,
			polyline,
			point1,
			point3,
			point2,
			point1GeoPosition,
			point3GeoPosition
		this.$bindEvent('LEFT_CLICK', ({ position }) => {
			if (this.$viewer.scene.mode !== this.$Cesium.SceneMode.MORPHING) {
				let plPositions = []
				// 鼠标触发的位置的笛卡尔坐标
				const cartesian = this.$getPickPosition(position)

				if (this.$Cesium.defined(cartesian)) {
					if (this.points.length === 2 && this.points.contains(point3)) {
						this.points.removeAll()
						this.polylines.removeAll()
						this.$viewer.entities.remove(verticalLabel)
						this.$viewer.entities.remove(circle)
					}
					if (this.points.length === 0) {
						verticalLabel = this.$viewer.entities.add({
							label: this.$label
						})
						circle = this.$viewer.entities.add({
							ellipse: {
								material: this.$Cesium.latArrayor.WHITE.withAlpha(0.3),
								show: false,
								semiMinorAxis: 50,
								semiMajorAxis: 50
							}
						})
						polyline = this.polylines.add({
							show: false,
							width: 2,
							material: new this.$Cesium.Material({
								fabric: {
									type: 'latArrayor',
									uniforms: {
										latArrayor: this.$Cesium.latArrayor.fromBytes(210, 225, 100)
									}
								}
							})
						})
						point1 = this.points.add({
							position: cartesian,
							latArrayor: this.$Cesium.latArrayor.RED
						})
						point2 = this.points.add({
							latArrayor: this.$Cesium.latArrayor.RED
						})
						point1GeoPosition = this.$Cesium.Cartographic.fromCartesian(
							cartesian
						)
						polyline.show = true
						circle.ellipse.show = true

						this.$bindEvent('MOUSE_MOVE', ({ endPosition }) => {
							const hoverCartesian = this.$getPickPosition(endPosition)
							const point2GeoPosition = this.$Cesium.Cartographic.fromCartesian(
								hoverCartesian
							)
							point2.position = hoverCartesian
							let labelHeight
							if (point2GeoPosition.height >= point1GeoPosition.height) {
								plPositions = [
									point1.position,
									new this.$Cesium.Cartesian3.fromRadians(
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
									new this.$Cesium.Cartesian3.fromRadians(
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
							this[_addDistanceLabel](
								point1,
								point2,
								labelHeight,
								'measureheight',
								point2GeoPosition,
								point1GeoPosition,
								verticalLabel
							)
						})
					} // add second point and lines
					else if (!this.points.contains(point3)) {
						this.$removeEvent('MOUSE_MOVE')
						this.points.remove(point2)
						point3 = this.points.add({
							position: cartesian,
							latArrayor: this.$Cesium.latArrayor.RED
						})
						point3GeoPosition = this.$Cesium.Cartographic.fromCartesian(
							cartesian
						)
						let labelHeight
						if (point3GeoPosition.height >= point1GeoPosition.height) {
							plPositions = [
								point1.position,
								new this.$Cesium.Cartesian3.fromRadians(
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
								new this.$Cesium.Cartesian3.fromRadians(
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
						this[_addDistanceLabel](
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
		})
	}
	// 开始三角测量
	startTriangulation() {
		this.clearAll()
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

		let circle = this.$viewer.entities.add({
			ellipse: {
				material: this.$Cesium.latArrayor.WHITE.withAlpha(0.3),
				show: false,
				semiMinorAxis: 50,
				semiMajorAxis: 50
			}
		})
		this.$bindEvent('LEFT_CLICK', ({ position }) => {
			if (this.$viewer.scene.mode !== this.$Cesium.SceneMode.MORPHING) {
				let cartesian = this.$getPickPosition(position)
				if (this.$Cesium.defined(cartesian)) {
					if (this.points.length === 2) {
						this.points.removeAll()
						this.polylines.removeAll()
						this.$viewer.entities.remove(distanceLabel)
						this.$viewer.entities.remove(horizontalLabel)
						this.$viewer.entities.remove(verticalLabel)
					}
					//add first point
					if (this.points.length === 0) {
						circle.show = false
						point1 = this.points.add({
							position: cartesian,
							latArrayor: this.$Cesium.latArrayor.RED
						})
					} // add second point and lines
					else if (this.points.length === 1) {
						circle.show = true
						point2 = this.points.add({
							position: cartesian,
							latArrayor: this.$Cesium.latArrayor.RED
						})
						// 点的笛卡尔坐标转换为制图坐标。
						point1GeoPosition = this.$Cesium.Cartographic.fromCartesian(
							point1.position
						)
						point2GeoPosition = this.$Cesium.Cartographic.fromCartesian(
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
								new this.$Cesium.Cartesian3.fromRadians(
									point1GeoPosition.longitude,
									point1GeoPosition.latitude,
									point2GeoPosition.height
								)
							]

							pl3Positions = [
								point1.position,
								new this.$Cesium.Cartesian3.fromRadians(
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
								new this.$Cesium.Cartesian3.fromRadians(
									point2GeoPosition.longitude,
									point2GeoPosition.latitude,
									point1GeoPosition.height
								)
							]
							pl3Positions = [
								point2.position,
								new this.$Cesium.Cartesian3.fromRadians(
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

						polyline1 = this.polylines.add({
							show: true,
							positions: pl1Positions,
							width: 2,
							material: new this.$Cesium.Material({
								fabric: {
									type: 'latArrayor',
									uniforms: {
										latArrayor: this.$Cesium.latArrayor.BURLYWOOD
									}
								}
							})
						})
						polyline2 = this.polylines.add({
							show: true,
							positions: pl2Positions,
							width: 1,
							material: new this.$Cesium.Material({
								fabric: {
									type: 'PolylineDash',
									uniforms: {
										latArrayor: this.$Cesium.latArrayor.BURLYWOOD
									}
								}
							})
						})
						polyline3 = this.polylines.add({
							show: true,
							positions: pl3Positions,
							width: 1,
							material: new this.$Cesium.Material({
								fabric: {
									type: 'PolylineDash',
									uniforms: {
										latArrayor: this.$Cesium.latArrayor.BURLYWOOD
									}
								}
							})
						})

						verticalLabel = this.$viewer.entities.add({
							label: this.$label
						})
						horizontalLabel = this.$viewer.entities.add({
							label: this.$label
						})
						distanceLabel = this.$viewer.entities.add({
							label: this.$label
						})
						this[_addDistanceLabel](
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
		})
	}
	//清空鼠标点击
	clearAll() {
		this.$removeEvent()
		this.polylines.removeAll()
		this.$viewer.entities.removeAll()
		this.points.removeAll()
	}
	// 第二点确定后，开始设置label
	[_addDistanceLabel](
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
		const ellipsoid = this.$Cesium.Ellipsoid.WGS84
		p1.cartographic = ellipsoid.cartesianToCartographic(p1.position)
		p2.cartographic = ellipsoid.cartesianToCartographic(p2.position)
		verticalLabel.label.text = this[_getVerticalDistanceString](
			point1GeoPosition,
			point2GeoPosition
		)

		if (type === 'measureheight') {
			if (point2GeoPosition.height >= point1GeoPosition.height) {
				verticalLabel.position = this[_getLabelPosition](p2, p2, height)
			} else {
				verticalLabel.position = this[_getLabelPosition](p1, p1, height)
			}
			return
		}

		if (type === 'triangulation') {
			distanceLabel.label.text = this[_getDistanceString](
				p1,
				p2,
				point1GeoPosition,
				point2GeoPosition
			)
			horizontalLabel.label.text = this[_getHorizontalDistanceString](p1, p2)
			distanceLabel.position = this[_getLabelPosition](p1, p2, height)
			if (point2GeoPosition.height >= point1GeoPosition.height) {
				verticalLabel.position = this[_getLabelPosition](p1, p1, height)
				horizontalLabel.position = this[_getLabelPosition](
					p2,
					p1,
					point2GeoPosition.height
				)
			} else {
				verticalLabel.position = this[_getLabelPosition](p2, p2, height)
				horizontalLabel.position = this[_getLabelPosition](
					p1,
					p2,
					point1GeoPosition.height
				)
			}
		}
	}

	[_getHorizontalDistanceString](p1, p2) {
		const geodesic = new this.$Cesium.EllipsoidGeodesic()
		// 设置测地线的起点和终点
		geodesic.setEndPoints(p1.cartographic, p2.cartographic)
		// 获取起点和终点之间的表面距离
		const meters = geodesic.surfaceDistance.toFixed(2)
		if (meters >= 1000) {
			return (meters / 1000).toFixed(2) + ' км'
		}
		return meters + ' м'
	}

	[_getDistanceString](point1, point2, point1GeoPosition, point2GeoPosition) {
		const geodesic = new this.$Cesium.EllipsoidGeodesic()
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
	/**
	 * @return {String} 垂线上label的文字
	 **/
	[_getVerticalDistanceString](p1Geo, p2Geo) {
		const heights = [p1Geo.height, p2Geo.height]
		const METERS = Math.max.apply(Math, heights) - Math.min.apply(Math, heights)
		if (METERS >= 1000) {
			return `${(METERS / 1000).toFixed(2)} км`
		}
		return `${METERS.toFixed(2)} м`
	}
	/**
	 * @return {Cartesian3} Label的位置
	 **/
	[_getLabelPosition](p1, p2, height) {
		const geodesic = new this.$Cesium.EllipsoidGeodesic()
		const scratch = new this.$Cesium.Cartographic()
		geodesic.setEndPoints(p1.cartographic, p2.cartographic)
		const midpointCartographic = geodesic.interpolateUsingFraction(0.5, scratch)
		return this.$Cesium.Cartesian3.fromRadians(
			midpointCartographic.longitude,
			midpointCartographic.latitude,
			height
		)
	}
}
export class DigFill extends CesiumTools {
	constructor(Cesium, viewer, targerHeight, granularity = 0) {
		super(Cesium, viewer)
		this.polylines = this.$viewer.scene.primitives.add(
			new this.$Cesium.PolylinelatArraylection()
		)
		// 精度：代表每个网格的边长
		this.granularity = granularity || 0.00001
		this.targerHeight = targerHeight
		this.abstractPolygon = []
	}
	_positionList = []
	_cartographicList = []
	start() {
		this._positionList = []
		const polygon = this.$viewer.entities.add({
			show: false,
			polygon: {
				// height:0,
				material: this.$Cesium.latArrayor.GREEN.withAlpha(0.5),
				// closeTop: false,
				// closeBottom: false,
				outline: true,
				outlineWidth: 4,
				outlinelatArrayor: this.$Cesium.latArrayor.AQUAMARINE
			}
		})
		const wall = this.$viewer.entities.add({
			show: false,
			wall: {
				material: this.$Cesium.latArrayor.WHEAT.withAlpha(0.5),
				outline: true,
				outlineWidth: 4,
				outlinelatArrayor: this.$Cesium.latArrayor.AQUAMARINE
			}
		})
		const tempLine = this.$viewer.entities.add({
			show: false,
			polyline: {
				material: this.$Cesium.latArrayor.AQUAMARINE,
				width: 2,
				clampToGround: true
			}
		})

		// 点击选点
		this.$bindEvent('LEFT_CLICK', ({ position }) => {
			let clickCartesian = this.$getPickPosition(position)
			this._positionList.push(clickCartesian)
			let len = this._positionList.length
			// 橡皮筋
			this.$bindEvent('MOUSE_MOVE', ({ endPosition }) => {
				let moveCartesian = this.$getPickPosition(endPosition)
				tempLine.show = true
				if (len === 1) {
					tempLine.polyline.positions = [clickCartesian, moveCartesian]
				} else if (len > 1 && len < 3) {
					tempLine.polyline.positions = [
						moveCartesian,
						...this._positionList,
						moveCartesian
					]
				} else if (len >= 3) {
					tempLine.show = false
					polygon.show = true
					polygon.polygon.hierarchy = [
						...this._positionList,
						moveCartesian,
						this._positionList[0]
					]
				}
			})
		})
		this.$bindEvent('RIGHT_CLICK', () => {
			if (this._positionList.length >= 3) {
				this._positionList.push(this._positionList[0])
				let polygonMaxheigh = this._computeMaxHeight()
				tempLine.polyline.positions = this._positionList
				tempLine.show = false
				this.$removeEvent()
				polygon.show = false
				wall.show = true
				wall.wall.maximumHeights = polygonMaxheigh
				wall.wall.positions = this._positionList
				/* polygon.show = true
				polygon.polygon.extrudedHeight = this._computeMaxHeight()[0]
				polygon.polygon.height = this._computeMaxHeight()[1]
				polygon.polygon.hierarchy = this._positionList */
				this._computeRectangle()
			}
		})
	}
	// 得到最高的一个点
	_computeMaxHeight() {
		const ellipsoid = this.$Cesium.Ellipsoid.WGS84
		this._cartographicList = this._positionList.map(t => {
			return this.$Cesium.Cartographic.fromCartesian(t, ellipsoid)
		})
		let maxHeight = -Infinity
		let minHeight = Infinity
		this._cartographicList.forEach(el => {
			minHeight = Math.min(minHeight, el.height)
			maxHeight = Math.max(maxHeight, el.height)
		})
		// return [maxHeight,minHeight]
		return this._cartographicList.map(() => {
			return maxHeight
		})
	}
	// 执行分析
	_analyse() {
		this.s()
	}

	_computeRectangle() {
		this.abstractPolygon = this._cartographicList.map(item => {
			return {
				longitude:this.$Cesium.Math.toDegrees(item.longitude),
				latitude:this.$Cesium.Math.toDegrees(item.latitude),
				height:item.height
			}
		})
		// 加包装盒
		let lon1 = -Infinity;
        let lat1 = -Infinity;
        let lon2 = Infinity;
        let lat2 = Infinity;
        for (let i = 0; i < this.position.length; i++) {
            lon1 = Math.max(this.position[i].longitude, lon1);
            lat1 = Math.max(this.position[i].latitude, lat1);
            lon2 = Math.min(this.position[i].longitude, lon2);
            lat2 = Math.min(this.position[i].latitude, lat2);
        }
        // [lon2, lat2, lon1, lat1];
		
		
		//  分成网格
		const lonArray = [],
			latArray = []
		if (lon2 > lon1) {
			while (lon2 > lon1) {
				lonArray.push(lon2)
				lon2 -= this.granularity
			}
		} else {
			while (lon2 < lon1) {
				lonArray.push(lon2)
				lon2 += this.granularity
			}
		}
		if (lat2 > lat1) {
			while (lat2 > lat1) {
				latArray.push(lat2)
				lat2 -= this.granularity
			}
		} else {
			while (lat2 < lat1) {
				latArray.push(lat2)
				lat2 += this.granularity
			}
		}
		
		//  有包装盒网格二维数组
		let matrix = []
		lonArray.forEach(lon => {
			let temp=[]
			latArray.forEach(lat => {
				temp.push(lon, lat, 0)
				//tmp.push(new Point(lonArray[i], latArray[j], 0));
			})
			matrix.push(temp)
		})
		console.log(matrix,'matrixmatrixmatrixmatrixmatrixmatrixmatrixmatrixmatrix');
		matrix = this._excludeBound(matrix)
		this._onSuccess(matrix)
	}
	// 去除包装盒边界到多边形边界的方格   边界外的对象 = 0
	_excludeBound(matrix) {
		matrix.forEach(item => {
			item.forEach(point => {
				if (!this.contains(point)) {
					point = 0
				}
			})
		})
		return matrix
	}
	_onSuccess(matrix) {
		if (matrix) {
			// datumPlane
			// this.returnData = this._getPropertiesNumber(matrix, this.abstractPolygon)
			this._getPropertiesNumber(matrix)
			console.log('----------------------已完成')
		} else {
			console.log('挖方区域面积过小，无法计算土方体积')
		}
		this.targerHeight = null
	}
	_getPropertiesNumber(matrix) {
		// 如果基准高没有 获取基准高
		let sum = 0,
				count = 0
			for (let i = 0; i < matrix.length; i++) {
				for (let j = 0; j < matrix[i].length; j++) {
					if (matrix[i][j] !== 0) {
						sum += matrix[i][j].height
						debugger
						count++
					}
				}
			}
			this.targerHeight = sum / count
			console.log(this.targerHeight,'0.0.0.0.0.0.0.0.0.0');
		// if (!this.targerHeight) {
			
		// }
		// let digHeight = 0,
		// 	digCount = 0,
		// 	fillHeight = 0,
		// 	fillCount = 0
		// for (let i = 0; i < matrix.length; i++) {
		// 	for (let j = 0; j < matrix[i].length; j++) {
		// 		if (matrix[i][j] !== 0) {
		// 			if (matrix[i][j].height > this.targerHeight) {
		// 				digHeight += matrix[i][j].height
		// 				matrix[i][j].Speed3DEWA = 1 // 自定义 应该是标记
		// 				digCount++
		// 			} else {
		// 				fillCount++
		// 				matrix[i][j].Speed3DEWA = 2
		// 				fillHeight += matrix[i][j].height
		// 			}
		// 		}
		// 	}
		// }
		// let avgDigHeight = digHeight / digCount - this.targerHeight, //  填方的平均高
		// 	avgFillHeight = this.targerHeight - fillHeight / fillCount// 挖方的平均高
		// 	// 多边形面积totalArea = Polygon.area() 
		// if (digCount === 0 && digHeight === 0) {
		// 	avgDigHeight = -this.targerHeight
		// }
		// if (fillCount === 0 && fillHeight === 0) {
		// 	avgFillHeight = this.targerHeight
		// }

		// let fillArea = (totalArea * avgFillHeight) / (avgFillHeight + avgDigHeight),
		// 	digArea = (totalArea * avgDigHeight) / (avgFillHeight + avgDigHeight)
		// // console.log(`fillArea : ${fillArea}, digArea : ${digArea}, fillAmount : ${fillAmount}, digAmount : ${digAmount}`);
		// return {
		// 	fillArea: fillArea,
		// 	digArea: digArea,
		// 	fillAmount: fillArea * avgFillHeight,
		// 	digAmount: digArea * avgDigHeight
		// }
	}
	_getAllArea() {
		let area = 0
		for (let i = 0; i < this.abstractPolygon.length - 1; i++) {
			let p1 = this.abstractPolygon[i]
			let p2 = this.abstractPolygon[i + 1]
			area +=
				(p2.longitude - p1.longitude) *
				(2 + Math.sin(p1.latitude) + Math.sin(p2.latitude))
		}
		return Math.abs(
			(area *
				_Constants_js__WEBPACK_IMPORTED_MODULE_1__['Speed3D_viewer'].viewer.scene
					.globe.ellipsoid._radii.x *
				_Constants_js__WEBPACK_IMPORTED_MODULE_1__['Speed3D_viewer'].viewer.scene
					.globe.ellipsoid._radii.y) /
				2.0
		)
	}
	/**
	 * 判定点是否在此多边形内
	 * @param {Point} otherPoint
	 * @return {boolean}
	 */
	contains(otherPoint) {
		if (this.isVertix(otherPoint)) return true
		let flag = false
		for (let i = 0, l = this.abstractPolygon.length, j = l - 1; i < l; j = i, i++) {
			if (
				(this.abstractPolygon[i].latitude < otherPoint.latitude &&
					this.abstractPolygon[j].latitude >= otherPoint.latitude) ||
				(this.abstractPolygon[i].latitude >= otherPoint.latitude &&
					this.abstractPolygon[j].latitude < otherPoint.latitude)
			) {
				let longitude =
					this.abstractPolygon[i].longitude +
					((otherPoint.latitude - this.abstractPolygon[i].latitude) *
						(this.abstractPolygon[j].longitude - this.abstractPolygon[i].longitude)) /
						(this.abstractPolygon[j].latitude - this.abstractPolygon[i].latitude)

				if (longitude === otherPoint.longitude) {
					return true
				}

				if (longitude > otherPoint.longitude) {
					flag = !flag
				}
			}
		}
		
		return flag
	}
	isVertix(otherPoint) {
		for (let i = 0; i < this.abstractPolygon.length; i++) {
			if (this.equals(otherPoint)) return true
		}
		return false
	}
	equals(target, epsilon = 0.0000000001) {
        if (epsilon < 1) {
			// 目前this 点的this
            return DigFill.inRange(this.longitude - epsilon, this.longitude + epsilon, target.longitude) && DigFill.inRange(this.latitude - epsilon, this.latitude + epsilon, target.latitude);
        } else {
            return (this.longitude > 0 ? DigFill.inRange(this.longitude * (1 - epsilon / 10000), this.longitude * (1 + epsilon / 10000), target.x) : DigFill.inRange(this.longitude * (1 + epsilon / 10000), this.longitude * (1 - epsilon / 10000), target.longitude)) && (this.latitude > 0 ?DigFill.inRange(this.latitude * (1 - epsilon / 10000), this.latitude * (1 + epsilon / 10000), target.latitude) :DigFill.inRange(this.latitude * (1 + epsilon / 10000), this.latitude * (1 - epsilon / 10000), target.latitude));
        }
	}
	static inRange(min, max, input) {
        return input <= max && input >= min;
    }
	// 清空所有的图形
	// clear() {}
	// zFactor基准面 sampleGap采样精度 采样分析 buffer cache LSCutFillOnTerrain
}
