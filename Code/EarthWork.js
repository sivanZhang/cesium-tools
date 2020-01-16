/**
 * 挖填方分析
 * @Author DY
 */
// import {Function} from "./Function.js";
import {MouseHandler} from "../MouseHandler.js";
import {Speed3D_viewer} from "../../Constants.js";
import {Billboard} from "../../Entity/Billboard.js";
import {Line} from "../../Entity/Line.js";
import {TerrainHeight} from "../../Math/BasicMath/TerrainHeight.js";
import {Coordinate} from "../../Math/BasicMath/Coordinate.js";
import {Polygon} from "../../Math/BasicMath/Geometry/2D/Polygon.js";

class EarthWork extends MouseHandler {
    constructor(config = {}) {
        super(config);
        // this = new MouseHandler();
        this.startMessage = config.startMessage ? config.startMessage : '挖填方分析开始,请划归区域。';
        this.pendingMessage = config.pendingMessage ? config.pendingMessage : '挖填方分析进行中，请稍候';
        this.endMessage = config.endMessage ? config.endMessage : '已完成';
        this.onSuccess = (matrix,tmpPolygon) => {
            if(matrix !== undefined) {

                this.returnData = this.getPropertiesNumber(matrix, tmpPolygon);
                TerrainHeight.loadEarthWork(matrix, this.returnData, this.digColor, this.fillColor);
                this.showMessage('已完成');
            } else {
                console.log('挖方区域面积过小，无法计算土方体积');

                this.showMessage('挖方区域面积过小，无法计算土方体积');
            }
            this.targetHeight = undefined;
            config.onSuccess && config.onSuccess();
        };
        this.onFail = config.onFail ? config.onFail : () => {
            this.showMessage('失败');
        };
        this.terrainProvider = config.terrainProvider ? config.terrainProvider : Speed3D_viewer.viewer.terrainProvider;
        this.bindElment = config.bindElment ? config.bindElment : '';
        this.granularity = (config.granularity !== undefined && config.granularity !== null) ? config.granularity : undefined;
        this.targetHeight = (config.targetHeight !== undefined && config.targetHeight !== null) ? config.targetHeight : undefined;
        this.digColor = config.digColor ? config.digColor : '#FF8C37';
        this.fillColor = config.fillColor ? config.fillColor : '#ffaaff';
        this.returnData = null;

        // 可视化相关
        this.positions = [];
        this.currentLineEntity = [];
        this.currentPointEntity = [];
        this.supportLine = null;
        this.currentPolygonEntity = null;
    }

    set config(conf) {
        this.setOnSuccess(conf.onSuccess);
        this.setOnFail(conf.onFail);
        this.setCallBack(conf.callback);
        this.setBindElment(conf.bindElment);
        this.setStartMessage(conf.startMessage);
        this.setPendingMessage(conf.pendingMessage);
        this.setEndMessage(conf.endMessage);
        this.setGranularity(conf.granularity);
        this.setTerrainProvider(conf.terrainProvider);
        this.setTargetHeight(conf.targetHeight);
        this.setDigColor(conf.digColor);
        this.setFillColor(conf.fillColor);
    }

    setDigColor(digColor) {
        this.digColor = digColor ? digColor : '#FF8C37';
    }

    setFillColor(fillColor) {
        this.fillColor = fillColor ? fillColor : '#ffaaff';
    }

    setTerrainProvider(terrainProvider) {
        this.terrainProvider = terrainProvider ? terrainProvider : Speed3D_viewer.viewer.terrainProvider;
    }

    setGranularity(granularity) {
        this.granularity = (granularity !== undefined && granularity !== null) ? granularity : undefined;
    }

    setCallBack(callBack) {
        if (Array.isArray(callBack)) {
            this.setOnSuccess(callBack.shift());
            this.setOnFail(callBack.shift());
        }
    }

    setStartMessage(startMessage) {
        this.startMessage = startMessage ? startMessage : '挖填方分析开始';
    }

