<template>
  <div id="cesiumContainer">
    <div class="contorler">
      <button id="measure">开始测量</button>
    </div>
  </div>
</template>

<script>
let Cesium = require('cesium/Cesium')
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
      let viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: new Cesium.createWorldTerrain({
          requestVertexNormals: true
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
      let { camera, scene, entities } = viewer
      let { globe } = scene
      globe.depthTestAgainstTerrain = true
      // 初始化为WGS84标准的Ellipsoid实例。
      let ellipsoid = Cesium.Ellipsoid.WGS84
      // 在连接两个提供的行星点的椭球上初始化一个测地线。
      let geodesic = new Cesium.EllipsoidGeodesic()

      let tileset = new Cesium.Cesium3DTileset({
        url: './Tileset/tileset.json'
      })
      tileset.readyPromise
        .then(function() {
          // console.log(tileset);
          camera.viewBoundingSphere(
            tileset.boundingSphere,
            new Cesium.HeadingPitchRange(0, -0.5, 0)
          )
          camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
          var heightOffset = 70.0
          var boundingSphere = tileset.boundingSphere
          var cartographic = Cesium.Cartographic.fromCartesian(
            boundingSphere.center
          )
          var surface = Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            0.0
          )
          var offset = Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            heightOffset
          )
          var translation = Cesium.Cartesian3.subtract(
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
      // 瓦片加载完了

      // 点的可渲染集合。可以 add和remove
      let points = scene.primitives.add(new Cesium.PointPrimitiveCollection())
      let point1, point2
      let point1GeoPosition, point2GeoPosition
      //  线的可渲染集合
      let polylines = scene.primitives.add(new Cesium.PolylineCollection())
      let polyline1, polyline2, polyline3
      let distanceLabel, verticalLabel, horizontalLabel
      let LINEPOINTCOLOR = Cesium.Color.BURLYWOOD
      // var labels = scene.primitives.add(new Cesium.LabelCollection({scene: scene}));

      // 按钮切换编辑状态

      // 1. Draw a translucent ellipse on the surface with a checkerboard pattern
      let measureButton = document.getElementById('measure')
      let isEdit = false
      let label = {
        font: '14px monospace',
        showBackground: true,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, 0),
        eyeOffset: new Cesium.Cartesian3(0, 0, -50),
        fillColor: Cesium.Color.WHITE
      }
      let circle = entities.add({
        id: 'custom_circle',
        ellipse: {
          material: Cesium.Color.WHITE.withAlpha(0.3),
          show: false,
          semiMinorAxis: 50,
          semiMajorAxis: 50
        }
      })
      measureButton.addEventListener('click', handelMeasure, false)

      function handelMeasure() {
        isEdit = !isEdit
        let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
        if (isEdit) {
          measureButton.innerText = '关闭测量'
          handler.setInputAction(function({ position }) {
            if (scene.mode !== Cesium.SceneMode.MORPHING) {
              // 返回具有' primitive'属性的对象   [id] 是entity实体
              // 点击地方的笛卡尔坐标
              let cartesian = null
              let pickedObject = scene.pick(position)
              console.log('pickedObject------:'), pickedObject
              if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
                cartesian = scene.pickPosition(position)
                console.log('实体点')
              } else {
                let ray = camera.getPickRay(position)
                cartesian = globe.pick(ray, scene)
                console.log('地形点')
              }

              if (Cesium.defined(cartesian)) {
                if (points.length === 2) {
                  points.removeAll()
                  polylines.removeAll()
                  // entities.removeAll()
                  entities.remove(distanceLabel)
                  entities.remove(horizontalLabel)
                  entities.remove(verticalLabel)
                }
                //add first point
                if (points.length === 0) {
                  point1 = points.add({
                    position: cartesian,
                    color: Cesium.Color.RED
                  })
                } // add second point and lines
                else if (points.length === 1) {
                  point2 = points.add({
                    position: cartesian,
                    color: Cesium.Color.RED
                  })
                  // 点的笛卡尔坐标转换为制图坐标。
                  point1GeoPosition = Cesium.Cartographic.fromCartesian(
                    point1.position
                  )
                  point2GeoPosition = Cesium.Cartographic.fromCartesian(
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
                      new Cesium.Cartesian3.fromRadians(
                        point1GeoPosition.longitude,
                        point1GeoPosition.latitude,
                        point2GeoPosition.height
                      )
                    ]

                    pl3Positions = [
                      point1.position,
                      new Cesium.Cartesian3.fromRadians(
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
                      new Cesium.Cartesian3.fromRadians(
                        point2GeoPosition.longitude,
                        point2GeoPosition.latitude,
                        point1GeoPosition.height
                      )
                    ]
                    pl3Positions = [
                      point2.position,
                      new Cesium.Cartesian3.fromRadians(
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
                    material: new Cesium.Material({
                      fabric: {
                        type: 'Color',
                        uniforms: {
                          color: LINEPOINTCOLOR
                        }
                      }
                    })
                  })
                  polyline2 = polylines.add({
                    show: true,
                    positions: pl2Positions,
                    width: 1,
                    material: new Cesium.Material({
                      fabric: {
                        type: 'PolylineDash',
                        uniforms: {
                          color: LINEPOINTCOLOR
                        }
                      }
                    })
                  })

                  // label高度

                  polyline3 = polylines.add({
                    show: true,
                    positions: pl3Positions,
                    width: 1,
                    material: new Cesium.Material({
                      fabric: {
                        type: 'PolylineDash',
                        uniforms: {
                          color: LINEPOINTCOLOR
                        }
                      }
                    })
                  })
                  addDistanceLabel(point1, point2, labelZ)
                }
              }
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        } else {
          measureButton.innerText = '开启测量'
          entities.removeAll()
          points.removeAll()
          polylines.removeAll()
          handler && handler.destroy()
        }
      }
      function addDistanceLabel(point1, point2, height) {
        point1.cartographic = ellipsoid.cartesianToCartographic(point1.position)
        point2.cartographic = ellipsoid.cartesianToCartographic(point2.position)

        point1.longitude = parseFloat(Cesium.Math.toDegrees(point1.position.x))
        point1.latitude = parseFloat(Cesium.Math.toDegrees(point1.position.y))
        point2.longitude = parseFloat(Cesium.Math.toDegrees(point2.position.x))
        point2.latitude = parseFloat(Cesium.Math.toDegrees(point2.position.y))

        if (point2GeoPosition.height >= point1GeoPosition.height) {
          label.text = getVerticalDistanceString()
          verticalLabel = entities.add({
            position: getMidpoint(point1, point1, height),
            label: label
          })

          label.text = getHorizontalDistanceString(point1, point2)
          horizontalLabel = entities.add({
            position: getMidpoint(point2, point1, point2GeoPosition.height),
            label: label
          })
          label.text = getDistanceString(point1, point2)
          distanceLabel = entities.add({
            position: getMidpoint(point1, point2, height),
            label: label
          })
        } else {
          label.text = getVerticalDistanceString()
          verticalLabel = entities.add({
            position: getMidpoint(point2, point2, height),
            label: label
          })
          label.text = getHorizontalDistanceString(point1, point2)
          horizontalLabel = entities.add({
            position: getMidpoint(point1, point2, point1GeoPosition.height),
            label: label
          })
          label.text = getDistanceString(point1, point2)
          distanceLabel = entities.add({
            position: getMidpoint(point1, point2, height),
            label: label
          })
        }
      }

      function getHorizontalDistanceString(point1, point2) {
        // 设置测地线的起点和终点
        geodesic.setEndPoints(point1.cartographic, point2.cartographic)
        // 获取起点和终点之间的表面距离
        var meters = geodesic.surfaceDistance.toFixed(2)
        if (meters >= 1000) {
          return (meters / 1000).toFixed(2) + ' км'
        }
        return meters + ' м'
      }

      function getVerticalDistanceString() {
        var heights = [point1GeoPosition.height, point2GeoPosition.height]
        var meters =
          Math.max.apply(Math, heights) - Math.min.apply(Math, heights)
        if (meters >= 1000) {
          return (meters / 1000).toFixed(1) + ' км'
        }
        return meters.toFixed(2) + ' м'
      }

      function getDistanceString(point1, point2) {
        geodesic.setEndPoints(point1.cartographic, point2.cartographic)
        var horizontalMeters = geodesic.surfaceDistance.toFixed(2)
        var heights = [point1GeoPosition.height, point2GeoPosition.height]
        var verticalMeters =
          Math.max.apply(Math, heights) - Math.min.apply(Math, heights)
        var meters = Math.pow(
          Math.pow(horizontalMeters, 2) + Math.pow(verticalMeters, 2),
          0.5
        )

        // 圆的半径等于 连点间的等高距离
        /* circle.ellipse.semiMinorAxis = meters
	circle.ellipse.semiMajorAxis = meters */
        if (meters >= 1000) {
          return (meters / 1000).toFixed(1) + ' км'
        }
        return meters.toFixed(2) + ' м'
      }

      function getMidpoint(point1, point2, height) {
        var scratch = new Cesium.Cartographic()
        geodesic.setEndPoints(point1.cartographic, point2.cartographic)
        var midpointCartographic = geodesic.interpolateUsingFraction(
          0.5,
          scratch
        )
        return Cesium.Cartesian3.fromRadians(
          midpointCartographic.longitude,
          midpointCartographic.latitude,
          height
        )
      }
    }
  }
}
</script>

<style lang='scss' scoped>
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