<template>
  <div id="cesiumContainer">
    <div id="cntorler">
      <button @click="startHeight">高度测量</button>
      <div id="mycharts"></div>
    </div>
  </div>
</template>
<script>
const Cesium = require("cesium/Cesium");
export default {
  name: "CesiumScene",
  data() {
    return {
      rangingTool: null,
      DigFill: null,
      height: 300,
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    test111() {
      this.DigFill.test();
    },
    init() {
      const terrainProvider = new Cesium.CesiumTerrainProvider({
        requestVertexNormals: true,
        url: "http://192.168.1.210:8085/terrain/",
      });

      const viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider,
        baseLayerPicker: false,
        fullscreenButton: false,
        scene3DOnly: true,
        animation: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        geocoder: false,
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
          url: "http://192.168.1.210:9091/files/tiles/{z}/{x}/{y}.png"
        }),
      });
      const { camera, scene } = viewer;
      const { globe} = scene;
      globe.enableLighting = true;
      globe.depthTestAgainstTerrain = true;
      const tileset = new Cesium.Cesium3DTileset({
        url: "./Tileset/tileset.json",
      });
      tileset.readyPromise
        .then(function() {
          camera.viewBoundingSphere(
            tileset.boundingSphere,
            new Cesium.HeadingPitchRange(0, -0.5, 0)
          );
          camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
          const heightOffset = 70.0;
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
    cancel() {},
    startHeight() {},
    startTriangle() {},
    startEarthwork() {},
  },
};
</script>

<style lang="scss" scoped>
@import url("~cesium/Widgets/widgets.css");
#cesiumContainer {
  #mycharts {
    display: none;
  }
}
</style>
