/* ============================================================
 * model.js —— 惠城产业风洞 统一模型内核
 * future / windtunnel / report 三页共用这一份，保证同一个问题
 * 在三个入口得到同一套基准、同一种子、同一概率。
 *
 * 口径说明：
 *  - BASE 632.7 亿：2025 年惠城高新区实测产值（现实锚点）
 *  - TARGET 1500 亿：模型外延参考目标，非政府刚性指标
 *  - 五条路径 μ/σ：模型设定的情景参数，非实测相关
 *  - 全局噪声 8%：模型设定的外部冲击波动
 *  - 分位数用线性插值；路径相关系数 = |corr(路径贡献, 总产值)|
 * ============================================================ */
const HT = {
  BASE: 632.7,
  TARGET: 1500,
  NOISE_SD: 0.08,
  DEFAULT_PATHS: [
    {mu: 500, sd: 100, name: '新投产项目', color: '#3b82f6'},
    {mu: 200, sd: 60,  name: '三大集群',   color: '#8b5cf6'},
    {mu: 100, sd: 40,  name: 'AI机器人',   color: '#06b6d4'},
    {mu: 100, sd: 40,  name: '服务业带动', color: '#fbbf24'},
    {mu: 50,  sd: 30,  name: '融深融湾',   color: '#f87171'}
  ],

  mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  },
  makeRandn(prng) {
    return function () {
      let u = 0, v = 0;
      while (u === 0) u = prng();
      while (v === 0) v = prng();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
  },
  quantile(sorted, q) {
    if (!sorted.length) return NaN;
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos), w = pos - lo;
    return sorted[lo] * (1 - w) + sorted[hi] * w;
  },
  corr(xs, ys) {
    const n = xs.length;
    let mx = 0, my = 0;
    for (let k = 0; k < n; k++) { mx += xs[k]; my += ys[k]; }
    mx /= n; my /= n;
    let num = 0, dx = 0, dy = 0;
    for (let k = 0; k < n; k++) {
      num += (xs[k] - mx) * (ys[k] - my);
      dx += (xs[k] - mx) * (xs[k] - mx);
      dy += (ys[k] - my) * (ys[k] - my);
    }
    return num / Math.sqrt(dx * dy);
  },

  /**
   * 跑一次完整蒙特卡洛。
   * @param {number} seed 随机种子（同种子必同结果）
   * @param {number} N 模拟次数
   * @param {Array} paths [{mu,sd,name,color}]
   * @param {object} opts {base,target,noise} 覆盖默认（风洞压测用）
   * @returns {p10,p50,p90,hit,coefs,results,rawResults}
   */
  run(seed, N, paths, opts = {}) {
    const base = opts.base != null ? opts.base : this.BASE;
    const target = opts.target != null ? opts.target : this.TARGET;
    const noise = opts.noise != null ? opts.noise : this.NOISE_SD;
    const prng = this.mulberry32(seed), randn = this.makeRandn(prng);
    const raw = [], sorted = [], contribs = paths.map(() => []);
    for (let i = 0; i < N; i++) {
      let total = base;
      for (let j = 0; j < paths.length; j++) {
        let v = paths[j].mu + randn() * paths[j].sd;
        if (v < 0) v = 0;
        total += v;
        contribs[j].push(v);
      }
      total *= 1 + randn() * noise;
      raw.push(total);
      sorted.push(total);
    }
    sorted.sort((a, b) => a - b);
    return {
      p10: this.quantile(sorted, 0.10),
      p50: this.quantile(sorted, 0.50),
      p90: this.quantile(sorted, 0.90),
      hit: sorted.filter(x => x >= target).length / N * 100,
      coefs: contribs.map(c => Math.abs(this.corr(c, raw))),
      results: sorted,
      rawResults: raw
    };
  }
};
if (typeof module !== 'undefined' && module.exports) module.exports = HT;
