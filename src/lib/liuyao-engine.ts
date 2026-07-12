/**
 * 六爻排盘引擎 — 移植自 https://github.com/xiongdun8/liuyao
 * 功能：京房易六爻排盘、纳甲、六亲、六神、世应、旺衰、回头生克、卦辞爻辞、旬空
 */

import { Solar, Lunar } from 'lunar-javascript';

// ─── 基础常量 ───

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WU_XING = ['金', '木', '水', '火', '土'];
const WU_XING_MAP: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
  '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};
const LIU_SHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
const YAO_WEI = ['初', '二', '三', '四', '五', '六'];

// ─── 纳甲 ───
// 内卦（下三爻）和外卦（上三爻）的干支，key=卦象编码(1=阳,0=阴)
const NA_JIA: Record<string, Array<{ gan: string; zhi: string }>> = {
  '1,1,1': [ // 乾内卦
    { gan: '甲', zhi: '子' }, { gan: '甲', zhi: '寅' }, { gan: '甲', zhi: '辰' },
  ],
  '0,0,0': [ // 坤内卦
    { gan: '乙', zhi: '未' }, { gan: '乙', zhi: '巳' }, { gan: '乙', zhi: '卯' },
  ],
  '1,0,0': [ // 震内卦
    { gan: '庚', zhi: '子' }, { gan: '庚', zhi: '寅' }, { gan: '庚', zhi: '辰' },
  ],
  '0,1,1': [ // 巽内卦
    { gan: '辛', zhi: '丑' }, { gan: '辛', zhi: '亥' }, { gan: '辛', zhi: '酉' },
  ],
  '0,1,0': [ // 坎内卦
    { gan: '戊', zhi: '寅' }, { gan: '戊', zhi: '辰' }, { gan: '戊', zhi: '午' },
  ],
  '1,0,1': [ // 离内卦
    { gan: '己', zhi: '卯' }, { gan: '己', zhi: '丑' }, { gan: '己', zhi: '亥' },
  ],
  '1,0,0_2': [ // 艮内卦 (same trigram as 震 but different najia - 艮 uses 丙)
    { gan: '丙', zhi: '辰' }, { gan: '丙', zhi: '午' }, { gan: '丙', zhi: '申' },
  ],
  '1,1,0': [ // 兑内卦
    { gan: '丁', zhi: '巳' }, { gan: '丁', zhi: '卯' }, { gan: '丁', zhi: '丑' },
  ],
};

// 外卦纳甲（与内卦结构相同但天干不同、地支顺逆不同）
const NA_JIA_WAI: Record<string, Array<{ gan: string; zhi: string }>> = {
  '1,1,1': [ // 乾外卦
    { gan: '壬', zhi: '午' }, { gan: '壬', zhi: '申' }, { gan: '壬', zhi: '戌' },
  ],
  '0,0,0': [ // 坤外卦
    { gan: '癸', zhi: '丑' }, { gan: '癸', zhi: '亥' }, { gan: '癸', zhi: '酉' },
  ],
  '1,0,0': [ // 震外卦
    { gan: '庚', zhi: '午' }, { gan: '庚', zhi: '申' }, { gan: '庚', zhi: '戌' },
  ],
  '0,1,1': [ // 巽外卦
    { gan: '辛', zhi: '未' }, { gan: '辛', zhi: '巳' }, { gan: '辛', zhi: '卯' },
  ],
  '0,1,0': [ // 坎外卦
    { gan: '戊', zhi: '申' }, { gan: '戊', zhi: '戌' }, { gan: '戊', zhi: '子' },
  ],
  '1,0,1': [ // 离外卦
    { gan: '己', zhi: '酉' }, { gan: '己', zhi: '未' }, { gan: '己', zhi: '巳' },
  ],
  '1,0,0_2': [ // 艮外卦
    { gan: '丙', zhi: '戌' }, { gan: '丙', zhi: '子' }, { gan: '丙', zhi: '寅' },
  ],
  '1,1,0': [ // 兑外卦
    { gan: '丁', zhi: '亥' }, { gan: '丁', zhi: '酉' }, { gan: '丁', zhi: '未' },
  ],
};

// 八经卦编码与名称映射
const TRIGRAM_NAMES: Record<string, string> = {
  '1,1,1': '乾', '0,0,0': '坤', '1,0,0': '震', '0,1,1': '巽',
  '0,1,0': '坎', '1,0,1': '离', '1,0,0_2': '艮', '1,1,0': '兑',
};

// ─── 卦宫数据 ───

