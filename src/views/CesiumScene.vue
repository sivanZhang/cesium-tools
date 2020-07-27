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
        title="DIM"
        shape="circle"
        type="primary"
        icon="md-podium"
        size="large"
      ></Button>
    </div>
    <div id="operation">
      <div class="switch-wrap">
        安全空间：
        <i-switch :value="isShow" @on-change="change" size="small"> </i-switch>
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
      viewer: null,
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
      this.viewer = new Cesium.Viewer("cesiumContainer", {
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
      });
      const { camera, scene } = this.viewer;
      const { globe } = scene;
      // globe.enableLighting = true
      globe.depthTestAgainstTerrain = true;

      //  安全飞行区域
      this.safeSpace = this.viewer.entities.add({
        name: "safe space",
        show: false,
        position: Cesium.Cartesian3.fromDegrees(90.3, 27.6, 7400.0),
        cylinder: {
          length: 4000.0,
          topRadius: 16000.0,
          bottomRadius: 4000.0,
          material: Cesium.Color.FORESTGREEN.withAlpha(0.5),
          outline: true,
          Modal: null,
          isPathReady: false,
        },
      });

      // 经纬度
      /* const Lable = this.viewer.entities.add({
        label: {
          showBackground: true,
          font: "14px monospace",
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(15, 0),
          disableDepthTestDistance: Infinity,
        },
      }); */

      // const cartesianPnt = Cesium.Cartesian3.fromDegrees(90.3, 28.1, 10000)
      // globalThis.Model = this.viewer.entities.add({
      //   name: '飞机模型',
      //   position: cartesianPnt,
      //   model: new Cesium.ModelGraphics({
      //     uri: '/glb/Cesium_Air.glb',
      //     minimumPixelSize: 128,
      //     scale: 2.0,
      //   }),
      // })
      // this.viewer.flyTo(Model, {
      //   duration: 1.8,
      // })
      /* let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction(
        function(movement) {
          var cartesian = this.viewer.camera.pickEllipsoid(
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
      ); */
    },
    flyToDIM() {
      const { camera, scene } = this.viewer;
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
          const heightOffset = -90.0;
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
      const { camera } = this.viewer;
      camera.flyHome(2);
    },
    positionCamera() {
      const { camera } = this.viewer;
      camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(90.3, 27.6, 300000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-80.0),
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

      const { camera, scene } = this.viewer;
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
      this.viewer.dataSources.add(this.Collection);
      window.clickHandler.setInputAction(
        function({ position }) {
          var cartesian = this.getPickPosition(position);
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
      this.viewer.clock.startTime = start.clone();
      this.viewer.clock.stopTime = stop;
      this.viewer.clock.currentTime = start.clone();
      this.viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED;
      this.viewer.timeline.zoomTo(start, stop);

      this.Modal.position = property;
      this.Modal.orientation = new Cesium.VelocityOrientationProperty(property);
    },
    getPickPosition(position) {
      const pickedObject = this.viewer.scene.pick(position);
      if (
        this.viewer.scene.pickPositionSupported &&
        Cesium.defined(pickedObject)
      ) {
        return this.viewer.scene.pickPosition(position);
      } else {
        let ray = this.viewer.camera.getPickRay(position);
        return this.viewer.scene.globe.pick(ray, this.viewer.scene);
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
.cesium-this.viewer-bottom {
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
  
  .cesium-viewer-bottom,.cesium-viewer-timelineContainer {
    display: none;
  }
  .ivu-btn-group {
    display: block;
    margin-bottom: 6px;
  }
}
</style>
