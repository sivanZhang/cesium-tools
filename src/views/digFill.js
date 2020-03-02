import Basic from './basic'
import CesiumCharts from './CesiumCharts.js'
export default class DigFill extends Basic {
	constructor(
		Cesium,
		viewer,
		config = {
			targerHeight: null,
			terrainProvider: null,
			granularity: 0.000001,
			isShowEChart: false,
			echartsID: null
		}
	) {
		super(Cesium, viewer)
		this.polylines = this.$viewer.scene.primitives.add(
			new this.$Cesium.PolylineCollection()
		)
		// 精度：代表每个网格的边长
		this.granularity = config.granularity
		this.targerHeight = config.targerHeight
		this.terrainProvider = config.terrainProvider
		this.cartesianList = []
		this.cartographicList = []
		this.echartsID = config.echartsID
	}
	_onFail() {
		console.log('_onFail')
	}
	test() {
		this.$bindEvent('LEFT_CLICK', ({ position }) => {
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
			console.log('------hhhhhhhhhhh--------', arr, temp)
			var promise = this.$Cesium.sampleTerrainMostDetailed(terrainProvider, temp)
			this.$Cesium.when(
				promise,
				as => {
					console.log('--------------', as)
				},
				err => {
					console.error(err, 'errerrerrerrerr')
				}
			)
		})
	}
	start() {
		this.$Cesium.ArcType
		this.cartesianList = []
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
		this.$bindEvent('LEFT_CLICK', ({ position }) => {
			let clickCartesian = this.$getPickPosition(position)
			this.cartesianList.push(clickCartesian)
			let len = this.cartesianList.length
			// 橡皮筋
			this.$bindEvent('MOUSE_MOVE', ({ endPosition }) => {
				let moveCartesian = this.$getPickPosition(endPosition)
				tempLine.polyline.show = true
				if (len === 1) {
					tempLine.polyline.positions = [clickCartesian, moveCartesian]
				} else if (len >= 2) {
					tempLine.polyline.show = false
					polygon.show = true
					polygon.polygon.hierarchy = [
						...this.cartesianList,
						moveCartesian,
						this.cartesianList[0]
					]
				}
			})
		})
		this.$bindEvent('RIGHT_CLICK', () => {
			if (this.cartesianList.length >= 3) {
				this.cartesianList.push(this.cartesianList[0])
				const ellipsoid = this.$Cesium.Ellipsoid.WGS84
				this.cartographicList = this.cartesianList.map(t => {
					return this.$Cesium.Cartographic.fromCartesian(t, ellipsoid)
				})
				this.$removeEvent()

				tempLine.show = false
				polygon.show = false
				wall.show = true
				let polygonMaxheigh = this._getMaxHeight()
				wall.wall.maximumHeights = polygonMaxheigh
				wall.wall.positions = this.cartesianList

				/* polygon.show = true
				polygon.polygon.extrudedHeight = this._getMaxHeight()[0]
				polygon.polygon.height = this._getMaxHeight()[1]
				polygon.polygon.hierarchy = this.cartesianList */
				this._analyse()
			}
		})
	}
	// 得到最高的一个点
	_getMaxHeight() {
		let maxHeight = -Infinity
		// let minHeight = Infinity
		this.cartographicList.forEach(el => {
			// minHeight = Math.min(minHeight, el.height)
			maxHeight = Math.max(maxHeight, el.height)
		})
		// return [maxHeight,minHeight]
		return this.cartographicList.map(() => {
			return maxHeight
		})
	}
	// 执行分析
	_analyse() {
		this._computeRectangle()
	}
	_computeRectangle() {
		// 加包围盒
		let lon1 = -Infinity
		let lat1 = -Infinity
		let lon2 = Infinity
		let lat2 = Infinity
		for (let i = 0; i < this.cartographicList.length; i++) {
			lon1 = Math.max(this.cartographicList[i].longitude, lon1)
			lat1 = Math.max(this.cartographicList[i].latitude, lat1)
			lon2 = Math.min(this.cartographicList[i].longitude, lon2)
			lat2 = Math.min(this.cartographicList[i].latitude, lat2)
		}
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
		console.log(matrix,'matrixmatrixmatrixmatrixmatrixmatrixmatrixmatrix1');
		matrix = this._excludeBound(matrix)
		console.log(matrix,'matrixmatrixmatrixmatrixmatrixmatrixmatrixmatrix2');
		let promises = []
		const terrainProvider = this.$Cesium.createWorldTerrain()
		for (let i = 0; i < matrix.length; i++) {
			let temp = [] // matrix  变成一位数组
			for (let j = 0; j < matrix[i].length; j++) {
				if (matrix[i][j] !== 0) {
					temp.push(matrix[i][j])
				}
			} // 如果不在边界外     添加到temp
			if (temp.length > 0) {
				let tmpFunction = new Promise((resolve, reject) => {
					// → Promise.<Array.< Cartographic >>
					const TerrainPromise = this.$Cesium.sampleTerrainMostDetailed(
						terrainProvider,
						temp
					)
					this.$Cesium.when(
						TerrainPromise,
						res => {
							resolve(res)
						},
						() => {
							reject('error!')
						}
					)
				})
				promises.push(tmpFunction)
			}
		}
		Promise.all(promises)
			.then(matrix => {
				this._onSuccess(matrix)
			})
			.catch(err => {
				this._onFail(err)
			})
	}
	// 去除包围盒边界到多边形边界的方格   边界外的对象 = 0失败
	_excludeBound(matrix) {
		matrix.forEach(item => {
			item.forEach(point => {
				if (!this._contains(point)) {
					point = 0
				}
			})
		})
		return matrix
	}
	_onSuccess(matrix) {
		if (matrix) {
			this._getdata(matrix)
		} else {
			console.log('挖方区域面积过小，无法计算土方体积')
		}
		this.targerHeight = null
	}
	_getdata(matrix) {
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
		let fillArea = (totalArea * avgFillHeight) / (avgFillHeight + avgDigHeight),
			digArea = (totalArea * avgDigHeight) / (avgFillHeight + avgDigHeight)

		let returns = {
			fillArea: fillArea,
			digArea: digArea,
			fillAmount: fillArea * avgFillHeight,
			digAmount: digArea * avgDigHeight
		}

		!this.echartsID && this._showEcahrts(returns, matrix)
	}
	_showEcahrts(data, matrix, digColor = '#FF8C37', fillColor = '#ffaaff') {
		let img = new Image()
		img.height = matrix[0].length
		img.width = matrix.length
		let canvas = document.createElement('canvas')
		canvas.height = img.height
		canvas.width = img.width
		let ctx = canvas.getContext('2d')
		let text = `挖填方分析
        
        挖掘土方量: ${data.digAmount || 0} 立方米
        
        挖掘面积: ${data.digArea || 0} 平方米
        
        填埋土方量: ${data.fillAmount || 0} 立方米
        
        填埋面积: ${data.fillArea || 0} 平方米`

		if (
			isNaN(data.digAmount) ||
			isNaN(data.digArea) ||
			isNaN(data.fillAmount) ||
			isNaN(data.fillArea)
		) {
			text = `
                   挖填方分析
            
            此处地形数据未达到
            
            所需精度要求，无法
            
            计算土方量！`
		}

		ctx.drawImage(img, 0, 0, img.width, img.height)
		let imgDataArray = DigFill.imageColorArray(
			ctx.getImageData(0, 0, img.width, img.height),
			matrix,
			DigFill.hex2Rgba(digColor),
			DigFill.hex2Rgba(fillColor)
		)
		const option = {
			
		}
		const MyCharts = new CesiumCharts(this.echartsID,"light", option)
	}
	static imageColorArray(imgData, matrix, digColor, fillColor) {
		let imgDataArray = imgData.data
		let heightArray = []
		let max = -Infinity,
			min = Infinity
		for (let i = 0; i < imgDataArray.length / 4; i++) {
			let width = i % imgData.width,
				height = imgData.height - Math.floor(i / imgData.width)
			if (matrix[width][height - 1] !== 0) {
				if (matrix[width][height - 1].Speed3DEWA === 1) {
					imgDataArray[i * 4] = digColor.r
					imgDataArray[i * 4 + 1] = digColor.g
					imgDataArray[i * 4 + 2] = digColor.b
					imgDataArray[i * 4 + 3] = 255
				} else if (matrix[width][height - 1].Speed3DEWA === 2) {
					imgDataArray[i * 4] = fillColor.r
					imgDataArray[i * 4 + 1] = fillColor.g
					imgDataArray[i * 4 + 2] = fillColor.b
					imgDataArray[i * 4 + 3] = 255
				}
				heightArray.push([width, height, matrix[width][height - 1].height])
				max = Math.max(max, matrix[width][height - 1].height)
				min = Math.min(min, matrix[width][height - 1].height)
			} else {
				heightArray.push([width, height, 0])
			}
		}

		for (let i = 0; i < heightArray.length; i++) {
			if (heightArray[i][2] === 0) heightArray[i][2] = min
		}

		heightArray.push(Math.floor(max + 10), Math.floor(min - 10))

		return {
			data: imgDataArray,
			height: heightArray
		}
	}
	static hex2Rgba(hex) {
		return {
			r: parseInt("0x" + hex.slice(1, 3)),
			g: parseInt("0x" + hex.slice(3, 5)),
			b: parseInt("0x" + hex.slice(5, 7))
		}
	}
	_getAllArea() {
		let area = 0
		for (let i = 0; i < this.cartographicList.length - 1; i++) {
			let p1 = this.cartographicList[i]
			let p2 = this.cartographicList[i + 1]
			area +=
				(p2.longitude - p1.longitude) *
				(2 + Math.sin(p1.latitude) + Math.sin(p2.latitude))
		}
		//获取椭球的半径._radii
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
	_contains(currentPoint) {
		if (this._isVertix(currentPoint)) return true
		let flag = false
		for (let i = 0, l = this.cartographicList.length, j = l - 1; i < l; j = i, i++) {
			if (
				(this.cartographicList[i].latitude < currentPoint.latitude &&
					this.cartographicList[j].latitude >= currentPoint.latitude) ||
				(this.cartographicList[i].latitude >= currentPoint.latitude &&
					this.cartographicList[j].latitude < currentPoint.latitude)
			) {
				let longitude =
					this.cartographicList[i].longitude +
					((currentPoint.latitude - this.cartographicList[i].latitude) *
						(this.cartographicList[j].longitude -
							this.cartographicList[i].longitude)) /
						(this.cartographicList[j].latitude -
							this.cartographicList[i].latitude)

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
	_isVertix(currentPoint) {
		for (let i = 0; i < this.cartographicList.length; i++) {
			if (this._equals(currentPoint, this.cartographicList[i])) {
				return true
			}
		}
		return false
	}
	_equals(currentPoint, target, epsilon = 0.00000001) {
		if (epsilon < 1) {
			return (
				this._inRange(
					currentPoint.longitude - epsilon,
					currentPoint.longitude + epsilon,
					target.longitude
				) &&
				this._inRange(
					currentPoint.latitude - epsilon,
					currentPoint.latitude + epsilon,
					target.latitude
				)
			)
		} else {
			return (
				(currentPoint.longitude > 0
					? this._inRange(
							currentPoint.longitude * (1 - epsilon / 10000),
							currentPoint.longitude * (1 + epsilon / 10000),
							target.x
					  )
					: this._inRange(
							currentPoint.longitude * (1 + epsilon / 10000),
							currentPoint.longitude * (1 - epsilon / 10000),
							target.longitude
					  )) &&
				(currentPoint.latitude > 0
					? this._inRange(
							currentPoint.latitude * (1 - epsilon / 10000),
							currentPoint.latitude * (1 + epsilon / 10000),
							target.latitude
					  )
					: this._inRange(
							currentPoint.latitude * (1 + epsilon / 10000),
							currentPoint.latitude * (1 - epsilon / 10000),
							target.latitude
					  ))
			)
		}
	}
	// 一样
	_inRange(min, max, input) {
		return input <= max && input >= min
	}
	// 清空所有的图形
	// clear() {}
	// zFactor基准面 sampleGap采样精度 采样分析 buffer cache LSCutFillOnTerrain
}
