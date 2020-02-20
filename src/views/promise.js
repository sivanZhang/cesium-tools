
class PromiseChain {
    constructor(promises, resolve, reject) {
        this.promises = [];
        this.reject = () => {
            console.log(`default reject,请添加失败回调。`);
        };
        this.resolve = () => {
            console.log(`default resolve,请添加成功回调。`);
        };
        this.add(promises);
        this.setResolve(resolve);
        this.setReject(reject);
    }

    all(...arg) {
        if (this.promises.length === 0) {
            // success Fn
            console.log(arg,'真正的...arg')
            this.resolve(arg);
        } else {
            let current = new Promise(this.promises.shift());
            current.then((res) => {
                this.all(...arg,res);
            }).catch((...args) => {
                console.log(...args, '...errrrrrrrrrr')
                while (this.promises.length > 0) {
                    this.promises.shift();
                }
                this.reject(...args);
            });
        }
    }
    setResolve(resolve) {
        if (resolve instanceof Function) {
            this.resolve = resolve;
        }
    }

    setReject(reject) {
        if (reject instanceof Function) {
            this.reject = reject;
        }
    }
    add(promises) {
        if (promises) {
            if (Array.isArray(promises)) {
                for (let i = 0; i < promises.length; i++) {
                    if (promises[i] instanceof Function) this.promises.push(promises[i]);
                }
            } else {
                if (promises instanceof Function) this.promises.push(promises);
            }
        }
    }
}
export default PromiseChain