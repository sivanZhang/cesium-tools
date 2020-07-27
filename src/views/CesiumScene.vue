<template>
  <div id="cesiumContainer">
    <div id="controller">
      <Button
        @click="backToHome"
        title="缩放"
        shape="circle"
        type="primary"
        size="large"
        icon="md-globe"
      ></Button>
      <Button
        @click="positionCamera"
        title="定位"
        shape="circle"
        type="primary"
        icon="md-locate"
        size="large"
      ></Button>
      <Button
        @click="flyToDIM"
        title="TILES"
        shape="circle"
        type="primary"
        icon="md-podium"
        size="large"
      ></Button>
    </div>
    <div id="operation">
      <div class="switch-wrap">
        安全空间：
        <i-switch :value="isShow" @on-change="change" size="small"></i-switch>
      </div>
      <Button
        class="btn1"
        type="primary"
        @click="setPath"
        icon="md-pulse"
        size="small"
        >绘制跑道</Button
      >
      <Button
        v-show="positionList.length"
        @click="run"
        type="primary"
        icon="md-jet"
        size="small"
        >模拟起飞</Button
      >
    </div>
  </div>
</template>
<script>
const Cesium = require("cesium/Cesium");
const { MOUSE_MOVE, RIGHT_CLICK, LEFT_CLICK } = Cesium.ScreenSpaceEventType;
import { Button, ButtonGroup, Switch, Message } from "view-design";
export default {
  name: "CesiumScene",
  components: {
    Button,
    ButtonGroup,
    "i-switch": Switch,
  },
  data() {
    return {
      Model: null,
      isFlying: false,
      isShow: false,
      safeSpace: null,
      positionList: [],
      Collection: null,
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    change(status) {
      if (this.safeSpace) {
        this.isShow = status;
        this.safeSpace.show = status;
      }
    },
    init() {
      /* window.viewer = new Cesium.Viewer("cesiumContainer", {
        homeButton: false,
        terrainProvider: new Cesium.CesiumTerrainProvider({
          url: "http://192.168.1.210:8085/terrain/",
        }),
        baseLayerPicker: false,
        fullscreenButton: true,
        scene3DOnly: true,
        animate: false,
        shouldAnimate: true,
        shadows: true,
        timeline: true,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        geocoder: false,
        infoBox: false,
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
          url: "http://192.168.1.210:9091/files/tiles/{z}/{x}/{y}.png",
        }),
      }); */
      Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkODZjOGY4Yy1jOGEzLTRlNzMtYTdlMS03ZWQ5MmE4M2RkMzEiLCJpZCI6MjA0NTYsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1Nzc0NzI0Nzd9.3OfoKjLexR3j8kcepsM_h0hj1vEpS0jd_aw9n-izLKk";
      window.viewer = new Cesium.Viewer("cesiumContainer", {
        homeButton: false,
        terrainProvider: new Cesium.createWorldTerrain({
          requestVertexNormals: true,
          url: Cesium.IonResource.fromAssetId(3957),
        }),
        baseLayerPicker: false,
        fullscreenButton: true,
        scene3DOnly: true,
        animate: false,
        shouldAnimate: true,
        shadows: true,
        timeline: true,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        geocoder: false,
        infoBox: false,
        projectionPicker:false,
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
          url: "http://192.168.1.210:9091/files/tiles/{z}/{x}/{y}.png",
        })
      });
      window.viewer.screenSpaceEventHandler.destroy()
      const { camera, scene } = viewer;
      const { globe, imageryLayers } = scene;
      // var inspectorViewModel = viewer.cesium3DTilesInspector.viewModel;
      globe.depthTestAgainstTerrain = true;
      imageryLayers.addImageryProvider(
        new Cesium.WebMapTileServiceImageryProvider({
          url: `http://192.168.1.210:9090/geoserver/gwc/service/wmts?layer=osmchina:osmchina&style=&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:900913:{TileMatrix}&TileCol={TileCol}&TileRow={TileRow}&TRANSPARENT=true`,
          layer: "boundary",
          format: "image/png",
          style: "",
          tileMatrixSetID: "default",
          credit: "BORDER",
          rectangle: Cesium.Rectangle.unpack([
            Cesium.Math.toRadians(77.7469711303711),
            Cesium.Math.toRadians(3.1577301025390607),
            Cesium.Math.toRadians(135.315902709961),
            Cesium.Math.toRadians(53.80867385864259),
          ]),
        })
      );
      //  安全飞行区域
      this.safeSpace = window.viewer.entities.add({
        name: "safe space",
        show: false,
        position: Cesium.Cartesian3.fromDegrees(108.27, 34.275, 545.0),
        cylinder: {
          length: 300.0,
          topRadius: 900.0,
          bottomRadius: 1.0,
          material: Cesium.Color.YELLOW.withAlpha(0.2),
          numberOfVerticalLines:64,
          outline: true,
          fill:true,
          outlineColor:Cesium.Color.YELLOW,
          outlineWidth:4
        },
      });
    },
    // 鼠标移动带经纬度
    getLngLat() {
      const { camera, scene } = window.viewer;
      const { globe } = scene;
      const Lable = window.viewer.entities.add({
        label: {
          showBackground: true,
          font: "14px monospace",
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(15, 0),
          disableDepthTestDistance: Infinity,
        },
      });

      let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction(
        function(movement) {
          console.log('movement',movement);
          var cartesian = window.viewer.camera.pickEllipsoid(
            movement.endPosition,
            scene.globe.ellipsoid
          );
          if (cartesian) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitudeString = Cesium.Math.toDegrees(
              cartographic.longitude
            ).toFixed(2);
            var latitudeString = Cesium.Math.toDegrees(
              cartographic.latitude
            ).toFixed(2);
            Lable.position = cartesian;
            Lable.label.show = true;
            Lable.label.text =
              "经度: " +
              ("   " + longitudeString).slice(-7) +
              "\u00B0" +
              "\n纬度: " +
              ("   " + latitudeString).slice(-7) +
              "\u00B0";
          } else {
            Lable.label.show = false;
          }
        }.bind(this),
        MOUSE_MOVE
      );
    },
    flyToDIM() {
      window.viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);
      const { camera, scene } = window.viewer;
      const { globe } = scene;
      // 添加3Dtiles模型
      const tileset = new Cesium.Cesium3DTileset({
        url: "./Tileset/tileset.json",
      });
      tileset.readyPromise
        .then(function() {
          camera.viewBoundingSphere(
            tileset.boundingSphere,
            new Cesium.HeadingPitchRange(0, -0.5, 0)
          );
          // camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
          const heightOffset = -60.0;//-90
          const boundingSphere = tileset.boundingSphere;
          const cartographic = Cesium.Cartographic.fromCartesian(
            boundingSphere.center
          );
          const surface = Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            0.0
          );
          const offset = Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            heightOffset
          );
          const translation = Cesium.Cartesian3.subtract(
            offset,
            surface,
            new Cesium.Cartesian3()
          );
          tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
          scene.primitives.add(tileset);
        })
        .otherwise(function(error) {
          throw error;
        });
    },
    backToHome() {
      const { camera } = window.viewer;
      camera.flyHome(2);
    },
    positionCamera() {
      const { camera } = window.viewer;
      camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(108.26, 34.2, 10000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45.0),
          roll: 0.0,
        },
        duration: 1.5,
      });
    },
    // 模拟飞行
    setPath() {
      Message.info({
        content: "点击鼠标左键连续标点，点击右键结束",
        duration: 4,
      });
      this.positionList.splice(0, this.positionList.length);
      this.Collection && this.Collection.entities.removeAll();

      const { camera, scene } = window.viewer;
      const { globe } = scene;
      window.clickHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      let step = 0;
      this.Collection = new Cesium.CustomDataSource("path");
      const Pnt = new Cesium.PointGraphics({
        pixelSize: 6,
        outlineColor: Cesium.Color.ORANGERED,
        outlineWidth: 4,
      });
      this.Modal = this.Collection.entities.add({
        polyline: {
          width: 2,
          material: Cesium.Color.DEEPSKYBLUE.withAlpha(0.3),
          depthFailMaterial: Cesium.Color.DEEPSKYBLUE.withAlpha(0.3),
          zIndex: 1,
          clampToGround: true,
        },
        model: {
          uri: "/glb/Cesium_Air.glb",
          minimumPixelSize: 128,
          zIndex: 100,
        },
      });
      window.viewer.dataSources.add(this.Collection);
      window.clickHandler.setInputAction(
        function(e) {
          var cartesian = this.getPickPosition(e.position);
          if (cartesian) {
            cartesian; //[step] = cartesian
            this.positionList.splice(step, 0, cartesian);
            step++;
            if (step === 1) {
              this.Collection.entities.add({
                point: Pnt,
                position: cartesian,
              });
            }
            if (step > 1) {
              this.Collection.entities.add({
                point: Pnt.clone(),
                position: cartesian,
              });
            }
          }
        }.bind(this),
        LEFT_CLICK
      );
      // 右键结束绘制
      window.clickHandler.setInputAction(
        function({ position }) {
          window.clickHandler.removeInputAction(LEFT_CLICK);
          this.Modal.polyline.positions = this.positionList;
          // this.isPathReady = true
        }.bind(this),
        RIGHT_CLICK
      );
    },
    run() {
      var start = Cesium.JulianDate.fromDate(new Date(2015, 2, 25, 16));
      var property = new Cesium.SampledPositionProperty();
      let timeArr = [start];
      for (let index = 1; index < this.positionList.length; index++) {
        timeArr[index] = Cesium.JulianDate.addSeconds(
          timeArr[index - 1],
          5,
          new Cesium.JulianDate()
        );
      }
      property.addSamples(timeArr, this.positionList);

      let stop = timeArr[timeArr.length - 1].clone();
      window.viewer.clock.startTime = start.clone();
      window.viewer.clock.stopTime = stop;
      window.viewer.clock.currentTime = start.clone();
      window.viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED;
      window.viewer.timeline.zoomTo(start, stop);

      this.Modal.position = property;
      this.Modal.orientation = new Cesium.VelocityOrientationProperty(property);
    },
    getPickPosition(position) {
      const pickedObject = window.viewer.scene.pick(position);
      if (
        window.viewer.scene.pickPositionSupported &&
        Cesium.defined(pickedObject)
      ) {
        return window.viewer.scene.pickPosition(position);
      } else {
        let ray = window.viewer.camera.getPickRay(position);
        return window.viewer.scene.globe.pick(ray, window.viewer.scene);
      }
    },
    endLeftClick() {
      window.clickHandler && window.clickHandler.removeInputAction(LEFT_CLICK);
      window.clickHandler = null;
    },
  },
};
</script>

<style lang="scss">
.cesium-window.viewer-bottom {
  display: none;
}
#cesiumContainer {
  position: relative;
  overflow: hidden;
  height: 100vh;
  #controller {
    .ivu-btn {
      display: block;
      & + .ivu-btn {
        margin-top: 12px;
      }
    }
    position: absolute;
    top: 15px;
    right: 15px;
    z-index: 10;
  }
  .btn1 {
    display: block;
    margin-bottom: 15px;
  }
  #operation {
    position: absolute;
    top: 15px;
    left: 15px;
    z-index: 10;
    padding: 15px;
    background-color: rgba($color: #000000, $alpha: 0.5);
    border-radius: 4px;
    color: #ccc;
    .switch-wrap {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
  }

  .cesium-viewer-bottom,
  .cesium-viewer-timelineContainer {
    display: none;
  }
  .ivu-btn-group {
    display: block;
    margin-bottom: 6px;
  }
  .cesium-viewer-cesium3DTilesInspectorContainer{
    display: none;
  }
}
</style>