    setPendingMessage(pendingMessage) {
        this.pendingMessage = pendingMessage ? pendingMessage : '挖填方分析进行中，请稍候';
    }

    setEndMessage(endMessage) {
        this.endMessage = endMessage ? endMessage : '已完成';
    }

    setBindElment(id) {
        this.bindElment = id ? id : '';
    }

    showMessage(msg) {
        console.log('...........................................');
        let element = document.getElementById(this.bindElment);
        if (element) {
            element.innerHTML = msg;
            element.hidden = true;
        }
    }

    setOnSuccess(fn) {
        this.onSuccess = fn ? fn : (matrix,tmpPolygon) => {
            if(matrix !== undefined) {
                this.returnData = this.getPropertiesNumber(matrix, tmpPolygon);
                TerrainHeight.loadEarthWork(matrix, this.returnData, this.digColor, this.fillColor);
                this.showMessage('已完成');
            } else {
                this.showMessage('挖方区域面积过小，无法计算土方体积');
            }
            this.targetHeight = undefined;
        };
    }

    setOnFail(fn) {
        this.onFail = fn ? fn : (msg) => {
            console.log(msg);
            let element = document.getElementById(this.bindElment);
            if (element) {
                element.innerHTML = '失败';
            }
        };
    }

    setTargetHeight(targetHeight) {
        this.targetHeight = (targetHeight !== undefined && targetHeight !== null) ? targetHeight : undefined;
    }

    start() {
        let element = document.getElementById(this.bindElment);
        if(element){
            element.hidden = false;
            element.innerHTML = this.startMessage;
            element.innerHTML += '请标记多段连线,双击结束。';
        }
        this.bindMouseEvent('LEFT_CLICK', (movement) => {
            if (this.positions.length < 1) {
                let position = this._getCoordinates(movement.position);
                if (position) {
                    this.positions.push(position);
                    this.currentPointEntity.push(new Billboard({position: position}));
                }
            } else if (this.positions.length === 1) {
                let position = this._getCoordinates(movement.position);
                if (position) {
                    this.positions.push(position);
                    this.currentPointEntity.push(new Billboard({position: position}));
                    this.currentLineEntity.push(new Line({position: this.positions}));
                }
            } else if (this.positions.length > 1) {
                let config = this.getObject(movement);
                //检测当前点击的位置是否点击到已存在的点,并且返回序号
                let r = this.checkIfHitGrab(config, [this.positions[this.positions.length - 1]])
                if (r && r.result) {
                    this.currentLineEntity.push(new Line({position: [this.positions[0], this.positions[this.positions.length - 1]]}));
                    this.calculateEarthwork();
                } else {
                    let position = this._getCoordinates(movement.position);
                    if (position) {
                        this.positions.push(position);
                        this.currentPointEntity.push(new Billboard({position: position}));
                        this.currentLineEntity[0].setPosition(this.positions, true);
                    }
                }
                // this.end(false);
                if (this.supportLine !== null) {
                    this.supportLine.destroy();
                    this.supportLine = null;
                }
            }
        });
        //橡皮筋
        this.bindMouseEvent('MOUSE_MOVE', (movement) => {
            if (this.positions.length >= 1) {
                let p1 = [this.positions[this.positions.length - 1], this._getCoordinates(movement.endPosition)];
                if (p1) {
                    if (this.supportLine === null) {
                        this.supportLine = new Line({position: [0, 0, 0, 0, 0, 0]});
                    }
                    this.supportLine.setPosition(p1, false)
                }
            }
        });

        this.bindMouseEvent('LEFT_DOUBLE_CLICK',(movement)=> {
            if(this.positions.length > 3) {
                let position = this.positions[0];
                if (position) {
                    this.positions.push(position);
                    this.currentPointEntity.push(new Billboard({position: position}));
                }
                //this.positions  cartesion
                this.calculateEarthwork();
            }
            this.end(this.positions.length <= 2);
        })
    }
    // 返回matrix 并且执行onSuccess
    calculateEarthwork() {
        // jin
        let tmpPolygon = new Polygon(Coordinate.CartesianArrayToCartographicArray(this.positions));
        TerrainHeight.getRectangleMatrix({
            granularity: this.granularity,
            terrainProvider: this.terrainProvider,
            Polygon: tmpPolygon
        }, (matrix) => {
            this.onSuccess(matrix, tmpPolygon);
            this.end(false);
        }, this.onFail);
    }

