import Basic from "./basic"
import PromiseChain from "./promise"

export class DigFill extends Basic {
	constructor(
		Cesium,
		viewer,
		targerHeight,
		terrainProvider,
		granularity = 0.000005
	) {
		super(Cesium, viewer)
		this.polylines = this.$viewer.scene.primitives.add(
			new this.$Cesium.PolylineCollection()
		)
		// 精度：代表每个网格的边长
		this.granularity = granularity
		this.targerHeight = targerHeight
		this.terrainProvider = terrainProvider
	}
	onFail() {
		console.log("onFail")
	}
	_cartesianList = []
	// 含高程
	_cartographicList = []
	test() {
		this.$bindEvent("LEFT_CLICK", ({ position }) => {
			let clickCartesian = this.$getPickPosition(position)
			const ellipsoid = this.$Cesium.Ellipsoid.WGS84
			const terrainProvider = this.$Cesium.createWorldTerrain()
			let cartographic = this.$Cesium.Cartographic.fromCartesian(
				clickCartesian,
				ellipsoid
			)
			let temp = []
			let arr = [cartographic, cartographic, cartographic]
			arr.forEach(t => {
				temp.push(
					this.$Cesium.Cartographic.fromRadians(
						t.longitude - 0.1,
						t.latitude - 0.1,
						0
					)
				)
				//tmp.push(new Point(lonArray[i], latArray[j], 0));
			})
			console.log("------hhhhhhhhhhh--------", arr, temp)
			var promise = this.$Cesium.sampleTerrainMostDetailed(
				terrainProvider,
				temp
			)
			this.$Cesium.when(
				promise,
				as => {
					console.log("--------------", as)
				},
				err => {
					console.error(err, "errerrerrerrerr")
				}
			)
		})
	}
	start() {
		this.$Cesium.ArcType
		this._cartesianList = []
		const polygon = this.$viewer.entities.add({
			show: false,
			polygon: {
				// height:0,
				material: this.$Cesium.Color.AQUAMARINE.withAlpha(0.6)
				// closeTop: false,
				// closeBottom: false,
			}
		})
		const wall = this.$viewer.entities.add({
			show: false,
			wall: {
				material: this.$Cesium.Color.WHEAT.withAlpha(0.5),
				outline: true,
				outlineWidth: 4,
				outlineColor: this.$Cesium.Color.AQUAMARINE
			}
		})
		const tempLine = this.$viewer.entities.add({
			polyline: {
				show: false,
				material: this.$Cesium.Color.AQUAMARINE,
				width: 2,
				clampToGround: true
			}
		})
		// 点击选点
		this.$bindEvent("LEFT_CLICK", ({ position }) => {
			let clickCartesian = this.$getPickPosition(position)
			this._cartesianList.push(clickCartesian)
			let len = this._cartesianList.length
			// 橡皮筋
			this.$bindEvent("MOUSE_MOVE", ({ endPosition }) => {
				let moveCartesian = this.$getPickPosition(endPosition)
				tempLine.polyline.show = true
				if (len === 1) {
					tempLine.polyline.positions = [
						clickCartesian,
						moveCartesian
					]
				} else if (len >= 2) {
					tempLine.polyline.show = false
					polygon.show = true
					polygon.polygon.hierarchy = [
						...this._cartesianList,
						moveCartesian,
						this._cartesianList[0]
					]
				}
			})
		})
		this.$bindEvent("RIGHT_CLICK", () => {
			if (this._cartesianList.length >= 3) {
				this._cartesianList.push(this._cartesianList[0])
				const ellipsoid = this.$Cesium.Ellipsoid.WGS84
				this._cartographicList = this._cartesianList.map(t => {
					return this.$Cesium.Cartographic.fromCartesian(t, ellipsoid)
				})
				this.$removeEvent()

				tempLine.show = false
				polygon.show = false
				wall.show = true
				let polygonMaxheigh = this._computeMaxHeight()
				wall.wall.maximumHeights = polygonMaxheigh
				wall.wall.positions = this._cartesianList

				/* polygon.show = true
				polygon.polygon.extrudedHeight = this._computeMaxHeight()[0]
				polygon.polygon.height = this._computeMaxHeight()[1]
				polygon.polygon.hierarchy = this._cartesianList */
				this._analyse()
			}
		})
	}
	// 得到最高的一个点
	_computeMaxHeight() {
		let maxHeight = -Infinity
		// let minHeight = Infinity
		this._cartographicList.forEach(el => {
			// minHeight = Math.min(minHeight, el.height)
			maxHeight = Math.max(maxHeight, el.height)
		})
		// return [maxHeight,minHeight]
		return this._cartographicList.map(() => {
			return maxHeight
		})
	}
	// 执行分析
	_analyse() {
		this._computeRectangle()
	}
	_computeRectangle() {
		// this._cartographicList = this._cartographicList.map(item => {
		// 	return {
		// 		longitude: this.$Cesium.Math.toDegrees(item.longitude),
		// 		latitude: this.$Cesium.Math.toDegrees(item.latitude),
		// 		height: item.height
		// 	}
		// })
		// 加包围盒
		let lon1 = -Infinity
		let lat1 = -Infinity
		let lon2 = Infinity
		let lat2 = Infinity
		for (let i = 0; i < this._cartographicList.length; i++) {
			lon1 = Math.max(this._cartographicList[i].longitude, lon1)
			lat1 = Math.max(this._cartographicList[i].latitude, lat1)
			lon2 = Math.min(this._cartographicList[i].longitude, lon2)
			lat2 = Math.min(this._cartographicList[i].latitude, lat2)
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

		//  有包围盒网格二维数组
		let matrix = []
		lonArray.forEach(lon => {
			let temp = []
			latArray.forEach(lat => {
				temp.push(this.$Cesium.Cartographic.fromRadians(lon, lat, 0))
				//tmp.push(new Point(lonArray[i], latArray[j], 0));
			})
			matrix.push(temp)
		})
		matrix = this._excludeBound(matrix)
		let promises = []
		const terrainProvider = this.$Cesium.createWorldTerrain()
		for (let i = 0; i < matrix.length; i++) {
			let temp = [] // matrix  变成一位数组
			for (let j = 0; j < matrix[i].length; j++) {
				if (matrix[i][j] !== 0) {
					temp.push(matrix[i][j])
				}
			} // 如果不在边界外     添加到temp

			let resolveArr = []
			if (temp.length > 0) {
				let tmpFunction = (resolve, reject) => {
					// → Promise.<Array.< Cartographic >>
					var promise = this.$Cesium.sampleTerrainMostDetailed(
						terrainProvider,
						temp
					)
					this.$Cesium.when(
						promise,
						res => {
							resolve(res)
						},
						() => {
							reject()
						}
					)
				}
				promises.push(tmpFunction)
			}
		}
		let promiseChain = new PromiseChain(
			promises,
			this._onSuccess.bind(this),
			this.onFail
		)
		promiseChain.all()
	}
	// 去除包围盒边界到多边形边界的方格   边界外的对象 = 0失败
	_excludeBound(matrix) {
		matrix.forEach(item => {
			item.forEach(point => {
				if (!this.contains(point)) {
					console.log('point = 0')
					point = 0
				}
			})
		})
		return matrix
	}
	_onSuccess(matrix) {
		if (matrix) {
			this._getPropertiesNumber(matrix)
		} else {
			console.log("挖方区域面积过小，无法计算土方体积")
		}
		this.targerHeight = null
	}
	_getPropertiesNumber(matrix) {
		if (!this.targerHeight) {
			// 如果基准高没有 获取基准高
			let sum = 0,
				count = 0
			for (let i = 0; i < matrix.length; i++) {
				for (let j = 0; j < matrix[i].length; j++) {
					if (matrix[i][j] !== 0) {
						sum += matrix[i][j].height
						count++
					}
				}
			}
			this.targerHeight = sum / count
		}
		let digHeight = 0,
			digCount = 0,
			fillHeight = 0,
			fillCount = 0
		for (let i = 0; i < matrix.length; i++) {
			for (let j = 0; j < matrix[i].length; j++) {
				if (matrix[i][j] !== 0) {
					if (matrix[i][j].height > this.targerHeight) {
						digHeight += matrix[i][j].height
						digCount++
					} else {
						fillCount++
						fillHeight += matrix[i][j].height
					}
				}
			}
		}
		let avgDigHeight = digHeight / digCount - this.targerHeight, //  填方的平均高
			avgFillHeight = this.targerHeight - fillHeight / fillCount // 挖方的平均高
		// 多边形面积totalArea = this._getAllArea()
		let totalArea = this._getAllArea()
		if (digCount === 0 && digHeight === 0) {
			avgDigHeight = -this.targerHeight
		}
		if (fillCount === 0 && fillHeight === 0) {
			avgFillHeight = this.targerHeight
		}
		let fillArea =
				(totalArea * avgFillHeight) / (avgFillHeight + avgDigHeight),
			digArea =
				(totalArea * avgDigHeight) / (avgFillHeight + avgDigHeight)

		let returns = {
			fillArea: fillArea,
			digArea: digArea,
			fillAmount: fillArea * avgFillHeight,
			digAmount: digArea * avgDigHeight
		}
		console.log("returnData", returns)
	}
	_getAllArea() {
		let area = 0
		for (let i = 0; i < this._cartographicList.length - 1; i++) {
			let p1 = this._cartographicList[i]
			let p2 = this._cartographicList[i + 1]
			area +=
				(p2.longitude - p1.longitude) *
				(2 + Math.sin(p1.latitude) + Math.sin(p2.latitude))
		}
		//获取椭球的半径。_radii
		return Math.abs(
			(area *
				this.$viewer.scene.globe.ellipsoid.radii.x *
				this.$viewer.scene.globe.ellipsoid.radii.y) /
				2.0
		)
	}
	/**
	 * 判定点是否在此多边形内
	 * @param {Point} currentPoint
	 * @return {boolean}
	 */
	contains(currentPoint) {
		if (this.isVertix(currentPoint)) return true
		let flag = false
		for (
			let i = 0, l = this._cartographicList.length, j = l - 1;
			i < l;
			j = i, i++
		) {
			if (
				(this._cartographicList[i].latitude < currentPoint.latitude &&
					this._cartographicList[j].latitude >=
						currentPoint.latitude) ||
				(this._cartographicList[i].latitude >= currentPoint.latitude &&
					this._cartographicList[j].latitude < currentPoint.latitude)
			) {
				let longitude =
					this._cartographicList[i].longitude +
					((currentPoint.latitude -
						this._cartographicList[i].latitude) *
						(this._cartographicList[j].longitude -
							this._cartographicList[i].longitude)) /
						(this._cartographicList[j].latitude -
							this._cartographicList[i].latitude)

				if (longitude === currentPoint.longitude) {
					return true
				}

				if (longitude > currentPoint.longitude) {
					flag = !flag
				}
			}
		}

		return flag
	}
	isVertix(currentPoint) {
		for (let i = 0; i < this._cartographicList.length; i++) {
			if (this.equals(currentPoint, this._cartographicList[i])){
				return true
			}	
		}
		return false
	}
	equals(currentPoint, target, epsilon = 0.00000001) {
		if (epsilon < 1) {
			return (
				DigFill.inRange(
					currentPoint.longitude - epsilon,
					currentPoint.longitude + epsilon,
					target.longitude
				) &&
				DigFill.inRange(
					currentPoint.latitude - epsilon,
					currentPoint.latitude + epsilon,
					target.latitude
				)
			)
		} else {
			return (
				(currentPoint.longitude > 0
					? DigFill.inRange(
						currentPoint.longitude * (1 - epsilon / 10000),
						currentPoint.longitude * (1 + epsilon / 10000),
							target.x
					  )
					: DigFill.inRange(
						currentPoint.longitude * (1 + epsilon / 10000),
						currentPoint.longitude * (1 - epsilon / 10000),
							target.longitude
					  )) &&
				(currentPoint.latitude > 0
					? DigFill.inRange(
						currentPoint.latitude * (1 - epsilon / 10000),
						currentPoint.latitude * (1 + epsilon / 10000),
							target.latitude
					  )
					: DigFill.inRange(
						currentPoint.latitude * (1 + epsilon / 10000),
						currentPoint.latitude * (1 - epsilon / 10000),
							target.latitude
					  ))
			)
		}
	}
	// 一样
	static inRange(min, max, input) {
		return input <= max && input >= min
	}
	// 清空所有的图形
	// clear() {}
	// zFactor基准面 sampleGap采样精度 采样分析 buffer cache LSCutFillOnTerrain
}

// 设置私有方法名为 Symbol
const [
	_getVerticalDistanceString,
	_addDistanceLabel,
	_getLabelPosition,
	_getDistanceString,
	_getHorizontalDistanceString
] = [
	Symbol("_getVerticalDistanceString"),
	Symbol("_addDistanceLabel"),
	Symbol("_getLabelPosition"),
	Symbol("_getDistanceString"),
	Symbol("_getHorizontalDistanceString")
]
export class RangingTool extends Basic {
	constructor(...arg) {
		super(...arg)
		this.polylines = this.$viewer.scene.primitives.add(
			new this.$Cesium.PolylineCollection()
		)
		this.points = this.$viewer.scene.primitives.add(
			new this.$Cesium.PointPrimitiveCollection()
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
		this.$bindEvent("LEFT_CLICK", ({ position }) => {
			if (this.$viewer.scene.mode !== this.$Cesium.SceneMode.MORPHING) {
				let plPositions = []
				// 鼠标触发的位置的笛卡尔坐标
				const cartesian = this.$getPickPosition(position)

				if (this.$Cesium.defined(cartesian)) {
					if (
						this.points.length === 2 &&
						this.points.contains(point3)
					) {
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
								material: this.$Cesium.Color.WHITE.withAlpha(
									0.3
								),
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
									type: "Color",
									uniforms: {
										color: this.$Cesium.Color.fromBytes(
											210,
											225,
											100
										)
									}
								}
							})
						})
						point1 = this.points.add({
							position: cartesian,
							Color: this.$Cesium.Color.RED
						})
						point2 = this.points.add({
							Color: this.$Cesium.Color.RED
						})
						point1GeoPosition = this.$Cesium.Cartographic.fromCartesian(
							cartesian
						)
						polyline.show = true
						circle.ellipse.show = true

						this.$bindEvent("MOUSE_MOVE", ({ endPosition }) => {
							const hoverCartesian = this.$getPickPosition(
								endPosition
							)
							const point2GeoPosition = this.$Cesium.Cartographic.fromCartesian(
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
									new this.$Cesium.Cartesian3.fromRadians(
										point1GeoPosition.longitude,
										point1GeoPosition.latitude,
										point2GeoPosition.height
									)
								]
								labelHeight =
									point1GeoPosition.height +
									(point2GeoPosition.height -
										point1GeoPosition.height)
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
									(point1GeoPosition.height -
										point2GeoPosition.height)
							}
							polyline.positions = plPositions
							this[_addDistanceLabel](
								point1,
								point2,
								labelHeight,
								"measureheight",
								point2GeoPosition,
								point1GeoPosition,
								verticalLabel
							)
						})
					} // add second point and lines
					else if (!this.points.contains(point3)) {
						this.$removeEvent("MOUSE_MOVE")
						this.points.remove(point2)
						point3 = this.points.add({
							position: cartesian,
							Color: this.$Cesium.Color.RED
						})
						point3GeoPosition = this.$Cesium.Cartographic.fromCartesian(
							cartesian
						)
						let labelHeight
						if (
							point3GeoPosition.height >= point1GeoPosition.height
						) {
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
								(point3GeoPosition.height -
									point1GeoPosition.height)
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
								(point1GeoPosition.height -
									point3GeoPosition.height)
						}
						polyline.positions = plPositions
						this[_addDistanceLabel](
							point1,
							point3,
							labelHeight,
							"measureheight",
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
				material: this.$Cesium.Color.WHITE.withAlpha(0.3),
				show: false,
				semiMinorAxis: 50,
				semiMajorAxis: 50
			}
		})
		this.$bindEvent("LEFT_CLICK", ({ position }) => {
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
							Color: this.$Cesium.Color.RED
						})
					} // add second point and lines
					else if (this.points.length === 1) {
						circle.show = true
						point2 = this.points.add({
							position: cartesian,
							Color: this.$Cesium.Color.RED
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
						if (
							point2GeoPosition.height >= point1GeoPosition.height
						) {
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
								(point2GeoPosition.height -
									point1GeoPosition.height) /
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
								(point1GeoPosition.height -
									point2GeoPosition.height) /
									2.0
						}

						polyline1 = this.polylines.add({
							show: true,
							positions: pl1Positions,
							width: 2,
							material: new this.$Cesium.Material({
								fabric: {
									type: "Color",
									uniforms: {
										color: this.$Cesium.Color.BURLYWOOD
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
									type: "PolylineDash",
									uniforms: {
										color: this.$Cesium.Color.BURLYWOOD
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
									type: "PolylineDash",
									uniforms: {
										color: this.$Cesium.Color.BURLYWOOD
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
							"triangulation",
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

		if (type === "measureheight") {
			if (point2GeoPosition.height >= point1GeoPosition.height) {
				verticalLabel.position = this[_getLabelPosition](p2, p2, height)
			} else {
				verticalLabel.position = this[_getLabelPosition](p1, p1, height)
			}
			return
		}

		if (type === "triangulation") {
			distanceLabel.label.text = this[_getDistanceString](
				p1,
				p2,
				point1GeoPosition,
				point2GeoPosition
			)
			horizontalLabel.label.text = this[_getHorizontalDistanceString](
				p1,
				p2
			)
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
			return (meters / 1000).toFixed(2) + " км"
		}
		return meters + " м"
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
			return (meters / 1000).toFixed(2) + " км"
		}
		return meters.toFixed(2) + " м"
	}
	/**
	 * @return {String} 垂线上label的文字
	 **/
	[_getVerticalDistanceString](p1Geo, p2Geo) {
		const heights = [p1Geo.height, p2Geo.height]
		const METERS =
			Math.max.apply(Math, heights) - Math.min.apply(Math, heights)
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
		const midpointCartographic = geodesic.interpolateUsingFraction(
			0.5,
			scratch
		)
		return this.$Cesium.Cartesian3.fromRadians(
			midpointCartographic.longitude,
			midpointCartographic.latitude,
			height
		)
	}
}
