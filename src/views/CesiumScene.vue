<template>
  <div id="cesiumContainer">
    <div id="controller">
      <ButtonGroup>
        <Button @click="backToHome" icon="md-globe" size="small">复位</Button>
        <Button @click="simulatedFlight" icon="md-jet" size="small"
          >模拟飞行</Button
        >
        <Button icon="md-plane" size="small">安全起飞</Button>
        <Button @click="positionCamera" icon="md-locate" size="small"
          >定位</Button
        >
      </ButtonGroup>
    </div>
  </div>
</template>
<script>
const Cesium = require("cesium/Cesium");
const MOUSE_MOVE = Cesium.ScreenSpaceEventType.MOUSE_MOVE;
const LEFT_CLICK = Cesium.ScreenSpaceEventType.LEFT_CLICK
import { Button, ButtonGroup } from "view-design";
export default {
  name: "CesiumScene",
  components: {
    Button,
    ButtonGroup,
  },
  data() {
    return {
      Model: null,
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      globalThis.viewer = new Cesium.Viewer("cesiumContainer", {
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
      const Lable = viewer.entities.add({
        label: {
          showBackground: true,
          font: "14px monospace",
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(15, 0),
          disableDepthTestDistance: Infinity,
        },
      });
      const cartesianPnt = Cesium.Cartesian3.fromDegrees(90.3, 28.1, 10000);
      globalThis.Model = viewer.entities.add({
        name: "飞机模型",
        position: cartesianPnt,
        model: new Cesium.ModelGraphics({
          uri: "/glb/Cesium_Air.glb",
          minimumPixelSize: 128,
          scale: 2.0,
        }),
      });
      viewer.flyTo(Model, {
        duration: 1.8,
      });
      let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction(
        function(movement) {
          var cartesian = globalThis.viewer.camera.pickEllipsoid(
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
    backToHome() {
      const { camera, scene } = viewer;
      camera.flyHome(2);
    },
    positionCamera() {
      const { camera, scene } = viewer;
      camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(90.3, 27.6, 300000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-80.0),
          roll: 0.0,
        },
        duration: 2,
      });
    },
    // 模拟飞行
    simulatedFlight() {
      const { camera, scene } = viewer;
      const { globe } = scene;
      const AAAHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      let step = 0;

      const Collection = new Cesium.CustomDataSource("path");
      let startPnt = Collection.entities.add({
        point: {
          pixelSize: 8,
          color: Cesium.Color.YELLOW,
        },
      });
      let endPnt = Collection.entities.add({
        position: Cesium.Cartesian3.fromDegrees(1, 2, 0),
        point: {
          pixelSize: 8,
          color: Cesium.Color.YELLOW,
        },
      });
      let pathLine = Collection.entities.add({
        polyline: {
          pixelSize: 8,
          color: Cesium.Color.YELLOW,
        },
      });
      viewer.dataSources.add(Collection);
      // viewer.dataSources.remove(Collection, true);
      // Collection.entities.remove(Collection, true);
      let positionList = []


      AAAHandler.setInputAction(
        function(movement) {
          var cartesian = globalThis.viewer.camera.pickEllipsoid(
            movement.endPosition,
            scene.globe.ellipsoid
          );
          console.log('movement',movement);
          if (cartesian) {
            
            positionList[step] = cartesian
            step++;
            if(step===1){
              startPnt.position = cartesian
              pathLine.polyline.show =false
            }
            if(step===2){
              endPnt.position = cartesian
              pathLine.polyline.positions = positionList
              pathLine.polyline.show =true
              step = 0
            }
          }
        }.bind(this),
        LEFT_CLICK
      );
    },
    // 起飞范围
    takeoff() {},
  },
};
</script>

<style lang="scss" scoped>
#cesiumContainer {
  position: relative;
  #controller {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 10;
  }
}
</style>
