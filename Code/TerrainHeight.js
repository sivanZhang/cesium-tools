/**
 * @Author DY
 */
import { dependence } from "../../Constants.js"
import { Ellipsoid } from "./Ellipsoid.js"

let echarts = dependence.echarts
import { Coordinate } from "./Coordinate.js"
import { Point } from "./Geometry/2D/Point.js"
import { PromiseChain } from "../../Util/PromiseChain.js"

const TerrainHeight_echart = { charts: null }

class TerrainHeight {
	// static
	/**
     *
     * @param obj {position,terrainProvider,granularity}
     * @param onSuccess
     * @param onFail
     * 示例：
     * let a;
     TerrainHeight.updateHeight({
        position: Coordinate.handlePosition([94.0, 24.0, 94.0, 23.0]),
        terrainProvider: this.viewer.terrainProvider
      }, function (as) {
        a = as;
      });
     */
	static updateHeight(obj, onSuccess, onFail) {
		let subposition = dependence.Cesium.PolylinePipeline.generateArc({
			positions: obj.position,
			granularity:
				obj.granularity === undefined ? 0.00001 : obj.granularity
		})
		let ellipos = Ellipsoid.getWGS84()
		let modifiedPosition = []
		for (let i = 0; i < subposition.length; i += 3) {
			modifiedPosition.push(
				ellipos.cartesianToCartographic(
					new dependence.Cesium.Cartesian3(
						subposition[i],
						subposition[i + 1],
						subposition[i + 2]
					)
				)
			)
		}
		if (
			obj.terrainProvider instanceof
			dependence.Cesium.EllipsoidTerrainProvider
		) {
			onSuccess(modifiedPosition)
		} else {
			dependence.Cesium.when(
				dependence.Cesium.sampleTerrainMostDetailed(
					obj.terrainProvider,
					modifiedPosition
				),
				onSuccess,
				onFail
			)
		}
	}

	static getMatrix(obj, onSuccess, onFail) {
		let matrix = []
		let pointPosition = obj.positions
		let granularity =
			obj.granularity === undefined ? 0.00001 : obj.granularity
		for (let i = 0; i < 3; i++) {
			switch (i) {
				case 0:
					matrix[i] = [
						{
							longitude: Coordinate.angleToRadian(
								pointPosition[0] - granularity
							),
							latitude: Coordinate.angleToRadian(
								pointPosition[1] - granularity
							),
							height: 0
						},
						{
							longitude: Coordinate.angleToRadian(
								pointPosition[0]
							),
							latitude: Coordinate.angleToRadian(
								pointPosition[1] - granularity
							),
							height: 0
						},
						{
							longitude: Coordinate.angleToRadian(
								pointPosition[0] + granularity
							),
							latitude: Coordinate.angleToRadian(
								pointPosition[1] - granularity
							),
							height: 0
						}
					]
					break
				case 1:
					matrix[i] = [
						{
							longitude: Coordinate.angleToRadian(
								pointPosition[0] - granularity
							),
							latitude: Coordinate.angleToRadian(
								pointPosition[1]
							),
							height: 0
						},
						{
							longitude: Coordinate.angleToRadian(
								pointPosition[0]
							),
							latitude: Coordinate.angleToRadian(
								pointPosition[1]
							),
							height: 0
						},
						{
							longitude: Coordinate.angleToRadian(
								pointPosition[0] + granularity
							),
							latitude: Coordinate.angleToRadian(
								pointPosition[1]
							),
							height: 0
						}
					]
					break
				case 2:
					matrix[i] = [
						{
							longitude: Coordinate.angleToRadian(
								pointPosition[0] - granularity
							),
							latitude: Coordinate.angleToRadian(
								pointPosition[1] + granularity
							),
							height: 0
						},
						{
							longitude: Coordinate.angleToRadian(
								pointPosition[0]
							),
							latitude: Coordinate.angleToRadian(
								pointPosition[1] + granularity
							),
							height: 0
						},
						{
							longitude: Coordinate.angleToRadian(
								pointPosition[0] + granularity
							),
							latitude: Coordinate.angleToRadian(
								pointPosition[1] + granularity
							),
							height: 0
						}
					]
					break
			}
		}
		TerrainHeight.getHeight(matrix, obj.terrainProvider, onSuccess, onFail)
	}

