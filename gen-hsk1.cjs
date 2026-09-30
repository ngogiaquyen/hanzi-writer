const fs = require('fs');
const hsk = JSON.parse(fs.readFileSync('public/hsk-vocab-json/hsk-level-1.json', 'utf8'));
const chars = JSON.parse(fs.readFileSync('public/characters/characters.json', 'utf8'));

const dict = new Map();
hsk.forEach(w => dict.set(w.hanzi, { pinyin: w.pinyin, meaning: w.vietnamese }));

// add single character fallbacks
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

const text = `昨天上午天气很热。天下雨了。今天很冷。明天天气怎么样？
你好！我叫王先生。这是我的名字。我是中国人，住在北京。
她是谁？她是李小姐。我们是好朋友。她很漂亮。
你今年几岁？我二十岁。我的儿子八岁，女儿五岁。
你的家在哪儿？我的家在前面。那儿有一个医院。
谁是医生？我的爸爸是医生。妈妈在学校工作，她是老师。
我和同学在学校学习汉语。我们都会写汉字，也会读汉语书。
你在做什么？我在打电话。“喂，你好，请问张先生在吗？”
我想去商店买东西。买什么？我想买衣服、苹果和水果。
多少钱？十块钱。太少了，多一点。
那儿有一家饭馆。中午我们去饭馆吃米饭和菜，喝茶和水。
服务员，请给我一个杯子。谢谢！不客气。对不起！没关系。
现在几点？现在是下午三点零十分钟。
我们怎么去火车站？坐出租车去。
你喜欢看电影吗？我很喜欢。我们在电视上看电影。
桌子上有什么？桌子上有电脑和一本书。椅子在桌子下面。
你看见我的狗了吗？没有，我看见一只小猫在椅子后面。
星期一到星期六我都工作。星期日我睡觉。
你会开飞机吗？不，我会开出租车。
你认识他吗？认识，他是我的学生。很高兴认识你。
你们去哪儿？我们回中国。再见！
这个东西怎么样？很好。
这里有几个人？有七八个人。
九，十，零，一，二，三，四，五，六，七，八。
这些字怎么读？听我说。`;

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

fs.writeFileSync('public/vocab/hsk1-paragraph.json', JSON.stringify(paragraphs, null, 4));
console.log('done fixed');
