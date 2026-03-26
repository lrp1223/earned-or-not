// pages/feihuaGame/poems.js
// 飞花令常用诗句
const poems = {
  '春': [
    '春眠不觉晓', '春风又绿江南岸', '春色满园关不住', '春江水暖鸭先知',
    '春风得意马蹄疾', '春蚕到死丝方尽', '春风不度玉门关', '春潮带雨晚来急',
    '春风十里扬州路', '春风桃李花开日', '春城无处不飞花', '春风疑不到天涯'
  ],
  '花': [
    '花落知多少', '花重锦官城', '花间一壶酒', '花开时节动京城',
    '花有清香月有阴', '花自飘零水自流', '花径不曾缘客扫', '花底滑声莺语碎',
    '花开堪折直须折', '花近高楼伤客心', '花褪残红青杏小', '花影参差入梦来'
  ],
  '月': [
    '月落乌啼霜满天', '月出惊山鸟', '月是故乡明', '月黑雁飞高',
    '月上柳梢头', '月如钩', '月满西楼', '月照花林皆似霰',
    '月落乌啼霜满天', '月出东山之上', '月明松下房栊静', '月落星稀天欲明'
  ],
  '风': [
    '风吹草低见牛羊', '风雨送春归', '风正一帆悬', '风雨不动安如山',
    '风急天高猿啸哀', '风雪夜归人', '风吹柳花满店香', '风烟望五津',
    '风萧萧兮易水寒', '风雨如晦', '风声鹤唳', '风月无边'
  ],
  '雨': [
    '雨打梨花深闭门', '雨过天晴云破处', '雨横风狂三月暮', '雨霖铃',
    '雨中黄叶树', '雨后复斜阳', '雨送黄昏花易落', '雨余芳草净沙尘'
  ],
  '山': [
    '山重水复疑无路', '山外青山楼外楼', '山色空蒙雨亦奇', '山回路转不见君',
    '山气日夕佳', '山河表里潼关路', '山舞银蛇', '山随平野尽'
  ],
  '水': [
    '水光潋滟晴方好', '水村山郭酒旗风', '水深波浪阔', '水何澹澹',
    '水调歌头', '水自东流', '水天一色', '水落石出'
  ],
  '人': [
    '人生自古谁无死', '人面桃花相映红', '人生得意须尽欢', '人约黄昏后',
    '人生若只如初见', '人间四月芳菲尽', '人闲桂花落', '人生如梦'
  ],
  '天': [
    '天涯若比邻', '天生我材必有用', '天长地久有时尽', '天街小雨润如酥',
    '天涯共此时', '天苍苍野茫茫', '天阶夜色凉如水', '天下谁人不识君'
  ],
  '云': [
    '云深不知处', '云想衣裳花想容', '云横秦岭家何在', '云中谁寄锦书来',
    '云淡风轻近午天', '云破月来花弄影', '云树绕堤沙', '云开见月明'
  ]
};

// 所有关键字
const keys = Object.keys(poems);

// 获取随机关键字
function getRandomKey() {
  return keys[Math.floor(Math.random() * keys.length)];
}

// 获取包含关键字的诗句
function getPoemsByKey(key) {
  return poems[key] || [];
}

// 检查诗句是否包含关键字
function containsKey(poem, key) {
  return poem.includes(key);
}

// 检查诗句是否有效
function isValidPoem(poem, key, usedPoems) {
  if (!containsKey(poem, key)) return false;
  if (usedPoems.includes(poem)) return false;
  return true;
}

// AI回应
function getAIResponse(key, usedPoems) {
  const candidates = getPoemsByKey(key).filter(p => !usedPoems.includes(p));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

module.exports = {
  keys,
  poems,
  getRandomKey,
  getPoemsByKey,
  containsKey,
  isValidPoem,
  getAIResponse
};
