class ElementPool {
  constructor(createFunc, resetFunc, maxSize = 20) {
    this.pool = [];
    this.createFunc = createFunc;
    this.resetFunc = resetFunc;
    this.maxSize = maxSize;
  }

  acquire(...args) {
    if (this.pool.length > 0) {
      const element = this.pool.pop();
      this.resetFunc(element, ...args);
      return element;
    }
    return this.createFunc(...args);
  }

  release(element) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(element);
    } else if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}

module.exports = ElementPool;