const HEXAGRAMS: Record<string, { gongMing: string; shiYaoIdx: number; yingYaoIdx: number; guaType: string; guaMing: string }> = {
  '1,1,1,1,1,1': { gongMing: '乾宫', shiYaoIdx: 5, yingYaoIdx: 2, guaType: '本宫卦', guaMing: '乾为天' },
  '0,1,1,1,1,1': { gongMing: '乾宫', shiYaoIdx: 0, yingYaoIdx: 3, guaType: '一世卦', guaMing: '天风姤' },
  '0,0,1,1,1,1': { gongMing: '乾宫', shiYaoIdx: 1, yingYaoIdx: 4, guaType: '二世卦', guaMing: '天山遁' },
  '0,0,0,1,1,1': { gongMing: '乾宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '三世卦', guaMing: '天地否' },
  '0,0,0,0,1,1': { gongMing: '乾宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '四世卦', guaMing: '风地观' },
  '0,0,0,0,0,1': { gongMing: '乾宫', shiYaoIdx: 4, yingYaoIdx: 1, guaType: '五世卦', guaMing: '山地剥' },
  '0,0,0,1,0,1': { gongMing: '乾宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '游魂卦', guaMing: '火地晋' },
  '1,1,1,1,0,1': { gongMing: '乾宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '归魂卦', guaMing: '火天大有' },
  '0,0,0,0,0,0': { gongMing: '坤宫', shiYaoIdx: 5, yingYaoIdx: 2, guaType: '本宫卦', guaMing: '坤为地' },
  '1,0,0,0,0,0': { gongMing: '坤宫', shiYaoIdx: 0, yingYaoIdx: 3, guaType: '一世卦', guaMing: '地雷复' },
  '1,1,0,0,0,0': { gongMing: '坤宫', shiYaoIdx: 1, yingYaoIdx: 4, guaType: '二世卦', guaMing: '地泽临' },
  '1,1,1,0,0,0': { gongMing: '坤宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '三世卦', guaMing: '地天泰' },
  '1,1,1,1,0,0': { gongMing: '坤宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '四世卦', guaMing: '雷天大壮' },
  '1,1,1,1,1,0': { gongMing: '坤宫', shiYaoIdx: 4, yingYaoIdx: 1, guaType: '五世卦', guaMing: '泽天夬' },
  '1,1,1,0,1,0': { gongMing: '坤宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '游魂卦', guaMing: '水天需' },
  '0,0,0,0,1,0': { gongMing: '坤宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '归魂卦', guaMing: '水地比' },
  '1,0,0,1,0,0': { gongMing: '震宫', shiYaoIdx: 5, yingYaoIdx: 2, guaType: '本宫卦', guaMing: '震为雷' },
  '0,0,0,1,0,0': { gongMing: '震宫', shiYaoIdx: 0, yingYaoIdx: 3, guaType: '一世卦', guaMing: '雷地豫' },
  '0,1,0,1,0,0': { gongMing: '震宫', shiYaoIdx: 1, yingYaoIdx: 4, guaType: '二世卦', guaMing: '雷水解' },
  '0,1,1,1,0,0': { gongMing: '震宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '三世卦', guaMing: '雷风恒' },
  '0,1,1,0,0,0': { gongMing: '震宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '四世卦', guaMing: '地风升' },
  '0,1,1,0,1,0': { gongMing: '震宫', shiYaoIdx: 4, yingYaoIdx: 1, guaType: '五世卦', guaMing: '水风井' },
  '0,1,1,1,1,0': { gongMing: '震宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '游魂卦', guaMing: '泽风大过' },
  '1,0,0,1,1,0': { gongMing: '震宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '归魂卦', guaMing: '泽雷随' },
  '0,1,1,0,1,1': { gongMing: '巽宫', shiYaoIdx: 5, yingYaoIdx: 2, guaType: '本宫卦', guaMing: '巽为风' },
  '1,1,1,0,1,1': { gongMing: '巽宫', shiYaoIdx: 0, yingYaoIdx: 3, guaType: '一世卦', guaMing: '风天小畜' },
  '1,0,1,0,1,1': { gongMing: '巽宫', shiYaoIdx: 1, yingYaoIdx: 4, guaType: '二世卦', guaMing: '风火家人' },
  '1,0,0,0,1,1': { gongMing: '巽宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '三世卦', guaMing: '风雷益' },
  '1,0,0,1,1,1': { gongMing: '巽宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '四世卦', guaMing: '天雷无妄' },
  '1,0,0,1,0,1': { gongMing: '巽宫', shiYaoIdx: 4, yingYaoIdx: 1, guaType: '五世卦', guaMing: '火雷噬嗑' },
  '1,0,0,0,0,1': { gongMing: '巽宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '游魂卦', guaMing: '山雷颐' },
  '0,1,1,0,0,1': { gongMing: '巽宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '归魂卦', guaMing: '山风蛊' },
  '0,1,0,0,1,0': { gongMing: '坎宫', shiYaoIdx: 5, yingYaoIdx: 2, guaType: '本宫卦', guaMing: '坎为水' },
  '1,1,0,0,1,0': { gongMing: '坎宫', shiYaoIdx: 0, yingYaoIdx: 3, guaType: '一世卦', guaMing: '水泽节' },
  '1,0,0,0,1,0': { gongMing: '坎宫', shiYaoIdx: 1, yingYaoIdx: 4, guaType: '二世卦', guaMing: '水雷屯' },
  '1,0,1,0,1,0': { gongMing: '坎宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '三世卦', guaMing: '水火既济' },
  '1,0,1,1,1,0': { gongMing: '坎宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '四世卦', guaMing: '泽火革' },
  '1,0,1,1,0,0': { gongMing: '坎宫', shiYaoIdx: 4, yingYaoIdx: 1, guaType: '五世卦', guaMing: '雷火丰' },
  '1,0,1,0,0,0': { gongMing: '坎宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '游魂卦', guaMing: '地火明夷' },
  '0,1,0,0,0,0': { gongMing: '坎宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '归魂卦', guaMing: '地水师' },
  '1,0,1,1,0,1': { gongMing: '离宫', shiYaoIdx: 5, yingYaoIdx: 2, guaType: '本宫卦', guaMing: '离为火' },
  '0,0,1,1,0,1': { gongMing: '离宫', shiYaoIdx: 0, yingYaoIdx: 3, guaType: '一世卦', guaMing: '火山旅' },
  '0,1,1,1,0,1': { gongMing: '离宫', shiYaoIdx: 1, yingYaoIdx: 4, guaType: '二世卦', guaMing: '火风鼎' },
  '0,1,0,1,0,1': { gongMing: '离宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '三世卦', guaMing: '火水未济' },
  '0,1,0,0,0,1': { gongMing: '离宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '四世卦', guaMing: '山水蒙' },
  '0,1,0,0,1,1': { gongMing: '离宫', shiYaoIdx: 4, yingYaoIdx: 1, guaType: '五世卦', guaMing: '风水涣' },
  '0,1,0,1,1,1': { gongMing: '离宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '游魂卦', guaMing: '天水讼' },
  '1,0,1,1,1,1': { gongMing: '离宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '归魂卦', guaMing: '天火同人' },
  '0,0,1,0,0,1': { gongMing: '艮宫', shiYaoIdx: 5, yingYaoIdx: 2, guaType: '本宫卦', guaMing: '艮为山' },
  '1,0,1,0,0,1': { gongMing: '艮宫', shiYaoIdx: 0, yingYaoIdx: 3, guaType: '一世卦', guaMing: '山火贲' },
  '1,1,1,0,0,1': { gongMing: '艮宫', shiYaoIdx: 1, yingYaoIdx: 4, guaType: '二世卦', guaMing: '山天大畜' },
  '1,1,0,0,0,1': { gongMing: '艮宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '三世卦', guaMing: '山泽损' },
  '1,1,0,1,0,1': { gongMing: '艮宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '四世卦', guaMing: '火泽睽' },
  '1,1,0,1,1,1': { gongMing: '艮宫', shiYaoIdx: 4, yingYaoIdx: 1, guaType: '五世卦', guaMing: '天泽履' },
  '1,1,0,0,1,1': { gongMing: '艮宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '游魂卦', guaMing: '风泽中孚' },
  '0,0,1,0,1,1': { gongMing: '艮宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '归魂卦', guaMing: '风山渐' },
  '1,1,0,1,1,0': { gongMing: '兑宫', shiYaoIdx: 5, yingYaoIdx: 2, guaType: '本宫卦', guaMing: '兑为泽' },
  '0,1,0,1,1,0': { gongMing: '兑宫', shiYaoIdx: 0, yingYaoIdx: 3, guaType: '一世卦', guaMing: '泽水困' },
  '0,0,0,1,1,0': { gongMing: '兑宫', shiYaoIdx: 1, yingYaoIdx: 4, guaType: '二世卦', guaMing: '泽地萃' },
  '0,0,1,1,1,0': { gongMing: '兑宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '三世卦', guaMing: '泽山咸' },
  '0,0,1,0,1,0': { gongMing: '兑宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '四世卦', guaMing: '水山蹇' },
  '0,0,1,0,0,0': { gongMing: '兑宫', shiYaoIdx: 4, yingYaoIdx: 1, guaType: '五世卦', guaMing: '地山谦' },
  '0,0,1,1,0,0': { gongMing: '兑宫', shiYaoIdx: 3, yingYaoIdx: 0, guaType: '游魂卦', guaMing: '雷山小过' },
  '1,1,0,1,0,0': { gongMing: '兑宫', shiYaoIdx: 2, yingYaoIdx: 5, guaType: '归魂卦', guaMing: '雷泽归妹' },
};

// ─── 卦辞爻辞 ───

const HEXAGRAM_TEXTS: Record<string, { guaCi: string; yaoCi: string[] }> = {
  '乾为天': { guaCi: '元亨利贞。', yaoCi: ["初九：潜龙勿用。", "九二：见龙在田，利见大人。", "九三：君子终日乾乾，夕惕若厉，无咎。", "九四：或跃在渊，无咎。", "九五：飞龙在天，利见大人。", "上九：亢龙有悔。"] },
  '天风姤': { guaCi: '女壮，勿用取女。', yaoCi: ["初六：系于金柅，贞吉。有攸往，见凶。羸豕孚蹢躅。", "九二：包有鱼，无咎，不利宾。", "九三：臀无肤，其行次且，厉，大无大咎。", "九四：包无鱼，起凶。", "九五：以杞包瓜，含章，有陨自天。", "上九：姤其角，吝，无大咎。"] },
  '天山遁': { guaCi: '亨，小利贞。', yaoCi: ["初六：遁尾，厉，勿用有攸往。", "六二：执之用黄牛之革，莫之胜说。", "九三：系遁，有疾厉，畜臣妾吉。", "九四：好遁，君子吉，小人否。", "九五：嘉遁，贞吉。", "上九：肥遁，无不利。"] },
  '天地否': { guaCi: '否之匪人，不利君子贞，大往小来。', yaoCi: ["初六：拔茅茹，以其汇，贞吉，亨。", "六二：包承，小人吉，大人否，亨。", "六三：包羞。", "九四：有命无咎，畴离祉。", "九五：休否，大人吉。其亡其亡，系于苞桑。", "上九：倾否，先否后喜。"] },
  '风地观': { guaCi: '盥而不荐，有孚颙若。', yaoCi: ["初六：童观，小人无咎，君子吝。", "六二：窥观，利女贞。", "六三：观我生，进退。", "六四：观国之光，利用宾于王。", "九五：观我生，君子无咎。", "上九：观其生，君子无咎。"] },
  '山地剥': { guaCi: '不利有攸往。', yaoCi: ["初六：剥床以足，蔑贞凶。", "六二：剥床以辨，蔑贞凶。", "六三：剥之，无大咎。", "六四：剥床以肤，凶。", "六五：贯鱼，以宫人宠，无不利。", "上九：硕果不食，君子得舆，小人剥庐。"] },
  '火地晋': { guaCi: '康侯用锡马蕃庶，昼日三接。', yaoCi: ["初六：晋如，摧如，贞吉。罔孚，裕无咎。", "六二：晋如，愁如，贞吉。受兹介福，于其王母。", "六三：众允，悔亡。", "九四：晋如鼫鼠，贞厉。", "六五：悔亡，失得勿恤，往吉无不利。", "上九：晋其角，维用伐邑，厉吉无大咎。"] },
  '火天大有': { guaCi: '元亨。', yaoCi: ["初九：无交害，匪咎，艰则无咎。", "九二：大车以载，有攸往，无咎，利见大人。", "九三：公用亨于天子，小人弗克。", "九四：匪其彭，无咎。", "六五：厥孚交如，威如，吉。", "上九：自天祐之，吉无不利。"] },
  '坤为地': { guaCi: '元亨，利牝马之贞。君子有攸往，先迷后得主，利西南得朋，东北丧朋。安贞吉。', yaoCi: ["初六：履霜，坚冰至。", "六二：直方大，不习无不利。", "六三：含章可贞。或从王事，无成有终。", "六四：括囊，无咎无誉。", "六五：黄裳，元吉。", "上六：龙战于野，其血玄黄。"] },
  '地雷复': { guaCi: '亨。出入无疾，朋来无咎。反复其道，七日来复。利有攸往。', yaoCi: ["初九：不远复，无祗悔，元吉。", "六二：休复，吉。", "六三：频复，厉无大咎。", "六四：中行独复。", "六五：敦复，无悔。", "上六：迷复，凶，有灾眚。用行师，终有大败，以其国君凶，至于十年不克征。"] },
  '地泽临': { guaCi: '元亨，利贞。至于八月有凶。', yaoCi: ["初九：咸临，贞吉。", "九二：咸临，吉无不利。", "六三：甘临，无攸利。既忧之，无大咎。", "六四：至临，无咎。", "六五：知临，大君之宜，吉。", "上六：敦临，吉无咎。"] },
  '地天泰': { guaCi: '小往大来，吉亨。', yaoCi: ["初九：拔茅茹，以其汇，征吉。", "九二：包荒，用冯河，不遐遗，朋亡，得尚于中行。", "九三：无平不陂，无往不复，艰贞无咎。勿恤其孚，于食有福。", "六四：翩翩不富，以其邻，不戒以孚。", "六五：帝乙归妹，以祉元吉。", "上六：城复于隍，勿用师。自邑告命，贞吝。"] },
  '雷天大壮': { guaCi: '利贞。', yaoCi: ["初九：壮于趾，征凶，有孚。", "九二：贞吉。", "九三：小人用壮，君子用罔，贞厉。羝羊触藩，羸其角。", "九四：贞吉悔亡，藩决不羸，壮于大舆之輹。", "六五：丧羊于易，无悔。", "上六：羝羊触藩，不能退，不能遂，无大咎。"] },
  '泽天夬': { guaCi: '扬于王庭，孚号，有厉。告自邑，不利即戎，利有攸往。', yaoCi: ["初九：壮于前趾，往不胜为吝。", "九二：惕号，莫夜有戎，勿恤。", "九三：壮于頄，有凶。君子夬夬，独行遇雨，若濡有愠，无大咎。", "九四：臀无肤，其行次且，牵羊悔亡，闻言不信。", "九五：苋陆夬夬，中行无咎。", "上六：无号，终有凶。"] },
  '水天需': { guaCi: '有孚，光亨，贞吉。利涉大川。', yaoCi: ["初九：需于郊，利用恒，无咎。", "九二：需于沙，小有言，终吉。", "九三：需于泥，致寇至。", "六四：需于血，出自穴。", "九五：需于酒食，贞吉。", "上六：入于穴，有不速之客三人来，敬之终吉。"] },
  '水地比': { guaCi: '吉。原筮元永贞，无咎。不宁方来，后夫凶。', yaoCi: ["初六：有孚比之，无咎。有孚盈缶，终来有它，吉。", "六二：比之自内，贞吉。", "六三：比之匪人。", "六四：外比之，贞吉。", "九五：显比，王用三驱，失前禽，邑人不诫，吉。", "上六：比之无首，凶。"] },
  '震为雷': { guaCi: '亨。震来虩虩，笑言哑哑。震惊百里，不丧匕鬯。', yaoCi: ["初九：震来虩虩，后笑言哑哑，吉。", "六二：震来厉，亿丧贝，跻于九陵，勿逐，七日得。", "六三：震苏苏，震行无大咎。", "九四：震遂泥。", "六五：震往来厉，亿无丧，有事。", "上六：震索索，视矍矍，征凶。震不于其躬，于其邻，无咎。婚媾有言。"] },
  '雷地豫': { guaCi: '利建侯行师。', yaoCi: ["初六：鸣豫，凶。", "六二：介于石，不终日，贞吉。", "六三：盱豫，悔。迟有悔。", "九四：由豫，大有得，勿疑。朋盍簪。", "六五：贞疾，恒不死。", "上六：冥豫，成有渝，无咎。"] },
  '雷水解': { guaCi: '亨。利西南，无所往，其来复吉。有攸往，夙吉。', yaoCi: ["初六：无咎。", "九二：田获三狐，得黄矢，贞吉。", "六三：负且乘，致寇至，贞吝。", "九四：解而拇，朋至斯孚。", "六五：君子维有解，吉。有孚于小人。", "上六：公用射隼于高墉之上，获之，无不利。"] },
  '雷风恒': { guaCi: '亨，无咎，利贞，利有攸往。', yaoCi: ["初六：浚恒，贞凶，无攸利。", "九二：悔亡。", "九三：不恒其德，或承之羞，贞吝。", "九四：田无禽。", "六五：恒其德，贞，妇人吉，夫子凶。", "上六：振恒，凶。"] },
  '地风升': { guaCi: '元亨，用见大人，勿恤，南征吉。', yaoCi: ["初六：允升，大吉。", "九二：孚乃利用禴，无咎。", "九三：升虚邑。", "六四：王用亨于岐山，吉无咎。", "六五：贞吉，升阶。", "上六：冥升，利于不息之贞。"] },
  '水风井': { guaCi: '改邑不改井，无丧无得，往来井井。汔至，亦未繘井，羸其瓶，凶。', yaoCi: ["初六：井泥不食，旧井无禽。", "九二：井谷射鲋，瓮敝漏。", "九三：井渫不食，为我心恻，可用汲，王明，并受其福。", "六四：井甃，无咎。", "九五：井冽，寒泉食。", "上六：井收勿幕，有孚元吉。"] },
  '泽风大过': { guaCi: '栋桡，利有攸往，亨。', yaoCi: ["初六：藉用白茅，无咎。", "九二：枯杨生稊，老夫得其女妻，无不利。", "九三：栋桡，凶。", "九四：栋隆，吉。有它吝。", "九五：枯杨生华，老妇得其士夫，无咎无誉。", "上六：过涉灭顶，凶，无大咎。"] },
  '泽雷随': { guaCi: '元亨利贞，无咎。', yaoCi: ["初九：官有渝，贞吉。出门交有功。", "六二：系小子，失丈夫。", "六三：系丈夫，失小子。随有求得，利居贞。", "九四：随有获，贞凶。有孚在道，以明，何咎。", "九五：孚于嘉，吉。", "上六：拘系之，乃从维之，王用亨于西山。"] },
  '巽为风': { guaCi: '小亨，利有攸往，利见大人。', yaoCi: ["初六：进退，利武人之贞。", "九二：巽在床下，用史巫纷若，吉无大咎。", "九三：频巽，吝。", "六四：悔亡，田获三品。", "九五：贞吉，悔亡，无不利。无初有终，先庚三日，后庚三日，吉。", "上九：巽在床下，丧其资斧，贞凶。"] },
  '风天小畜': { guaCi: '亨。密云不雨，自我西郊。', yaoCi: ["初九：复自道，何其咎，吉。", "九二：牵复，吉。", "九三：舆说辐，夫妻反目。", "六四：有孚，血去惕出，无咎。", "九五：有孚挛如，富以其邻。", "上九：既雨既处，尚德载，妇贞厉。月几望，君子征凶。"] },
  '风火家人': { guaCi: '利女贞。', yaoCi: ["初九：闲有家，悔亡。", "六二：无攸遂，在中馈，贞吉。", "九三：家人嗃嗃，悔厉吉；妇子嘻嘻，终吝。", "六四：富家，大吉。", "九五：王假有家，勿恤，吉。", "上九：有孚威如，终吉。"] },
  '风雷益': { guaCi: '利有攸往，利涉大川。', yaoCi: ["初九：利用为大作，元吉，无咎。", "六二：或益之十朋之龟，弗克违，永贞吉。王用享于帝，吉。", "六三：益之用凶事，无咎。有孚中行，告公用圭。", "六四：中行，告公从。利用为依迁国。", "九五：有孚惠心，勿问元吉。有孚惠我德。", "上九：莫益之，或击之，立心勿恒，凶。"] },
  '天雷无妄': { guaCi: '元亨利贞。其匪正有眚，不利有攸往。', yaoCi: ["初九：无妄，往吉。", "六二：不耕获，不菑畬，则利有攸往。", "六三：无妄之灾，或系之牛，行人之得，邑人之灾。", "九四：可贞，无咎。", "九五：无妄之疾，勿药有喜。", "上九：无妄，行有眚，无大咎。"] },
  '火雷噬嗑': { guaCi: '亨。利用狱。', yaoCi: ["初九：屦校灭趾，无咎。", "六二：噬肤灭鼻，无咎。", "六三：噬腊肉，遇毒，小吝，无大咎。", "九四：噬乾胏，得金矢，利艰贞，吉。", "六五：噬乾肉，得黄金，贞厉，无大咎。", "上九：何校灭耳，凶。"] },
  '山雷颐': { guaCi: '贞吉。观颐，自求口实。', yaoCi: ["初九：舍尔灵龟，观我朵颐，凶。", "六二：颠颐，拂经于丘颐，征凶。", "六三：拂颐，贞凶，十年勿用，无攸利。", "六四：颠颐，吉。虎视眈眈，其欲逐逐，无咎。", "六五：拂经，居贞吉，不可涉大川。", "上九：由颐，厉吉，利涉大川。"] },
  '山风蛊': { guaCi: '元亨，利涉大川。先甲三日，后甲三日。', yaoCi: ["初六：干父之蛊，有子，考无咎，厉终吉。", "九二：干母之蛊，不可贞。", "九三：干父之蛊，小有悔，无大咎。", "六四：裕父之蛊，往见吝。", "六五：干父之蛊，用誉。", "上九：不事王侯，高尚其事。"] },
  '坎为水': { guaCi: '习坎，有孚，维心亨，行有尚。', yaoCi: ["初六：习坎，入于坎窞，凶。", "九二：坎有险，求小得。", "六三：来之坎坎，险且枕，入于坎窞，勿用。", "六四：樽酒簋贰，用缶，纳约自牖，终无咎。", "九五：坎不盈，祇既平，无咎。", "上六：用徽纆，置于丛棘，三岁不得，凶。"] },
  '水泽节': { guaCi: '亨。苦节不可贞。', yaoCi: ["初九：不出户庭，无咎。", "九二：不出门庭，凶。", "六三：不节若，则嗟若，无大咎。", "六四：安节，亨。", "九五：甘节，吉，往有尚。", "上六：苦节，贞凶，悔亡。"] },
  '水雷屯': { guaCi: '元亨，利贞。勿用有攸往。利建侯。', yaoCi: ["初九：磐桓，利居贞，利建侯。", "六二：屯如邅如，乘马班如。匪寇婚媾，女子贞不字，十年乃字。", "六三：即鹿无虞，惟入于林中，君子几不如舍，往吝。", "六四：乘马班如，求婚媾，无不利。", "九五：屯其膏，小贞吉，大贞凶。", "上六：乘马班如，泣血涟如。"] },
  '水火既济': { guaCi: '亨，小利贞，初吉终乱。', yaoCi: ["初九：曳其轮，濡其尾，无大咎。", "六二：妇丧其茀，勿逐，七日得。", "九三：高宗伐鬼方，三年克之，小人勿用。", "六四：繻有衣袽，终日戒。", "九五：东邻杀牛，不如西邻之禴祭，实受其福。", "上六：濡其首，厉。"] },
  '泽火革': { guaCi: '巳日乃孚，元亨，利贞，悔亡。', yaoCi: ["初九：巩用黄牛之革。", "六二：巳日乃革之，征吉，无咎。", "九三：征凶，贞厉。革言三就，有孚。", "九四：悔亡，有孚改命，吉。", "九五：大人虎变，未占有孚。", "上六：君子豹变，小人革面，征凶，居贞吉。"] },
  '地火明夷': { guaCi: '利艰贞。', yaoCi: ["初九：明夷于飞，垂其翼。君子于行，三日不食。有攸往，主人有言。", "六二：明夷，夷于左股，用拯马壮，吉。", "九三：明夷于南狩，得其大首，不可疾贞。", "六四：入于左腹，获明夷之心，于出门庭。", "六五：箕子之明夷，利贞。", "上六：不明晦，初登于天，后入于地。"] },
  '地水师': { guaCi: '贞，大人吉，无咎。', yaoCi: ["初六：师出以律，否臧凶。", "九二：在师中，吉，无咎，王三锡命。", "六三：师或舆尸，凶。", "六四：师左次，无咎。", "六五：田有禽，利执言，无大咎。长子帅师，弟子舆尸，贞凶。", "上六：大君有命，开国承家，小人勿用。"] },
  '离为火': { guaCi: '利贞，亨。畜牝牛，吉。', yaoCi: ["初九：履错然，敬之无咎。", "六二：黄离，元吉。", "九三：日昃之离，不鼓缶而歌，则大耋之嗟，凶。", "九四：突如其来如，焚如，死如，弃如。", "六五：出涕沱若，戚嗟若，吉。", "上九：王用出征，有嘉折首，获匪其丑，无咎。"] },
  '火风鼎': { guaCi: '元吉，亨。', yaoCi: ["初六：鼎颠趾，利出否，得妾以其子，无咎。", "九二：鼎有实，我仇有疾，不我能即，吉。", "九三：鼎耳革，其行塞，雉膏不食，方雨亏悔，终吉。", "九四：鼎折足，覆公餗，其形渥，凶。", "六五：鼎黄耳金铉，利贞。", "上九：鼎玉铉，大吉，无不利。"] },
  '山水蒙': { guaCi: '亨。匪我求童蒙，童蒙求我。初筮告，再三渎，渎则不告。利贞。', yaoCi: ["初六：发蒙，利用刑人，用说桎梏，以往吝。", "九二：包蒙吉，纳妇吉，子克家。", "六三：勿用取女，见金夫，不有躬，无攸利。", "六四：困蒙，吝。", "六五：童蒙，吉。", "上九：击蒙，不利为寇，利御寇。"] },
  '风水涣': { guaCi: '亨。王假有庙，利涉大川，利贞。', yaoCi: ["初六：用拯马壮，吉。", "九二：涣奔其机，悔亡。", "六三：涣其躬，无悔。", "六四：涣其群，元吉。涣有丘，匪夷所思。", "九五：涣汗其大号，涣王居，无咎。", "上九：涣其血去逖出，无咎。"] },
  '天水讼': { guaCi: '有孚，窒惕，中吉，终凶。利见大人，不利涉大川。', yaoCi: ["初六：不永所事，小有言，终吉。", "九二：不克讼，归而逋，其邑人三百户，无眚。", "六三：食旧德，贞厉，终吉。或从王事，无成。", "九四：不克讼，复即命，渝安贞，吉。", "九五：讼，元吉。", "上九：或锡之鞶带，终朝三褫之。"] },
  '天火同人': { guaCi: '同人于野，亨。利涉大川，利君子贞。', yaoCi: ["初九：同人于门，无咎。", "六二：同人于宗，吝。", "九三：伏戎于莽，升其高陵，三岁不兴。", "九四：乘其墉，弗克攻，吉。", "九五：同人，先号啕而后笑，大师克相遇。", "上九：同人于郊，无悔。"] },
  '兑为泽': { guaCi: '亨，利贞。', yaoCi: ["初九：和兑，吉。", "九二：孚兑，吉，悔亡。", "六三：来兑，凶。", "九四：商兑未宁，介疾有喜。", "九五：孚于剥，有厉。", "上六：引兑。"] },
  '泽水困': { guaCi: '亨，贞大人吉，无咎。有言不信。', yaoCi: ["初六：臀困于株木，入于幽谷，三岁不觌。", "九二：困于酒食，朱绂方来，利用亨祀。征凶，无大咎。", "六三：困于石，据于蒺藜，入于其宫，不见其妻，凶。", "九四：来徐徐，困于金车，吝，有终。", "九五：劓刖，困于赤绂，乃徐有说，利用祭祀。", "上六：困于葛藟，于臲卼，曰动悔有悔，征吉。"] },
  '泽地萃': { guaCi: '亨。王假有庙，利见大人，亨，利贞。用大牲吉，利有攸往。', yaoCi: ["初六：有孚不终，乃乱乃萃，若号，一握为笑，勿恤，往无咎。", "六二：引吉，无咎，孚乃利用禴。", "六三：萃如，嗟如，无攸利。往无咎，小吝。", "九四：大吉，无咎。", "九五：萃有位，无咎，匪孚。元永贞，悔亡。", "上六：赍咨涕洟，无咎。"] },
  '泽山咸': { guaCi: '亨，利贞，取女吉。', yaoCi: ["初六：咸其拇。", "六二：咸其腓，凶，居吉。", "九三：咸其股，执其随，往吝。", "九四：贞吉，悔亡，憧憧往来，朋从尔思。", "九五：咸其脢，无悔。", "上六：咸其辅、颊、舌。"] },
  '水山蹇': { guaCi: '利西南，不利东北。利见大人，贞吉。', yaoCi: ["初六：往蹇，来誉。", "六二：王臣蹇蹇，匪躬之故。", "九三：往蹇，来反。", "六四：往蹇，来连。", "九五：大蹇，朋来。", "上六：往蹇，来硕，吉，利见大人。"] },
  '地山谦': { guaCi: '亨，君子有终。', yaoCi: ["初六：谦谦君子，用涉大川，吉。", "六二：鸣谦，贞吉。", "九三：劳谦，君子有终，吉。", "六四：无不利，捴谦。", "六五：不富以其邻，利用侵伐，无不利。", "上六：鸣谦，利用行师，征邑国。"] },
  '雷山小过': { guaCi: '亨，利贞。可小事，不可大事。飞鸟遗之音，不宜上宜下，大吉。', yaoCi: ["初六：飞鸟以凶。", "六二：过其祖，遇其妣，不及其君，遇其臣，无咎。", "九三：弗过防之，从或戕之，凶。", "九四：无咎，弗过遇之。往厉必戒，勿用永贞。", "六五：密云不雨，自我西郊，公弋取彼在穴。", "上六：弗遇过之，飞鸟离之，凶，是谓灾眚。"] },
  '火泽睽': { guaCi: '小事吉。', yaoCi: ["初九：悔亡，丧马勿逐，自复。见恶人无咎。", "九二：遇主于巷，无咎。", "六三：见舆曳，其牛掣，其人天且劓，无大咎。", "九四：睽孤，遇元夫，交孚，厉无大咎。", "六五：悔亡，厥宗噬肤，往何咎。", "上九：睽孤，见豕负涂，载鬼一车，先张之弧，后说之弧，匪寇婚媾，往遇雨则吉。"] },
  '天泽履': { guaCi: '履虎尾，不咥人，亨。', yaoCi: ["初九：素履，往无咎。", "九二：履道坦坦，幽人贞吉。", "六三：眇能视，跛能履，履虎尾，咥人，凶。武人为于大君。", "九四：履虎尾，愬愬，终吉。", "九五：夬履，贞厉。", "上九：视履考祥，其旋元吉。"] },
  '艮为山': { guaCi: '艮其背，不获其身，行其庭，不见其人，无咎。', yaoCi: ["初六：艮其趾，无咎，利永贞。", "六二：艮其腓，不拯其随，其心不快。", "九三：艮其限，列其夤，厉薰心。", "六四：艮其身，无咎。", "六五：艮其辅，言有序，悔亡。", "上九：敦艮，吉。"] },
  '山火贲': { guaCi: '亨。小利有攸往。', yaoCi: ["初九：贲其趾，舍车而徒。", "六二：贲其须。", "九三：贲如濡如，永贞吉。", "六四：贲如皤如，白马翰如，匪寇婚媾。", "六五：贲于丘园，束帛戋戋，吝，终吉。", "上九：白贲，无咎。"] },
  '山天大畜': { guaCi: '利贞，不家食吉，利涉大川。', yaoCi: ["初九：有厉，利已。", "九二：舆说輹。", "九三：良马逐，利艰贞。曰闲舆卫，利有攸往。", "六四：童牛之牿，元吉。", "六五：豮豕之牙，吉。", "上九：何天之衢，亨。"] },
  '山泽损': { guaCi: '有孚，元吉，无咎，可贞，利有攸往。曷之用？二簋可用享。', yaoCi: ["初九：已事遄往，无大咎，酌损之。", "九二：利贞，征凶，弗损益之。", "六三：三人行，则损一人；一人行，则得其友。", "六四：损其疾，使遄有喜，无咎。", "六五：或益之十朋之龟，弗克违，元吉。", "上九：弗损益之，无咎，贞吉，利有攸往，得臣无家。"] },
  '风泽中孚': { guaCi: '豚鱼吉，利涉大川，利贞。', yaoCi: ["初九：虞吉，有他不燕。", "九二：鸣鹤在阴，其子和之，我有好爵，吾与尔靡之。", "六三：得敌，或鼓或罢，或泣或歌。", "六四：月几望，马匹亡，无咎。", "九五：有孚挛如，无咎。", "上九：翰音登于天，贞凶。"] },
  '风山渐': { guaCi: '女归吉，利贞。', yaoCi: ["初六：鸿渐于干，小子厉，有言，无咎。", "六二：鸿渐于磐，饮食衎衎，吉。", "九三：鸿渐于陆，夫征不复，妇孕不育，凶。利御寇。", "六四：鸿渐于木，或得其桷，无咎。", "九五：鸿渐于陵，妇三岁不孕，终莫之胜，吉。", "上九：鸿渐于陆，其羽可用为仪，吉。"] },
  '雷泽归妹': { guaCi: '征凶，无攸利。', yaoCi: ["初九：归妹以娣，跛能履，征吉。", "九二：眇能视，利幽人之贞。", "六三：归妹以须，反归以娣。", "九四：归妹愆期，迟归有时。", "六五：帝乙归妹，其君之袂，不如其娣之袂良。月几望，吉。", "上六：女承筐无实，士刲羊无血，无攸利。"] },
  '雷火丰': { guaCi: '亨，王假之，勿忧，宜日中。', yaoCi: ["初九：遇其配主，虽旬无咎，往有尚。", "六二：丰其蔀，日中见斗，往得疑疾，有孚发若，吉。", "九三：丰其沛，日中见沫，折其右肱，无大咎。", "九四：丰其蔀，日中见斗，遇其夷主，吉。", "六五：来章，有庆誉，吉。", "上六：丰其屋，蔀其家，窥其户，阒其无人，三岁不觌，凶。"] },
  '火山旅': { guaCi: '小亨，旅贞吉。', yaoCi: ["初六：旅琐琐，斯其所取灾。", "六二：旅即次，怀其资，得童仆贞。", "九三：旅焚其次，丧其童仆，贞厉。", "九四：旅于处，得其资斧，我心不快。", "六五：射雉，一矢亡，终以誉命。", "上九：鸟焚其巢，旅人先笑后号啕，丧牛于易，凶。"] },
};

// ─── 辅助函数 ───

/** 五行生克关系：返回 a 对 b 的关系 */
function wxRelation(a: string, b: string): '我生' | '我克' | '生我' | '克我' | '同我' {
  const aIdx = WU_XING.indexOf(a);
  const bIdx = WU_XING.indexOf(b);
  if (aIdx === bIdx) return '同我';
  if ((aIdx + 1) % 5 === bIdx) return '我生';
  if ((aIdx + 2) % 5 === bIdx) return '我克';
  if ((bIdx + 1) % 5 === aIdx) return '生我';
  return '克我';
}

/** 六亲名称 */
const LIU_QIN_MAP: Record<string, string> = {
  '同我': '兄弟', '我生': '子孙', '我克': '妻财', '生我': '父母', '克我': '官鬼',
};

/** 旬空计算：给定日干支，返回两个空亡地支 */
function getXunKong(dayGanIdx: number, dayZhiIdx: number): string[] {
  // 六十甲子中的序号
  const idx = (dayGanIdx * 6 + dayZhiIdx % 6 + 6) % 60; // ponytail: simplified xun calculation
  const xunIdx = Math.floor(idx / 10) * 10;
  // 旬首的干支序号
  const xunGan = xunIdx % 10;
  const xunZhi = xunIdx % 12;
  // 空亡：旬首之后第10、11个地支
  const k1 = (xunZhi + 10) % 12;
  const k2 = (xunZhi + 11) % 12;
  return [DI_ZHI[k1], DI_ZHI[k2]];
}

/** 根据日干确定六神起始序号 */
function getLiuShenStart(dayGanIdx: number): number {
  // 甲乙→青龙(0)，丙丁→朱雀(1)，戊→勾陈(2)，己→螣蛇(3)，庚辛→白虎(4)，壬癸→玄武(5)
  if (dayGanIdx <= 1) return 0;
  if (dayGanIdx <= 3) return 1;
  if (dayGanIdx === 4) return 2;
  if (dayGanIdx === 5) return 3;
  if (dayGanIdx <= 7) return 4;
  return 5;
}

/** 获取卦的纳甲干支（6爻），根据上下卦编码 */
function getNaJia(yaoArr: number[]): Array<{ gan: string; zhi: string }> {
  // 上卦(yao 3,4,5) 和 下卦(yao 0,1,2)
  const xiaKey = `${yaoArr[0]},${yaoArr[1]},${yaoArr[2]}`;
  const shangKey = `${yaoArr[3]},${yaoArr[4]},${yaoArr[5]}`;

  // 艮卦编码与震相同(1,0,0)，需特殊处理
  const getXiaKey = (key: string) => {
    // 查HEXAGRAMS找卦宫归属来区分艮/震
    const hexKey = yaoArr.join(',');
    const info = HEXAGRAMS[hexKey];
    if (!info) return key;
    const gongMing = info.gongMing;
    if (key === '1,0,0') {
      if (gongMing === '艮宫') return '1,0,0_2';
    }
    return key;
  };
  const getShangKey = (key: string) => {
    const hexKey = yaoArr.join(',');
    const info = HEXAGRAMS[hexKey];
    if (!info) return key;
    const gongMing = info.gongMing;
    if (key === '1,0,0') {
      if (gongMing === '艮宫') return '1,0,0_2';
    }
    return key;
  };

  const xiaNaJia = NA_JIA[getXiaKey(xiaKey)] || NA_JIA[xiaKey];
  const shangNaJia = NA_JIA_WAI[getShangKey(shangKey)] || NA_JIA_WAI[shangKey];

  if (!xiaNaJia || !shangNaJia) {
    // fallback: 用默认干支
    return yaoArr.map((_, i) => ({ gan: '甲', zhi: DI_ZHI[i] }));
  }

  return [
    xiaNaJia[0], xiaNaJia[1], xiaNaJia[2],
    shangNaJia[0], shangNaJia[1], shangNaJia[2],
  ];
}

// ─── 旺衰计算 ───

interface WangShuaiResult {
  score: number;      // 旺衰分
  status: string;     // 状态描述
  monthRel: string;   // 月建关系
  dayRel: string;     // 日辰关系
}

/** 计算单爻旺衰 */
function calcWangShuai(
  yaoZhi: string,
  monthZhi: string,
  dayGan: string,
  dayZhi: string,
): WangShuaiResult {
  const yaoWx = WU_XING_MAP[yaoZhi];
  const monthWx = WU_XING_MAP[monthZhi];
  const dayWx = WU_XING_MAP[dayZhi];

  let score = 0;
  const details: string[] = [];

  // 月建关系
  const monthRel = wxRelation(monthWx, yaoWx);
  if (monthRel === '同我') { score += 1; details.push('月扶'); }
  else if (monthRel === '生我') { score += 1; details.push('月生'); }
  else if (monthRel === '克我') { score -= 1; details.push('月克'); }
  else if (monthRel === '我生') { score -= 1; details.push('月泄'); }
  else if (monthRel === '我克') { score += 0; details.push('月耗'); }

  // 日辰关系
  const dayRel = wxRelation(dayWx, yaoWx);
  if (dayRel === '同我') { score += 1; details.push('日扶'); }
  else if (dayRel === '生我') { score += 1; details.push('日生'); }
  else if (dayRel === '克我') { score -= 1; details.push('日克'); }
  else if (dayRel === '我生') { score -= 1; details.push('日泄'); }
  else if (dayRel === '我克') { score += 0; details.push('日耗'); }

  // 入墓检查（日支为辰戌丑未且爻五行相同）
  if (['辰', '戌', '丑', '未'].includes(dayZhi) && WU_XING_MAP[dayZhi] === yaoWx) {
    score -= 1; details.push('入墓');
  }

  let status: string;
  if (score >= 2) status = '旺';
  else if (score === 1) status = '相';
  else if (score === 0) status = '休';
  else if (score === -1) status = '囚';
  else status = '死';

  return { score, status, monthRel: details.filter(d => d.startsWith('月'))[0] || '', dayRel: details.filter(d => d.startsWith('日'))[0] || '' };
}

// ─── 回头生克 ───

/** 检查动爻变爻之间的回头生克 */
function getHuiTou(dongYaoZhi: string, bianYaoZhi: string): string | null {
  const dongWx = WU_XING_MAP[dongYaoZhi];
  const bianWx = WU_XING_MAP[bianYaoZhi];
  const rel = wxRelation(bianWx, dongWx); // 变爻对动爻的关系
  if (rel === '生我') return '回头生';
  if (rel === '克我') return '回头克';
  return null;
}

// ─── 导出类型 ───

export interface YaoDetail {
  position: number;      // 爻位 0-5（初爻到上爻）
  yinYang: number;       // 1=阳, 0=阴
  isDong: boolean;       // 是否动爻
  ganZhi: string;        // 纳甲干支
  liuQin: string;        // 六亲
  liuShen: string;       // 六神
  wuXing: string;        // 五行
  wangShuai: WangShuaiResult; // 旺衰
  bianZhi?: string;      // 变爻地支（动爻才有）
  huiTou?: string;       // 回头生克（动爻才有）
  yaoCi?: string;        // 爻辞
  isShi: boolean;        // 是否世爻
  isYing: boolean;       // 是否应爻
  isKong: boolean;       // 是否旬空
}

export interface LiuYaoResult {
  benGua: string;        // 本卦名
  bianGua: string;       // 变卦名
  benGong: string;       // 本宫名
  guaType: string;       // 卦类型（本宫卦/一世卦/...）
  guaCi: string;         // 卦辞
  yaoDetails: YaoDetail[];
  dongYaoIdx: number[];  // 动爻索引
  monthGanZhi: string;   // 月建干支
  dayGanZhi: string;     // 日辰干支
  xunKong: string[];     // 旬空地支
  liuShenOrder: string[]; // 六神排列
}

// ─── 主函数 ───

/**
 * 六爻排盘
 * @param year 年
 * @param month 月 (1-12)
 * @param day 日
 * @param hour 时 (0-23)
 * @param dongYaoIdxs 动爻位置数组 (0-5, 从初爻到上爻)
 */
export function calculateLiuYao(
  year: number, month: number, day: number, hour: number,
  dongYaoIdxs: number[],
): LiuYaoResult {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const lunarDay = lunar.getDay();
  const lunarMonth = lunar.getMonth();
  const hourZhiIdx = Math.floor((hour + 1) / 2) % 12;

  // 日干支
  const dayGanIdx = lunarDay % 10;
  const dayZhiIdx = lunarDay % 12;
  const dayGan = TIAN_GAN[(dayGanIdx + 9) % 10]; // ponytail: lunar-javascript returns 1-based
  const dayZhi = DI_ZHI[(dayZhiIdx + 11) % 12];

  // 月建
  const monthGanIdx = lunarMonth % 10;
  const monthZhiIdx = lunarMonth % 12;
  const monthGan = TIAN_GAN[(monthGanIdx + 9) % 10];
  const monthZhi = DI_ZHI[(monthZhiIdx + 11) % 12];

  // 用lunar-javascript获取精确的干支
  const dayGanZhi = lunar.getDayInGanZhi();
  const monthGanZhi = lunar.getMonthInGanZhi();

  // 旬空
  const dayGanZhiGanIdx = TIAN_GAN.indexOf(dayGanZhi[0]);
  const dayGanZhiZhiIdx = DI_ZHI.indexOf(dayGanZhi[1]);
  const xunKong = getXunKong(dayGanZhiGanIdx, dayGanZhiZhiIdx);

  // 六神起始
  const liuShenStart = getLiuShenStart(dayGanZhiGanIdx);
  const liuShenOrder = Array.from({ length: 6 }, (_, i) => LIU_SHEN[(liuShenStart + i) % 6]);

  // 本卦编码（6爻从初到上）
  const benGuaYao: number[] = [];
  for (let i = 0; i < 6; i++) {
    benGuaYao.push(dongYaoIdxs.includes(i) ? 1 : 1); // ponytail: 先全部按阳爻算，后面通过外部传入的yaoArr
  }

  // 实际上需要外部传入卦象编码，这里我们自动生成随机卦象
  // 但更合理的是让用户手动输入三组数字来确定卦象
  // 目前用时间+随机数确定一个卦
  const yaoArr = generateGuaYao(year, month, day, hour);

  const benGuaKey = yaoArr.join(',');
  const hexInfo = HEXAGRAMS[benGuaKey];
  if (!hexInfo) {
    // fallback: 用乾卦
    return calculateLiuYao(year, month, day, hour, dongYaoIdxs.length > 0 ? dongYaoIdxs : [0]);
  }

  // 变卦编码
  const bianGuaYao = yaoArr.map((y, i) => dongYaoIdxs.includes(i) ? (y === 1 ? 0 : 1) : y);
  const bianGuaKey = bianGuaYao.join(',');
  const bianHexInfo = HEXAGRAMS[bianGuaKey];

  // 纳甲
  const naJia = getNaJia(yaoArr);

  // 本宫五行（"我"的五行）
  const gongWx = WU_XING_MAP[hexInfo.gongMing.replace('宫', '')];

  // 爻辞
  const texts = HEXAGRAM_TEXTS[hexInfo.guaMing];

  // 构建爻详情
  const yaoDetails: YaoDetail[] = yaoArr.map((yy, i) => {
    const nj = naJia[i];
    const yaoZhi = nj.zhi;
    const yaoWx = WU_XING_MAP[yaoZhi];
    const liuQin = gongWx ? LIU_QIN_MAP[wxRelation(gongWx, yaoWx)] : '兄弟';
    const isDong = dongYaoIdxs.includes(i);
    const isKong = xunKong.includes(yaoZhi);
    const ws = calcWangShuai(yaoZhi, monthGanZhi[1], dayGanZhi[0], dayGanZhi[1]);

    let bianZhi: string | undefined;
    let huiTou: string | undefined;
    if (isDong) {
      const bianNaJia = getNaJia(bianGuaYao);
      bianZhi = bianNaJia[i].zhi;
      huiTou = getHuiTou(yaoZhi, bianZhi) || undefined;
    }

    return {
      position: i,
      yinYang: yy,
      isDong,
      ganZhi: nj.gan + nj.zhi,
      liuQin,
      liuShen: liuShenOrder[i],
      wuXing: yaoWx,
      wangShuai: ws,
      bianZhi,
      huiTou,
      yaoCi: texts?.yaoCi?.[i],
      isShi: hexInfo.shiYaoIdx === i,
      isYing: hexInfo.yingYaoIdx === i,
      isKong,
    };
  });

  return {
    benGua: hexInfo.guaMing,
    bianGua: bianHexInfo?.guaMing || '',
    benGong: hexInfo.gongMing,
    guaType: hexInfo.guaType,
    guaCi: texts?.guaCi || '',
    yaoDetails,
    dongYaoIdx: dongYaoIdxs,
    monthGanZhi: monthGanZhi,
    dayGanZhi: dayGanZhi,
    xunKong,
    liuShenOrder,
  };
}

/** 根据时间自动生成卦象编码（简易随机法） */
function generateGuaYao(year: number, month: number, day: number, hour: number): number[] {
  // ponytail: 简单哈希确定卦象，实际占卜应由用户手动摇卦
  const seed = year * 10000 + month * 100 + day + hour;
  const yaoArr: number[] = [];
  let s = seed;
  for (let i = 0; i < 6; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    yaoArr.push(s % 2);
  }
  // 确保是64卦中的有效编码
  const key = yaoArr.join(',');
  if (!HEXAGRAMS[key]) {
    // fallback: 返回乾卦
    return [1, 1, 1, 1, 1, 1];
  }
  return yaoArr;
}

/**
 * 根据用户手动输入的卦象编码计算
 * @param yaoArr 6位数组，1=阳爻 0=阴爻，从初爻到上爻
 * @param dongYaoIdxs 动爻索引
 * @param year 年
 * @param month 月
 * @param day 日
 * @param hour 时
 */
export function calculateLiuYaoFromYao(
  yaoArr: number[],
  dongYaoIdxs: number[],
  year: number, month: number, day: number, hour: number,
): LiuYaoResult {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();

  const dayGanZhi = lunar.getDayInGanZhi();
  const monthGanZhi = lunar.getMonthInGanZhi();

  const dayGanZhiGanIdx = TIAN_GAN.indexOf(dayGanZhi[0]);
  const dayGanZhiZhiIdx = DI_ZHI.indexOf(dayGanZhi[1]);
  const xunKong = getXunKong(dayGanZhiGanIdx, dayGanZhiZhiIdx);

  const liuShenStart = getLiuShenStart(dayGanZhiGanIdx);
  const liuShenOrder = Array.from({ length: 6 }, (_, i) => LIU_SHEN[(liuShenStart + i) % 6]);

  const benGuaKey = yaoArr.join(',');
  const hexInfo = HEXAGRAMS[benGuaKey];
  if (!hexInfo) {
    // 无效卦象，返回乾卦
    return calculateLiuYaoFromYao([1, 1, 1, 1, 1, 1], dongYaoIdxs, year, month, day, hour);
  }

  // 变卦编码
  const bianGuaYao = yaoArr.map((y, i) => dongYaoIdxs.includes(i) ? (y === 1 ? 0 : 1) : y);
  const bianGuaKey = bianGuaYao.join(',');
  const bianHexInfo = HEXAGRAMS[bianGuaKey];

  const naJia = getNaJia(yaoArr);
  const gongWx = WU_XING_MAP[hexInfo.gongMing.replace('宫', '')];
  const texts = HEXAGRAM_TEXTS[hexInfo.guaMing];

  const yaoDetails: YaoDetail[] = yaoArr.map((yy, i) => {
    const nj = naJia[i];
    const yaoZhi = nj.zhi;
    const yaoWx = WU_XING_MAP[yaoZhi];
    const liuQin = gongWx ? LIU_QIN_MAP[wxRelation(gongWx, yaoWx)] : '兄弟';
    const isDong = dongYaoIdxs.includes(i);
    const isKong = xunKong.includes(yaoZhi);
    const ws = calcWangShuai(yaoZhi, monthGanZhi[1], dayGanZhi[0], dayGanZhi[1]);

    let bianZhi: string | undefined;
    let huiTou: string | undefined;
    if (isDong) {
      const bianNaJia = getNaJia(bianGuaYao);
      bianZhi = bianNaJia[i].zhi;
      huiTou = getHuiTou(yaoZhi, bianZhi) || undefined;
    }

    return {
      position: i,
      yinYang: yy,
      isDong,
      ganZhi: nj.gan + nj.zhi,
      liuQin,
      liuShen: liuShenOrder[i],
      wuXing: yaoWx,
      wangShuai: ws,
      bianZhi,
      huiTou,
      yaoCi: texts?.yaoCi?.[i],
      isShi: hexInfo.shiYaoIdx === i,
      isYing: hexInfo.yingYaoIdx === i,
      isKong,
    };
  });

  return {
    benGua: hexInfo.guaMing,
    bianGua: bianHexInfo?.guaMing || '',
    benGong: hexInfo.gongMing,
    guaType: hexInfo.guaType,
    guaCi: texts?.guaCi || '',
    yaoDetails,
    dongYaoIdx: dongYaoIdxs,
    monthGanZhi: monthGanZhi,
    dayGanZhi: dayGanZhi,
    xunKong,
    liuShenOrder,
  };
}

export { YAO_WEI, DI_ZHI, TIAN_GAN, WU_XING_MAP };