	static getHeight(matrix, terrainProvider, onSuccess, onFail) {
		let index = 0
		if (
			terrainProvider instanceof
			dependence.Cesium.EllipsoidTerrainProvider
		) {
			return new Promise(function(resolve, reject) {
				onSuccess(matrix)
				resolve()
			})
		} else {
			return new Promise(function(resolve, reject) {
				for (let i = 0; i < 3; i++) {
					dependence.Cesium.when(
						dependence.Cesium.sampleTerrainMostDetailed(
							terrainProvider,
							matrix[i]
						),
						as => {
							matrix[index] = as
							for (let j = 0; j < 3; j++) {
								if (matrix[index][j].height === undefined) {
									matrix[index][j].height = 0
								}
							}
							if (++index === 3) {
								onSuccess(matrix)
								resolve()
							}
						},
						() => {
							onFail()
							reject()
						}
					)
				}
			})
		}
	}
	/* ------------------------------------------------------------------------ */
	static getRectangleMatrix(obj, onSuccess, onFail) {
		//  粒度 =度数？
		let granularity =
			obj.granularity !== undefined && obj.granularity !== null
				? obj.granularity
				: 0.00001

		// 把包围盒划分为 网格
		const rectangleMatrix = TerrainHeight.generateMatix(
			obj.Polygon.rectangle,
			granularity
		) // obj.Polygon.rectangle = array(4 x number)

		// 去除包围盒边界到多边形边界的方格
		const matrix = TerrainHeight.excludeBound(rectangleMatrix, obj.Polygon)
		if (
			obj.terrainProvider instanceof
			dependence.Cesium.EllipsoidTerrainProvider
		) {
			onSuccess(matrix)
		} else {
			let promises = []
			for (let i = 0; i < matrix.length; i++) {
				let tmp = []
				for (let j = 0; j < matrix[i].length; j++) {
					if (matrix[i][j] !== 0) tmp.push(matrix[i][j])
				} // 如果不在边界外     添加到temp
				if (tmp.length > 0) {
					let tmpFunction = (resolve, reject) => {
						dependence.Cesium.when(
							dependence.Cesium.sampleTerrainMostDetailed(
								obj.terrainProvider,
								tmp
							),
							as => {
								resolve(matrix)
							},
							() => {
								reject()
							}
						)
					}
					promises.push(tmpFunction)
				}
			}
			let promiseChain = new PromiseChain(promises, onSuccess, onFail)
			promiseChain.all()
		}
	}

	static excludeBound(matrix, Polygon) {
		for (let i = 0; i < matrix.length; i++) {
			for (let j = 0; j < matrix[i].length; j++) {
				if (!Polygon.contains(matrix[i][j])) matrix[i][j] = 0
			}
		}
		/*// debug 时开启,可以查看是否正确框出图形
        let String = '';
        for (let i = 0; i < matrix.length; i++) {
          for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] === 0) {
              String += '.';
            } else {
              String += '*';
            }
          }
          String += '\n';
        }
        console.log(String);*/
		return matrix
	}

	static generateMatix(rectangle, granularity) {
		//  分成网格
		let startLon = rectangle.shift()
		let startLat = rectangle.shift()
		let endLon = rectangle.shift()
		let endLat = rectangle.shift()
		let lonArray = []
		let latArray = []
		if (startLon > endLon) {
			while (startLon > endLon) {
				lonArray.push(startLon)
				startLon -= granularity
			}
		} else {
			while (startLon < endLon) {
				lonArray.push(startLon)
				startLon += granularity
			}
		}
		if (startLat > endLat) {
			while (startLat > endLat) {
				latArray.push(startLat)
				startLat -= granularity
			}
		} else {
			while (startLat < endLat) {
				latArray.push(startLat)
				startLat += granularity
			}
		}
		// 经纬度抽象的点的二维数组
		let ret = []
		for (let i = 0; i < lonArray.length; i++) {
			let tmp = []
			for (let j = 0; j < latArray.length; j++) {
				// 经纬度抽象的点
				tmp.push(new Point(lonArray[i], latArray[j], 0))
			}
			ret.push(tmp)
		}
		return ret
	}