    getPropertiesNumber(matrix, Polygon) {
        // 如果基准高没有 获取基准高
        if (this.targetHeight === undefined) {
            let sum = 0, count = 0;
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix[i].length; j++) {
                    if (matrix[i][j] !== 0) {
                        sum += matrix[i][j].height;
                        count++;
                    }
                }
            }
            // QS：平均高？
            this.targetHeight = sum / count;
        }
        let digHeight = 0, digCount = 0, fillHeight = 0, fillCount = 0;
        // matrix 矩阵  微分
        for (let i = 0; i < matrix.length; i++) {

            for (let j = 0; j < matrix[i].length; j++) {
                if (matrix[i][j] !== 0) {
                    if (matrix[i][j].height > this.targetHeight) {
                        digHeight += matrix[i][j].height;
                        matrix[i][j].Speed3DEWA = 1; // 自定义 应该是标记
                        digCount++;
                    } else {
                        fillCount++;
                        matrix[i][j].Speed3DEWA = 2;
                        fillHeight += matrix[i][j].height;
                    }
                }
            }
        }
        let avgDigHeight = digHeight / digCount - this.targetHeight,//  填方的平均高
            avgFillHeight = this.targetHeight - fillHeight / fillCount,// 挖方的平均高
            totalArea = Polygon.area();// 多边形面积
        if (digCount === 0 && digHeight === 0) {
            avgDigHeight = -this.targetHeight;
        }
        if (fillCount === 0 && fillHeight === 0) {
            avgFillHeight = this.targetHeight;
        }
        
        let fillArea = totalArea * avgFillHeight / (avgFillHeight + avgDigHeight),
            digArea = totalArea * avgDigHeight / (avgFillHeight + avgDigHeight);
        // console.log(`fillArea : ${fillArea}, digArea : ${digArea}, fillAmount : ${fillAmount}, digAmount : ${digAmount}`);
        return {
            fillArea: fillArea,
            digArea: digArea,
            fillAmount: (fillArea * avgFillHeight),
            digAmount: (digArea * avgDigHeight)
        }
    }

    static testSame(target, origin) {
        return origin[0].x === target.x;
    }

    clear(needClear = true) {
        if (needClear === true) {
            let element = document.getElementById(this.bindElment);
            if (element) element.innerHTML = '';
        }
        if (this.currentPolygonEntity !== null) {
            this.currentPolygonEntity.destroy();
            this.currentPolygonEntity = null;
        }
        for (let i = 0; i < this.currentLineEntity.length; i++) {
            let a = this.currentLineEntity.pop();
            a.destroy();
            i--;
        }
        for (let i = 0; i < this.currentPointEntity.length; i++) {
            let a = this.currentPointEntity.pop();
            a.destroy();
            i--;
        }
        for (let i = 0; i < this.positions.length; i++) {
            this.positions.pop();
            i--;
        }
        if (this.supportLine !== null) {
            this.supportLine.destroy();
            this.supportLine = null;
        }
    }

    end(needClear = true) {
        if (needClear === false) {
            let element = document.getElementById(this.bindElment);
            if (element) element.innerHTML = this.pendingMessage;
        }
        this.clearMouseEvents();
        if (needClear === true) {
            this.terrainProvider = null;
            delete  this.terrainProvider;
            this.clear();
            // document.getElementById('Speed3d_echarts').style.display = 'none';
            TerrainHeight.removeChart();
            return this.returnData;
        }
    }
}

export {EarthWork}

//mm.startFunction('EarthWorkAnalysis',{bindElment:'showmsg',granularity:0.001})
