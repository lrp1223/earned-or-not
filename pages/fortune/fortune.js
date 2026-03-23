// pages/fortune/fortune.js
Page({
  data: {
    today: '',
    constellation: '',
    fortuneScore: 0,
    fortuneLevel: 0,
    fortuneText: '',
    suitable: '',
    unsuitable: '',
    luckyNumber: '',
    luckyDirection: '',
    luckyColor: ''
  },

  onShow() {
    this.loadFortune();
  },

  loadFortune() {
    const settings = wx.getStorageSync('userSettings') || {};
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}`;
    
    this.setData({ 
      today: dateStr,
      constellation: settings.constellation || ''
    });

    if (!settings.constellation) {
      this.setData({
        fortuneScore: 0,
        fortuneLevel: 0,
        fortuneText: '请先设置生日查看运势'
      });
      return;
    }

    // 计算今日运势
    const fortune = this.calculateFortune(settings.constellation, dateStr, settings);
    this.setData(fortune);
  },

  calculateFortune(constellation, dateStr, settings) {
    // 用日期做种子，保证同一天结果一致
    const seed = this.hashCode(dateStr + constellation);
    const random = this.seededRandom(seed);
    
    // 星座基础分（火象星座基础分高）
    const fireSigns = ['白羊座', '狮子座', '射手座'];
    const waterSigns = ['巨蟹座', '天蝎座', '双鱼座'];
    let baseScore = 50;
    if (fireSigns.includes(constellation)) baseScore = 65;
    else if (waterSigns.includes(constellation)) baseScore = 55;
    
    // 日期随机分（-20到+20）
    const randomScore = Math.floor(random * 40) - 20;
    
    // 近期战绩分（从本地存储读取）
    const recentScore = this.getRecentFortuneScore();
    
    // 总分（0-100）
    let totalScore = baseScore + randomScore + recentScore;
    totalScore = Math.max(0, Math.min(100, totalScore));
    
    // 计算星级（1-5星）
    const level = Math.ceil(totalScore / 20);
    
    // 运势文案
    const texts = [
      '今日忌赌，不如在家睡觉',
      '时运不济，建议修身养性',
      '运势平平，观望为主',
      '手气正旺，小额试水为佳',
      '赌神附体，今日宜大额投注'
    ];
    
    // 宜忌
    const suitableList = ['小额投注', '追加投注', '观望', '休息', '请客吃饭'];
    const unsuitableList = ['倍投', '大额投注', '借钱买彩', '冲动消费', '追号'];
    
    // 幸运方位
    const directions = ['东', '南', '西', '北', '东南', '东北', '西南', '西北'];
    const luckyDir = directions[Math.floor(random * directions.length)];

    // 幸运色
    const colors = ['红色', '黄色', '蓝色', '绿色', '紫色', '金色'];
    const luckyCol = colors[Math.floor(random * colors.length)];

    // 生成幸运号码
    const lotteryNumbers = this.generateLotteryNumbers(dateStr, constellation);

    return {
      fortuneScore: totalScore,
      fortuneLevel: level,
      fortuneText: texts[level - 1] || texts[2],
      suitable: suitableList[Math.floor(random * suitableList.length)],
      unsuitable: unsuitableList[Math.floor(random * unsuitableList.length)],
      luckyDirection: luckyDir,
      luckyColor: luckyCol,
      lotteryType: lotteryNumbers.type,
      redBalls: lotteryNumbers.redBalls,
      blueBalls: lotteryNumbers.blueBalls
    };
  },

  // 生成幸运号码（大乐透或双色球）
  generateLotteryNumbers(dateStr, constellation) {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0=周日, 1=周一, ..., 6=周六

    // 周一(1)、三(3)、五(5)、六(6) -> 大乐透
    // 周二(2)、四(4)、日(0) -> 双色球
    const isDaLeTou = [1, 3, 5, 6].includes(day);

    // 用日期+星座做种子，保证同一天结果一致
    const seed = this.hashCode(dateStr + constellation + 'lottery');
    const random = this.seededRandom(seed);

    if (isDaLeTou) {
      // 大乐透：前区 1-35 选5个，后区 1-12 选2个
      const redBalls = this.generateUniqueNumbers(seed, 5, 1, 35);
      const blueBalls = this.generateUniqueNumbers(seed + 100, 2, 1, 12);
      return { type: '大乐透', redBalls, blueBalls };
    } else {
      // 双色球：红球 1-33 选6个，蓝球 1-16 选1个
      const redBalls = this.generateUniqueNumbers(seed, 6, 1, 33);
      const blueBalls = this.generateUniqueNumbers(seed + 100, 1, 1, 16);
      return { type: '双色球', redBalls, blueBalls };
    }
  },

  // 生成不重复的随机号码
  generateUniqueNumbers(seed, count, min, max) {
    const numbers = new Set();
    let offset = 0;
    while (numbers.size < count) {
      const random = this.seededRandom(seed + offset);
      const num = Math.floor(random * (max - min + 1)) + min;
      numbers.add(num);
      offset++;
    }
    return Array.from(numbers).sort((a, b) => a - b);
  },

  // 字符串哈希
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  },

  // 种子随机数
  seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  },

  // 获取近期战绩分（最近5次记录）
  getRecentFortuneScore() {
    // 简化处理，返回0-10的随机分
    // 实际应该从记录中计算胜率
    return 0;
  }
});