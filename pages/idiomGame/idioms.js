// pages/idiomGame/idioms.js
// 常用成语词库
const idioms = [
  '一心一意', '意气风发', '发扬光大', '大显身手', '手到擒来',
  '来日方长', '长治久安', '安居乐业', '业精于勤', '勤能补拙',
  '拙口笨腮', '腮帮子鼓', '鼓足干劲', '劲头十足', '足智多谋',
  '谋事在人', '人山人海', '海阔天空', '空前绝后', '后来居上',
  '上行下效', '效犬马力', '力不从心', '心直口快', '快马加鞭',
  '鞭长莫及', '及时行乐', '乐不思蜀', '蜀犬吠日', '日新月异',
  '异想天开', '开门见山', '山清水秀', '秀外慧中', '中流砥柱',
  '柱石之坚', '坚如磐石', '石破天惊', '惊天动地', '地大物博',
  '博古通今', '今非昔比', '比比皆是', '是是非非', '非同小可',
  '可歌可泣', '泣不成声', '声东击西', '西窗剪烛', '烛照数计',
  '计日程功', '功成名就', '就事论事', '事半功倍', '倍道而进',
  '进退两难', '难能可贵', '贵人多忘', '忘恩负义', '义不容辞',
  '辞旧迎新', '新陈代谢', '谢天谢地', '地动山摇', '摇头晃脑',
  '脑满肠肥', '肥头大耳', '耳聪目明', '明察秋毫', '毫不动摇',
  '摇旗呐喊', '喊冤叫屈', '屈指可数', '数典忘祖', '祖传秘方',
  '方兴未艾', '艾发衰容', '容光焕发', '发愤图强', '强词夺理',
  '理直气壮', '壮志凌云', '云开见日', '日理万机', '机不可失',
  '失不再来', '来龙去脉', '脉脉含情', '情投意合', '合家欢乐',
  '乐极生悲', '悲欢离合', '合情合理', '理直气壮', '壮志未酬'
];

// 获取随机成语
function getRandomIdiom() {
  return idioms[Math.floor(Math.random() * idioms.length)];
}

// 检查成语是否存在
function isValidIdiom(idiom) {
  return idioms.includes(idiom);
}

// 根据首字找成语
function findIdiomByFirstChar(char) {
  return idioms.filter(i => i[0] === char);
}

// 获取AI接龙成语（简单AI）
function getAIResponse(lastChar) {
  const candidates = findIdiomByFirstChar(lastChar);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

module.exports = {
  idioms,
  getRandomIdiom,
  isValidIdiom,
  findIdiomByFirstChar,
  getAIResponse
};
