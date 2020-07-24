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
    </div>
    <div id="operation">
      <div class="switch-wrap">
        安全空间：
        <i-switch :value="isShow" @on-change="change" size="small"> </i-switch>
      </div>
      <Button @click="simulatedFlight" icon="md-pulse" size="small"
        >模拟跑道</Button
      >
      <Button @click="simulatedFlight" icon="md-jet" size="small"
        >模拟飞行</Button
      >
    </div>
  </div>
</template>
<script>
const Cesium = require("cesium/Cesium");
const { MOUSE_MOVE, RIGHT_CLICK, LEFT_CLICK } = Cesium.ScreenSpaceEventType;
window.viewer = null;
window.clickHandler = null;
import { Button, ButtonGroup, Switch } from "view-design";
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
      Collection:null
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
      viewer = new Cesium.Viewer("cesiumContainer", {
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
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        geocoder: false,
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
          url: "http://192.168.1.210:9091/files/tiles/{z}/{x}/{y}.png",
        }),
      });
      const { camera, scene } = viewer;
      const { globe } = scene;
      // globe.enableLighting = true
      globe.depthTestAgainstTerrain = true;
      this.safeSpace = viewer.entities.add({
        name: "safe space",
        show: false,
        position: Cesium.Cartesian3.fromDegrees(90.3, 27.6, 8000.0),
        cylinder: {
          length: 8000.0,
          topRadius: 16000.0,
          bottomRadius: 8000.0,
          material: Cesium.Color.RED.withAlpha(0.8),
          outline: true,
        },
      });
      /* const Lable = viewer.entities.add({
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
      // globalThis.Model = viewer.entities.add({
      //   name: '飞机模型',
      //   position: cartesianPnt,
      //   model: new Cesium.ModelGraphics({
      //     uri: '/glb/Cesium_Air.glb',
      //     minimumPixelSize: 128,
      //     scale: 2.0,
      //   }),
      // })
      // viewer.flyTo(Model, {
      //   duration: 1.8,
      // })
      /* let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction(
        function(movement) {
          var cartesian = viewer.camera.pickEllipsoid(
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
    backToHome() {
      const { camera } = viewer;
      camera.flyHome(2);
    },
    positionCamera() {
      const { camera } = viewer;
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
    simulatedFlight() {
      this.Collection && this.Collection.entities.removeAll()
      
      const { camera, scene } = viewer;
      const { globe } = scene;
      window.clickHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      let step = 0;
      this.Collection = new Cesium.CustomDataSource("path");
      const Pnt = new Cesium.PointGraphics({
        pixelSize: 6,
        outlineColor: Cesium.Color.ORANGERED,
        outlineWidth: 4,
      });
      var Modal = this.Collection.entities.add({
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
      viewer.dataSources.add(this.Collection);
      window.clickHandler.setInputAction(
        function({ position }) {
          var cartesian = this.getPickPosition(position);
          if (cartesian) {
            cartesian;
            this.positionList[step] = cartesian;
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
      window.clickHandler.setInputAction(
        function({ position }) {
          window.clickHandler.removeInputAction(LEFT_CLICK);
          if (step > 1) {
            // 飞行
            //Set bounds of our simulation time
            var start = Cesium.JulianDate.fromDate(new Date());
           
            var property = new Cesium.SampledPositionProperty();
            let timeArr = [start];
            for (let index = 1; index < step; index++) {
              timeArr[index] = Cesium.JulianDate.addSeconds(
                timeArr[index-1],
                24,
                new Cesium.JulianDate()
              );
            }
            let stop = timeArr[step-1].clone()
            viewer.clock.startTime = start.clone();
            viewer.clock.stopTime = timeArr[step-1].clone();
            viewer.clock.currentTime = start.clone();
            /* viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; */
            viewer.clock.multiplier = 1;
            /* viewer.timeline.zoomTo(start,stop); */

            Modal.position = property;
            Modal.polyline.positions = this.positionList;
            Modal.orientation = new Cesium.VelocityOrientationProperty(
              property
            );
            step = 0;
            
          }
        }.bind(this),
        RIGHT_CLICK
      );
    },
    getPickPosition(position) {
      const pickedObject = viewer.scene.pick(position);
      if (viewer.scene.pickPositionSupported && Cesium.defined(pickedObject)) {
        return viewer.scene.pickPosition(position);
      } else {
        let ray = viewer.camera.getPickRay(position);
        return viewer.scene.globe.pick(ray, viewer.scene);
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
  .cesium-viewer-bottom {
    display: none;
  }
  .cesium-animation-buttonDisabled {
    display: none;
  }
  .ivu-btn-group {
    display: block;
    margin-bottom: 6px;
  }
}
</style>