	static removeChart() {
		if (TerrainHeight_echart.charts !== null)
			TerrainHeight_echart.charts.dispose(
				document.getElementById("Speed3d_echarts")
			)
		TerrainHeight_echart.charts = null
		document.getElementById("Speed3d_echarts").style.display = "none"
		if (document.getElementById("Speed3d_echarts_button") !== null) {
			document
				.getElementById("Speed3d_echarts_button")
				.parent.removeChild(
					document.getElementById("Speed3d_echarts_button")
				)
		}
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
				heightArray.push([
					width,
					height,
					matrix[width][height - 1].height
				])
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

	static loadEarthWork(matrix, propertiesNumber, digColor, fillColor) {
		let img = new Image()
		img.height = matrix[0].length
		img.width = matrix.length
		let canvas = document.createElement("canvas")
		canvas.height = img.height
		canvas.width = img.width
		let ctx = canvas.getContext("2d")
		let text = `挖填方分析
        
        挖掘土方量: ${propertiesNumber.digAmount || 0} 立方米
        
        挖掘面积: ${propertiesNumber.digArea || 0} 平方米
        
        填埋土方量: ${propertiesNumber.fillAmount || 0} 立方米
        
        填埋面积: ${propertiesNumber.fillArea || 0} 平方米`

		if (
			isNaN(propertiesNumber.digAmount) ||
			isNaN(propertiesNumber.digArea) ||
			isNaN(propertiesNumber.fillAmount) ||
			isNaN(propertiesNumber.fillArea)
		) {
			text = `
                   挖填方分析
            
            此处地形数据未达到
            
            所需精度要求，无法
            
            计算土方量！`
		}

		ctx.drawImage(img, 0, 0, img.width, img.height)
		let imgDataArray = TerrainHeight.imageColorArray(
			ctx.getImageData(0, 0, img.width, img.height),
			matrix,
			TerrainHeight.hex2Rgba(digColor),
			TerrainHeight.hex2Rgba(fillColor)
		)
		document.getElementById("Speed3d_echarts").style.display = "block"
		if (TerrainHeight_echart.charts === null)
			TerrainHeight_echart.charts = echarts.init(
				document.getElementById("Speed3d_echarts"),
				"light",
				{ renderer: "canvas" }
			)
		let min = imgDataArray.height.pop()
		let max = imgDataArray.height.pop()

		TerrainHeight_echart.charts.setOption({
			title: {
				text: text
			},
			tooltip: {},
			backgroundColor: "#fff",
			xAxis3D: {
				type: "value"
			},
			yAxis3D: {
				type: "value"
			},
			zAxis3D: {
				type: "value",
				min: min,
				max: max
			},
			grid3D: {
				axisPointer: {
					show: false
				},
				viewControl: {
					distance: 100
				},
				postEffect: {
					enable: true
				},
				light: {
					main: {
						shadow: true,
						intensity: 2
					},
					ambientCubemap: {
						texture: "static/echart/canyon.hdr",
						exposure: 2,
						diffuseIntensity: 0.2,
						specularIntensity: 1
					}
				}
			},
			series: [
				{
					type: "surface",
					silent: true,
					wireframe: {
						show: false
					},
					itemStyle: {
						color: function(params) {
							let i = params.dataIndex
							let r = imgDataArray.data[i * 4]
							let g = imgDataArray.data[i * 4 + 1]
							let b = imgDataArray.data[i * 4 + 2]
							return "rgb(" + [r, g, b].join(",") + ")"
						},
						opacity: 0.8
					},
					data: imgDataArray.height
				}
			]
		})
		if (document.getElementById("Speed3d_echarts_button") === null) {
			document
				.getElementById("Speed3d_echarts")
				.firstChild.appendChild(TerrainHeight.creathButton())
		}
	}

	static loadCrossSection(position, terrainProvider, onSuccess, onFail) {
		TerrainHeight.updateHeight(
			{
				position: position,
				terrainProvider: terrainProvider
			},
			function(as) {
				if (onSuccess) {
					onSuccess(as)
				}

				let tileAvailable = true
				let heightArray = []
				let xAx = []
				for (let i = 0; i < as.length; i++) {
					heightArray.push(as[i].height)
					tileAvailable = tileAvailable && as[i].height !== undefined
					xAx.push(
						`经度:${Coordinate.toDegree(
							as[i].longitude
						)},纬度:${Coordinate.toDegree(as[i].latitude)},海拔`
					)
				}
				document.getElementById("Speed3d_echarts").style.display =
					"block"
				let title = "剖面分析"
				if (tileAvailable === false) {
					title = `
                                       剖面分析
                        
                              此处地形数据未达到

                              所需精度要求，无法

                              进行剖面分析！`
				}
				if (TerrainHeight_echart.charts === null)
					TerrainHeight_echart.charts = echarts.init(
						document.getElementById("Speed3d_echarts"),
						"dark"
					)
				TerrainHeight_echart.charts.setOption({
					title: {
						text: title
					},
					tooltip: {},
					legend: {
						data: ["剖面分析"]
					} /*toolbox: {
                            left: 'center',
                            feature: {
                                dataZoom: {
                                    yAxisIndex: 'none'
                                },
                                restore: {},
                                saveAsImage: {}
                            }
                        },*/,
					dataZoom: [
						{
							startValue: 0
						},
						{
							type: "inside"
						}
					],
					xAxis: { show: false, data: xAx },
					yAxis: {},
					series: [
						{
							name: "剖面分析",
							type: "line",
							data: heightArray,
							smooth: true,
							areaStyle: {
								color: {
									type: "linear",
									x: 0,
									y: 0,
									x2: 1,
									y2: 1,
									colorStops: [
										{
											offset: 0,
											color: "red" // 0% 处的颜色
										},
										{
											offset: 1,
											color: "blue" // 100% 处的颜色
										}
									],
									globalCoord: false // 缺省为 false
								}
							}
						}
					]
				})
				if (
					document.getElementById("Speed3d_echarts_button") === null
				) {
					document
						.getElementById("Speed3d_echarts")
						.firstChild.appendChild(TerrainHeight.creathButton())
				}
			},
			onFail
		)
	}

	static creathButton() {
		let a = document.createElement("button")
		a.style =
			"z-index: 99999; position: absolute; left:95%; overflow: dispaly; border-width: 0px;" +
			"    padding: 4px 4px 0 0;\n" +
			"    text-align: center;\n" +
			"    width: 36px;\n" +
			"    height: 28px;\n" +
			"    font: 16px/14px Tahoma, Verdana, sans-serif;\n" +
			"    color: #ffffff;\n" +
			"    text-decoration: none;\n" +
			"    font-weight: bold;\n" +
			"    background: transparent;"
		a.id = "Speed3d_echarts_button"
		a.innerText = "x"
		a.onclick = function() {
			TerrainHeight.removeChart()
		}
		return a
	}
}

export { TerrainHeight, TerrainHeight_echart }
