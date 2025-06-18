module.exports = {
  // 燃烧配置
  burning: {
    totalMinutes: 25,
    initialHeight: 400,
    burnHeightRange: [10, 14],
    ashMaxCount: 60
  },
  // 动画配置
  animation: {
    spark: {
      sizeRange: [1, 3],
      distanceRange: [10, 40],
      angleRange: [-Math.PI/8, Math.PI/8],
      frequency: 0.08,
      triggerPercent: 0.1,
      lifetime: 2000,
      durationRange: [0.5, 2]
    },
    ash: {
      sizeRange: {
        width: [3, 8],
        height: [2, 5]
      },
      frequencyBase: 0.02,
      frequencyGrowth: 0.06,
      durationRange: [1, 3]
    }
  }
};