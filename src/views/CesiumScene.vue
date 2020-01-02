<template>
  <div id="cesiumContainer"></div>
</template>

<script>
let Cesium = require("cesium/Cesium");
export default {
  name: "CesiumScene",
  data() {
    return {};
  },
  mounted() {
    this.init();
  },
  beforeDestroy() {},
  methods: {
    init() {
      Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkODZjOGY4Yy1jOGEzLTRlNzMtYTdlMS03ZWQ5MmE4M2RkMzEiLCJpZCI6MjA0NTYsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1Nzc0NzI0Nzd9.3OfoKjLexR3j8kcepsM_h0hj1vEpS0jd_aw9n-izLKk";
      const viewer = new Cesium.Viewer("cesiumContainer");
      const canvas = viewer.scene.canvas;
      const mouseHander = new Cesium.ScreenSpaceEventHandler(canvas);
      let windowPosition;
      mouseHander.setInputAction(function(event) {
        // 获取鼠标点的windowPosition
        windowPosition = event.position;
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
  }
};
</script>

<style lang='scss' scoped>
@import url("~cesium/Widgets/widgets.css");
#cesiumContainer {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>