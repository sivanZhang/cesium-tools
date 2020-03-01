import echarts from 'echarts'
export default class {
    constructor(domId, option = {}){
        let el = document.getElementById(domId)
        this.echart.style.display = "block"
        this.currentChart = echarts.init(el)
        this.currentChart.setOption(option)
    }
}