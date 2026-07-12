declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
    static fromDate(date: Date): Solar;
    getLunar(): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
  }

  export class Lunar {
    getEightChar(): EightChar;
    getYearGanZhi(): string;
    getMonthGanZhi(): string;
    getDayGanZhi(): string;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getTimeGanZhi(): string;
    getYearShengXiao(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getDayXun(): string;
    getDayXunKong(): string;
    getDayYi(): string[];
    getDayJi(): string[];
    getDayNineStar(): NineStar;
    getLiuYao(): string;
    getHou(): string;
    getWuHou(): string;
    getJieQi(): string;
    getCurrentJieQi(): string;
  }

  export class EightChar {
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getMingGong(): string;
    getShenGong(): string;
    getMingGongNaYin(): string;
    getShenGongNaYin(): string;
  }

  export class NineStar {
    getNumber(): number | string;
    getColor(): string;
    getWuXing(): string;
    getPosition(): string;
    getNameInQiMen(): string;
    getLuckInQiMen(): string;
    getYinYangInQiMen(): string;
    getBaMenInQiMen(): string;
  }
}
