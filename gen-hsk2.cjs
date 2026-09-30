const fs = require('fs');
const hsk = JSON.parse(fs.readFileSync('public/hsk-vocab-json/hsk-level-2.json', 'utf8'));
const hsk1 = JSON.parse(fs.readFileSync('public/hsk-vocab-json/hsk-level-1.json', 'utf8'));
const chars = JSON.parse(fs.readFileSync('public/characters/characters.json', 'utf8'));

const dict = new Map();
// load HSK 1
hsk1.forEach(w => dict.set(w.hanzi, { pinyin: w.pinyin, meaning: w.vietnamese }));
// load HSK 2
hsk.forEach(w => dict.set(w.hanzi, { pinyin: w.pinyin, meaning: w.vietnamese }));

chars.forEach(c => {
    if (!dict.has(c.hanzi)) {
        dict.set(c.hanzi, { pinyin: c.pinyin, meaning: c.meaningVi });
    }
});

dict.set('，', {pinyin:'', meaning:'', isPunctuation:true});
dict.set('。', {pinyin:'', meaning:'', isPunctuation:true});
dict.set('！', {pinyin:'', meaning:'', isPunctuation:true});
dict.set('？', {pinyin:'', meaning:'', isPunctuation:true});
dict.set('“', {pinyin:'', meaning:'', isPunctuation:true});
dict.set('”', {pinyin:'', meaning:'', isPunctuation:true});
dict.set('、', {pinyin:'', meaning:'', isPunctuation:true});
dict.set('：', {pinyin:'', meaning:'', isPunctuation:true});

// A story using HSK2 and HSK1 words
const text = `今天早上我六点起床，洗了脸，吃了一个鸡蛋，喝了一杯牛奶。
因为天气不太好，天阴了，可能要下雨。所以我没有去跑步。
我对弟弟说：“你生病了吗？为什么你的脸色这么红？”
弟弟说：“我觉得有点儿累，可能感冒了。”
妈妈让弟弟休息，不要去上课了。她给弟弟吃药，希望他快点儿好。
上午九点，我坐公共汽车去学校。路上的车非常多，所以我迟到了。
老师问我：“你为什么现在才来？”我说：“对不起，路上太忙了。”
中午，我和朋友一起去饭馆吃午饭。我们吃得非常高兴。
下午，我们去商店买衣服。我看中了一件黑色的衣服，但是有点儿贵。
朋友说：“这件白色的比那件便宜，而且很漂亮。”所以，我买了白色的。
买完东西，我们去了旁边的咖啡馆。咖啡非常好喝。
从咖啡馆出来，我们往右走，到了一个大公园。我们在那里打篮球。
虽然我们觉得很累，但是很开心。
晚上，我回到家，爸爸正在看报纸。妈妈在做晚饭，有鱼和羊肉。
吃完晚饭，我帮妈妈洗碗。然后，我回房间做作业。
我正在准备明天的考试。希望我能考得很好！
十一点半，我上床睡觉。这真是非常忙碌的一天！`;

const paragraphs = [];

for (const line of text.split('\n')) {
  if (!line.trim()) continue;
  let i = 0;
  let parsedLine = [];
  while (i < line.length) {
    let matched = false;
    for (let len = 4; len > 0; len--) {
      if (i + len <= line.length) {
        const word = line.substring(i, i + len);
        if (dict.has(word)) {
          const entry = dict.get(word);
          parsedLine.push({
            word: word,
            pinyin: entry.pinyin || '',
            meaning: entry.meaning || '',
            isPunctuation: entry.isPunctuation || false
          });
          i += len;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      const char = line[i];
      parsedLine.push({
        word: char,
        pinyin: '',
        meaning: '',
        isPunctuation: /[\u3000-\u303f\uff00-\uffef]/.test(char)
      });
      i++;
    }
  }
  paragraphs.push(parsedLine);
}

fs.writeFileSync('public/vocab/hsk2-paragraph.json', JSON.stringify(paragraphs, null, 4));
console.log('done hsk2');
