const config = require('./config');
const ElementPool = require('./elementPool');

Page({
  data: {
    burnHeight: config.burning.burnHeightRange[0],
    incenseHeight: config.burning.initialHeight,
    startTime: 0,
    elapsedSeconds: 0,
    isRunning: false,
    burnInterval: null
  },

  // 元素池初始化
  elementPools: {},

  onReady: function() {
    this.getElements();
    this.initElementPools();
    this.startBurning();
  },

  onShow: function() {
    // 从本地存储恢复状态并双重校验
    const savedState = wx.getStorageSync('burningState');
    if (savedState && savedState.startTime > 0 && !this.data.isRunning) {
      const now = Date.now();
      // 计算系统时间差和存储的时间差，取较大值作为基准
      const systemElapsed = Math.floor((now - savedState.startTime) / 1000);
      const storageElapsed = savedState.elapsedSeconds + Math.floor((now - savedState.lastUpdate) / 1000);
      const elapsed = Math.max(systemElapsed, storageElapsed);
      this.setData({
        elapsedSeconds: elapsed,
        startTime: savedState.startTime,
        isRunning: true
      });
      this.startBurning();
    } else if (this.data.startTime > 0 && !this.data.isRunning) {
      // 原有逻辑，处理未使用本地存储的情况
      const now = Date.now();
      const elapsed = Math.floor((now - this.data.startTime) / 1000);
      this.setData({
        elapsedSeconds: elapsed,
        isRunning: true
      });
      this.startBurning();
    }
  },

  onHide: function() {
    // 保存当前燃烧状态到本地存储
    if (this.data.isRunning) {
      wx.setStorageSync('burningState', {
        startTime: this.data.startTime,
        elapsedSeconds: this.data.elapsedSeconds,
        lastUpdate: Date.now()
      });
    }
    // 注释掉清除定时器的代码，使后台继续运行
    // if (this.data.isRunning) {
    //   clearInterval(this.data.burnInterval);
    //   this.setData({
    //     isRunning: false
    //   });
    // }
  },

  // 初始化元素池
  initElementPools() {
    // 延迟初始化元素池直到首次使用
    if (!this.elementPools.sparks) {
      this.elementPools.sparks = new ElementPool(
        () => this.createSparkElement(),
        (el, options) => this.resetSparkElement(el, options),
        15
      );
    }

    // 香灰元素池
    this.elementPools.ash = new ElementPool(
      () => this.createAshElement(),
      (el, options) => this.resetAshElement(el, options),
      20
    );
  },

  // 创建火星元素
  createSparkElement() {
    const sparkEl = document.createElement('div');
    sparkEl.className = 'spark';
    sparkEl.style.position = 'absolute';
    sparkEl.style.background = 'radial-gradient(circle, #FFEB3B 0%, #FF5722 70%, #795548 100%)';
    sparkEl.style.borderRadius = '50%';
    sparkEl.style.opacity = '0';
    sparkEl.style.zIndex = '1';
    sparkEl.style.pointerEvents = 'none';
    return sparkEl;
  },

  // 重置火星元素
  resetSparkElement(el, options) {
    const { size, x, y, sparkX, sparkY, duration } = options;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = 'translate(0, 0)';
    el.style.opacity = '0';
    el.style.animation = `sparkFly ${duration}s linear forwards`;
    return el;
  },

  // 创建香灰元素
  createAshElement() {
    const ash = document.createElement('div');
    ash.className = 'ash';
    ash.style.position = 'absolute';
    ash.style.background = 'linear-gradient(135deg, #eee 60%, #ccc 100%)';
    ash.style.borderRadius = '30% 70% 60% 40% / 60% 40% 70% 30%';
    ash.style.opacity = '0';
    ash.style.zIndex = '1';
    ash.style.pointerEvents = 'none';
    return ash;
  },

  // 重置香灰元素
  resetAshElement(el, options) {
    const { width, height, x } = options;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.style.left = `${x}px`;
    el.style.top = '-5px';
    el.style.opacity = '0';
    return el;
  },

  startBurning: function() {
    const totalSeconds = config.burning.totalMinutes * 60;
    let startTime = this.data.startTime || Date.now();
    let elapsedSeconds = this.data.elapsedSeconds || 0;

    if (!this.data.startTime) {
      this.setData({
        startTime: startTime
      });
    }

    this.clearInterval();
    this.startBurnInterval(totalSeconds, startTime);
  },

  // 启动燃烧定时器
  startBurnInterval(totalSeconds, startTime) {
    const burnInterval = setInterval(() => {
      try {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);

        this.updateBurningState(elapsedSeconds, totalSeconds);
        this.createSpark(elapsedSeconds, totalSeconds);
        this.createAsh(elapsedSeconds, totalSeconds);

        if (elapsedSeconds >= totalSeconds) {
          this.completeBurning();
        }
      } catch (error) {
        console.error('燃烧过程出错:', error);
        this.completeBurning();
      }
    }, 1000);

    this.setData({
      burnInterval: burnInterval,
      isRunning: true
    });
  },

  // 更新燃烧状态
  updateBurningState(elapsedSeconds, totalSeconds) {
    const burnHeight = config.burning.burnHeightRange[0] + 
      Math.sin(elapsedSeconds / 10) * 
      (config.burning.burnHeightRange[1] - config.burning.burnHeightRange[0]);

    const incenseHeight = config.burning.initialHeight - 
      (elapsedSeconds / totalSeconds) * (config.burning.initialHeight - 20);

    this.setData({
      elapsedSeconds: elapsedSeconds,
      burnHeight: burnHeight,
      incenseHeight: incenseHeight
    });
  },

  // 创建火星效果
  createSpark(elapsedSeconds, totalSeconds) {
      // 新增燃烧状态检查
      if (!this.data.isRunning) return;
      if (elapsedSeconds < totalSeconds * config.animation.spark.triggerPercent) return;
      if (Math.random() > config.animation.spark.frequency) return;

    try {
      const size = Math.random() * (config.animation.spark.sizeRange[1] - config.animation.spark.sizeRange[0]) + config.animation.spark.sizeRange[0];
      const x = Math.random() * 6 - 3;
      const y = Math.random() * 5 - 5;
      const distance = Math.random() * (config.animation.spark.distanceRange[1] - config.animation.spark.distanceRange[0]) + config.animation.spark.distanceRange[0];
      const angle = Math.random() * (config.animation.spark.angleRange[1] - config.animation.spark.angleRange[0]) + config.animation.spark.angleRange[0];
      const sparkX = Math.sin(angle) * distance;
      const sparkY = -Math.cos(angle) * distance * 0.5;
      const duration = Math.random() * (config.animation.spark.durationRange[1] - config.animation.spark.durationRange[0]) + config.animation.spark.durationRange[0];

      wx.createSelectorQuery().select('#incenseBurn').fields({
        node: true,
        size: true
      }, res => {
        if (!res.node) return;

        const sparkEl = this.elementPools.sparks.acquire({
          size, x, y, sparkX, sparkY, duration
        });

        res.node.appendChild(sparkEl);

        setTimeout(() => {
          sparkEl.style.opacity = '0.8';
          sparkEl.style.transform = `translate(${sparkX}px, ${sparkY}px)`;
          setTimeout(() => {
            this.elementPools.sparks.release(sparkEl);
          }, config.animation.spark.lifetime);
        }, 10);
      }).exec();
    } catch (error) {
      console.error('创建火星效果失败:', error);
    }
  },

  // 创建香灰效果
  createAsh(elapsedSeconds, totalSeconds) {
    // 新增燃烧状态检查
    if (!this.data.isRunning) return;
    try {
      const ashFrequency = config.animation.ash.frequencyBase + 
        (elapsedSeconds / totalSeconds) * config.animation.ash.frequencyGrowth;

      if (Math.random() > ashFrequency) return;

      const width = Math.random() * (config.animation.ash.sizeRange.width[1] - config.animation.ash.sizeRange.width[0]) + config.animation.ash.sizeRange.width[0];
      const height = Math.random() * (config.animation.ash.sizeRange.height[1] - config.animation.ash.sizeRange.height[0]) + config.animation.ash.sizeRange.height[0];
      const x = Math.random() * 6 - 3;
      const duration = Math.random() * (config.animation.ash.durationRange[1] - config.animation.ash.durationRange[0]) + config.animation.ash.durationRange[0];

      wx.createSelectorQuery().select('#incenseBurn').fields({
        node: true,
        size: true
      }, res => {
        if (!res.node) return;

        const ash = this.elementPools.ash.acquire({
          width, height, x
        });

        res.node.appendChild(ash);

        setTimeout(() => {
          ash.style.opacity = '1';
          ash.style.animation = `fallAsh ${duration}s linear forwards`;
          ash.offsetHeight; // 强制浏览器渲染
          setTimeout(() => {
            this.elementPools.ash.release(ash);
          }, duration * 1000);
        }, 10);
      }).exec();
    } catch (error) {
      console.error('创建香灰效果失败:', error);
    }
  },

  // 完成燃烧
  completeBurning() {
    clearInterval(this.data.burnInterval);
    this.setData({
      isRunning: false,
      burnInterval: null
    });
    wx.createSelectorQuery().select('#incenseBurn').fields({
      node: true
    }, res => {
      if (res.node) {
        // 移除动画并隐藏香头
        res.node.style.animation = 'none';
        res.node.style.display = 'none';
        // 新增：彻底清除所有动画属性
        res.node.style.webkitAnimation = 'none';
        res.node.style.animationDuration = '0s';
      }
    }).exec();
    // 清空元素池
    this.clearElementPools();
  },

  // 清除定时器
  clearInterval() {
    if (this.data.burnInterval) {
      clearInterval(this.data.burnInterval);
    }
  },

  // 获取DOM元素
  getElements() {
    try {
      wx.createSelectorQuery().select('#incenseBurn').fields({
        node: true,
        size: true
      }, res => {
        this.incenseBurn = res.node;
      }).exec();

      wx.createSelectorQuery().select('#incense').fields({
        node: true,
        size: true
      }, res => {
        this.incense = res.node;
      }).exec();

      wx.createSelectorQuery().select('#ashPile').fields({
        node: true,
        size: true
      }, res => {
        this.ashPile = res.node;
      }).exec();
    } catch (error) {
      console.error('获取DOM元素失败:', error);
    }
  },

  // 清空元素池
  clearElementPools() {
    // 清空火星元素池
    if (this.elementPools.sparks && this.elementPools.sparks.pool) {
      this.elementPools.sparks.pool.forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      this.elementPools.sparks.pool = [];
    }
    // 清空香灰元素池
    if (this.elementPools.ash && this.elementPools.ash.pool) {
      this.elementPools.ash.pool.forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      this.elementPools.ash.pool = [];
    }
  }
});