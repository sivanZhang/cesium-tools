export default class CesiumTools {
    constructor(Cesium, viewer) {
        this.$Cesium = Cesium
        this.$viewer = viewer
        // default label
        this.$label = {
            font: '16px sans-serif',
            showBackground: true,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            pixelOffset: new Cesium.Cartesian2(0, 0),
            eyeOffset: new Cesium.Cartesian3(0, 0, -50),
            fillColor: Cesium.Color.WHITE
        }
        this._handler = new this.$Cesium.ScreenSpaceEventHandler(
            this.$viewer.scene.canvas
        )
    }
    // 事件列表
    _eventList = []
	/**
	 * 清空绑定的Cesium事件
	 * @param {String | Array<String> | null} eventType ScreenSpaceEventType类型，不传值解绑所有_eventList中注册事件，传单个字符串注销单个事件，传数组注销多个事件
	 **/
    $removeEvent(eventType = null) {
        if (!eventType) {
            this._eventList.forEach(e => {
                this._handler.removeInputAction(this.$Cesium.ScreenSpaceEventType[e])
            })
            this._eventList = []
        } else {
            if (Array.isArray(eventType)) {
                eventType.forEach(e => {
                    this._handler.removeInputAction(this.$Cesium.ScreenSpaceEventType[e])
                    const removeIndex = this._eventList.findIndex(item => item === e)
                    this._eventList.splice(removeIndex, 1)
                })
            } else {
                this._handler.removeInputAction(
                    this.$Cesium.ScreenSpaceEventType[eventType]
                )
                const removeIndex = this._eventList.findIndex(item => item === eventType)
                this._eventList.splice(removeIndex, 1)
            }
        }
    }
    /**
     * 绑定的Cesium事件
     * @param {String} eventType ScreenSpaceEventType类型，不传值解绑所有_eventList中注册事件，传单个字符串注销单个事件，传数组注销多个事件
     * @param {Function} callBack 事件触发后的回调函数
     **/
    $bindEvent(eventType, callBack) {
        if (eventType && this._eventList.includes(eventType)) {
            this.$removeEvent(eventType)
        }
        if (eventType) {
            this._handler.setInputAction(
                callBack,
                this.$Cesium.ScreenSpaceEventType[eventType]
            )
            this._eventList.push(eventType)
        }
    }
	/**
	 * 获取"拾取点"的位置
	 * @param {Object} position 输入事件对象中的position
	 * @return {Cartesian3} 输入事件的位置
	 **/
    $getPickPosition(position) {
        const pickedObject = this.$viewer.scene.pick(position)
        if (
            this.$viewer.scene.pickPositionSupported &&
            this.$Cesium.defined(pickedObject)
        ) {
            return this.$viewer.scene.pickPosition(position)
        } else {
            let ray = this.$viewer.camera.getPickRay(position)
            return this.$viewer.scene.globe.pick(ray, this.$viewer.scene)
        }
    }
}