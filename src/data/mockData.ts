// Project Compass - Mock Data v2
// 5个真实样本：Loopio / AutoRFP.ai / Inventive AI / SafeBase / Guru

export type ProjectStatus = '未支持' | '支持中' | '已关闭'
export type CommitmentBoundary = '暂不继续' | '继续观察' | '可以接触' | '可以投入有限试点'
export type InfoLayer = '公开事实' | '发起方主张' | '当前未知'
export type EvidenceType = 'website' | 'pricing' | 'security' | 'integration' | 'case_study' | 'help_doc' | 'user_review' | 'changelog'
export type FlagLevel = '致命' | '需关注' | '已解释'
export type SignalStatus = '已验证' | '被削弱' | '尚不清楚' | '已否定'

// 新假设维度：从机会本身的价值主张反推"成立需要哪些条件为真"
export type AssumptionDimension = '商业化层面' | '用户层面' | '技术层面' | '适配层面' | '风险层面'
export type AssumptionStance = '支撑' | '存疑' | '否定' | '待评估'

export interface InfoItem {
  id: string
  content: string
  source?: string
  sourceUrl?: string
  layer: InfoLayer
  aiGenerated: boolean
  userConfirmed: boolean
  reliability?: 'high' | 'medium' | 'low'
}

export interface Evidence {
  id: string
  type: EvidenceType
  title: string
  summary: string
  url?: string
  reliability: 'high' | 'medium' | 'low'
  aiGenerated: boolean
}

export interface RedFlag {
  id: string
  content: string
  category: '定价透明度' | '案例匹配度' | '安全治理' | '集成路径' | '结果可验证性' | '适用对象' | '成熟度' | '其他'
  dimensionId: string   // 关联到哪个假设维度
  level: FlagLevel | null
  userNote?: string
  aiGenerated: boolean
}

// 重构后的假设：每个维度是一个自洽性检验单元
export interface AssumptionDimensionBlock {
  id: string
  dimension: AssumptionDimension
  // 乐观前提：要这件事成立，需要相信什么
  optimisticPremise: string
  // 当前证据摘要（AI 生成，面向这个维度）
  evidenceSummary: string
  // 悖论信号：哪些已知信息与这个前提矛盾
  paradoxSignals: string[]
  // 关联公开证据
  supportingEvidence: string[]   // Evidence id refs
  weakeningEvidence: string[]    // Evidence id refs
  // 关联红旗
  relatedFlags: string[]         // RedFlag id refs
  // 用户对这个维度的整体判断
  stance: AssumptionStance
  userNote?: string
  aiGenerated: boolean
}

export interface TrackingSignal {
  id: string
  dimensionId: string
  description: string
  status: SignalStatus
  lastUpdate?: string
  note?: string
}

export interface DecisionSnapshot {
  id: string
  createdAt: string
  boundary: CommitmentBoundary
  keyDimensions: string[]
  modificationTriggers: {
    upgrade: string
    pause: string
    exit: string
  }
  reviewDate: string
  frozenAt?: string
}

export interface ReviewNote {
  id: string
  createdAt: string
  boundaryChange: string
  isWrongDecision: boolean
  wrongDecisionAnalysis?: string
  summary: string
}

export interface Project {
  id: string
  name: string
  nameEn: string
  category: string
  tagline: string
  targetProblem: string
  proposer: string
  publicUrl: string
  status: ProjectStatus
  currentBoundary: CommitmentBoundary
  topRedFlag: string
  hasNewInfo: boolean
  lastSignalDate: string
  reviewReminder?: string
  confidenceLevel: 'high' | 'medium' | 'low'

  // 合并后的 Tab A: 信息搜集与分层
  infoItems: InfoItem[]
  evidence: Evidence[]

  // 合并后的 Tab B: 假设·证据·红旗
  dimensionBlocks: AssumptionDimensionBlock[]
  redFlags: RedFlag[]
  allDimensionsReviewed: boolean
  allFlagsTriaged: boolean

  // Tab C: 决策快照
  decisionSnapshot?: DecisionSnapshot

  // Tab D: 跟踪信号
  trackingSignals: TrackingSignal[]

  // Tab E: 复盘归档
  reviewNotes: ReviewNote[]

  createdAt: string
  updatedAt: string
}

// ============================================================
// MOCK DATA
// ============================================================

export const mockProjects: Project[] = [

  // ─────────────────────────────────────────────────────────
  // 1. Loopio
  // ─────────────────────────────────────────────────────────
  {
    id: 'loopio',
    name: 'Loopio',
    nameEn: 'Loopio',
    category: 'Proposal / RFP AI',
    tagline: '成熟的 RFP / 安全问卷 / 销售提案响应平台，公开信号完整',
    targetProblem: '帮助销售、售前和响应团队更高效地完成 RFP、安全问卷和销售提案',
    proposer: 'Loopio Inc.',
    publicUrl: 'https://loopio.com',
    status: '支持中',
    currentBoundary: '继续观察',
    topRedFlag: '起步价格偏高，案例主要来自大型组织',
    hasNewInfo: true,
    lastSignalDate: '2天前',
    reviewReminder: '4月10日',
    confidenceLevel: 'high',

    infoItems: [
      { id: 'l-i1', content: '官网明确标注适用场景：RFPs、Security Questionnaires、Sales Proposals', source: 'Loopio 官网', sourceUrl: 'https://loopio.com', layer: '公开事实', aiGenerated: true, userConfirmed: true },
      { id: 'l-i2', content: '定价页公开起步价约 $625/月，有分级方案', source: 'Loopio Pricing', sourceUrl: 'https://loopio.com/pricing/', layer: '公开事实', aiGenerated: true, userConfirmed: true },
      { id: 'l-i3', content: '集成列表覆盖 Salesforce、Slack、Teams、Google Workspace', source: 'Loopio Integrations', sourceUrl: 'https://loopio.com/platform/integrations/', layer: '公开事实', aiGenerated: true, userConfirmed: false },
      { id: 'l-i4', content: 'Zendesk 案例：使用后 RFP 响应时间减少 60%（千人级企业）', source: 'Zendesk Case Study', sourceUrl: 'https://loopio.com/case-study/zendesk-automates-and-scales-rfp-delivery/', layer: '发起方主张', aiGenerated: true, userConfirmed: true },
      { id: 'l-i5', content: '官网无中文界面说明，本地化支持情况不明', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: false },
      { id: 'l-i6', content: '小团队（<10人）定价和功能限制未在公开页面说明', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: false },
      { id: 'l-i7', content: '付费客户真实留存率和续费数据无公开披露', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: false },
    ],

    evidence: [
      { id: 'l-ev1', type: 'website', title: '官网定位清晰', summary: '明确覆盖 RFP、安全问卷、销售提案三类场景', url: 'https://loopio.com', reliability: 'high', aiGenerated: true },
      { id: 'l-ev2', type: 'pricing', title: '定价部分透明', summary: '有公开起步价，但高级功能需联系销售，小团队适配性不明', url: 'https://loopio.com/pricing/', reliability: 'medium', aiGenerated: true },
      { id: 'l-ev3', type: 'integration', title: '集成生态成熟', summary: '与主流 CRM / 沟通工具有集成文档，可信度高', url: 'https://loopio.com/platform/integrations/', reliability: 'high', aiGenerated: true },
      { id: 'l-ev4', type: 'case_study', title: 'Zendesk 案例', summary: '千人级企业案例，60% 提速，但与小团队场景差距较大', url: 'https://loopio.com/case-study/zendesk-automates-and-scales-rfp-delivery/', reliability: 'medium', aiGenerated: true },
    ],

    dimensionBlocks: [
      {
        id: 'l-d1', dimension: '商业化层面',
        optimisticPremise: 'Loopio 有稳定的付费客户基础，定价结构支持资源有限团队以可接受成本试用',
        evidenceSummary: '公开定价起步 $625/月，有分级方案，但入门套餐功能是否足够小团队无公开说明。案例客户均为大中型企业，小团队 ROI 难以参考。',
        paradoxSignals: [
          '定价起步点对月预算 $300 以内的团队明显超出范围',
          '公开案例全部来自大型组织，与资源有限团队的成本结构完全不同',
          '无免费试用或自助注册通道，只能联系销售获取报价'
        ],
        supportingEvidence: ['l-ev2'],
        weakeningEvidence: ['l-ev4'],
        relatedFlags: ['l-rf1', 'l-rf2'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 'l-d2', dimension: '用户层面',
        optimisticPremise: '真实用户在持续使用、留存且愿意推荐，使用门槛对非专业团队可接受',
        evidenceSummary: '案例页有 Zendesk 等大客户背书，但独立用户评价（G2/Capterra）情况未在分析中核实。功能丰富但实施复杂度不明。',
        paradoxSignals: [
          '案例全部来自大型组织，反映的是专业 RFP 团队体验，不代表小团队上手难度',
          '帮助中心文档数量多，间接说明产品本身有一定学习曲线',
          '付费客户留存率和用户满意度无公开数据'
        ],
        supportingEvidence: ['l-ev1', 'l-ev3'],
        weakeningEvidence: ['l-ev4'],
        relatedFlags: ['l-rf1'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 'l-d3', dimension: '技术层面',
        optimisticPremise: 'AI 自动填写能力在我们的文档类型和语言要求下表现可靠，不依赖大量人工维护',
        evidenceSummary: '官网和集成文档展示了 AI 功能，但 AI 精度、中文支持、私有知识库效果等核心技术指标均无公开基准测试。',
        paradoxSignals: [
          'AI 效果数字来自官方案例，无独立第三方基准测试',
          '中文支持情况无任何公开说明',
          '知识库初始建设成本和维护负担未量化'
        ],
        supportingEvidence: ['l-ev3'],
        weakeningEvidence: [],
        relatedFlags: ['l-rf3'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 'l-d4', dimension: '适配层面',
        optimisticPremise: '我们的 RFP/提案工作量足够高，且现有文档格式与 Loopio 兼容，迁移成本可控',
        evidenceSummary: '集成列表覆盖主流工具，但历史内容迁移路径、小团队工作流是否匹配，缺乏公开说明。',
        paradoxSignals: [
          '无法确认我们团队的 RFP 频率是否达到工具化的经济门槛',
          '现有知识库格式兼容性未知',
          '月预算上限 $300 与起步价 $625 存在明显缺口'
        ],
        supportingEvidence: ['l-ev3'],
        weakeningEvidence: ['l-ev2'],
        relatedFlags: ['l-rf2'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 'l-d5', dimension: '风险层面',
        optimisticPremise: 'Loopio 作为成熟产品，不存在突然停服、安全合规或竞争替代的重大风险',
        evidenceSummary: 'Loopio 成立多年，客户规模有一定体量，但安全合规细节（SOC2等级、数据驻留）无公开概览，且 AI RFP 赛道竞争加剧。',
        paradoxSignals: [
          '安全合规说明在公开页面不可直接查阅，需额外申请',
          'AI RFP 领域竞争激烈，新产品（Inventive AI、AutoRFP等）定价更低',
          '成熟产品通常意味着价格刚性，不易谈到小团队友好价格'
        ],
        supportingEvidence: ['l-ev1'],
        weakeningEvidence: [],
        relatedFlags: ['l-rf4'],
        stance: '待评估', aiGenerated: true
      }
    ],

    redFlags: [
      { id: 'l-rf1', content: '公开案例全部来自大型/中型企业，无资源有限小团队适配验证', category: '案例匹配度', dimensionId: 'l-d1', level: null, aiGenerated: true },
      { id: 'l-rf2', content: '起步价 $625/月 超出月预算 $300 上限，小团队门槛过高', category: '定价透明度', dimensionId: 'l-d4', level: null, aiGenerated: true },
      { id: 'l-rf3', content: '中文支持和本地化能力无公开说明，存在语言适配风险', category: '适用对象', dimensionId: 'l-d3', level: null, aiGenerated: true },
      { id: 'l-rf4', content: '安全合规细节（SOC2等级、数据驻留选项）无法从公开页面查阅', category: '安全治理', dimensionId: 'l-d5', level: null, aiGenerated: true },
    ],
    allDimensionsReviewed: false,
    allFlagsTriaged: false,

    trackingSignals: [
      { id: 'l-ts1', dimensionId: 'l-d1', description: '是否能获取到资源有限团队的试用报价或 Starter 方案', status: '尚不清楚', lastUpdate: '2天前' },
      { id: 'l-ts2', dimensionId: 'l-d2', description: '团队在过去3个月内是否实际参与过 RFP 响应工作', status: '尚不清楚' },
    ],
    reviewNotes: [],
    createdAt: '2026-03-20', updatedAt: '2026-03-28'
  },

  // ─────────────────────────────────────────────────────────
  // 2. AutoRFP.ai
  // ─────────────────────────────────────────────────────────
  {
    id: 'autorfp',
    name: 'AutoRFP.ai',
    nameEn: 'AutoRFP.ai',
    category: 'Proposal / RFP AI',
    tagline: '定价透明、营销主张密集，典型"说法强但证据薄"样本',
    targetProblem: '用 AI 自动回答 RFP / 安全问卷，宣称节省 90% 响应时间',
    proposer: 'AutoRFP Inc.',
    publicUrl: 'https://autorfp.ai',
    status: '支持中',
    currentBoundary: '继续观察',
    topRedFlag: '核心主张"节省90%时间"缺少独立验证，成熟度证明面薄',
    hasNewInfo: false,
    lastSignalDate: '5天前',
    reviewReminder: '4月15日',
    confidenceLevel: 'medium',

    infoItems: [
      { id: 'a-i1', content: '定价页公开三档：Starter $49/月、Pro $149/月、Enterprise 定制', source: 'AutoRFP.ai Pricing', sourceUrl: 'https://autorfp.ai/pricing', layer: '公开事实', aiGenerated: true, userConfirmed: true },
      { id: 'a-i2', content: '官网宣称"节省高达 90% 的提案撰写时间"，直接与竞品做价格对比', source: 'AutoRFP.ai 首页', sourceUrl: 'https://autorfp.ai', layer: '发起方主张', aiGenerated: true, userConfirmed: true },
      { id: 'a-i3', content: 'Trust 页面提及 SOC 2 Type II，但报告无公开查看渠道', source: 'AutoRFP.ai Trust', sourceUrl: 'https://autorfp.ai/trust', layer: '发起方主张', aiGenerated: true, userConfirmed: false },
      { id: 'a-i4', content: '客户故事入口存在，但内容为简短引用，无第三方独立核验', source: 'AutoRFP.ai Customer Stories', sourceUrl: 'https://autorfp.ai/customer-stories', layer: '发起方主张', aiGenerated: true, userConfirmed: false },
      { id: 'a-i5', content: '"节省 90% 时间"的计算基准和方法论未公开说明', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: false },
      { id: 'a-i6', content: '产品成立时间、团队规模、融资状况无公开披露', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: false },
      { id: 'a-i7', content: '实际付费客户数量和行业分布无公开数据', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: false },
    ],

    evidence: [
      { id: 'a-ev1', type: 'pricing', title: '定价透明', summary: 'Starter $49 入门门槛低，三档清晰，适合小团队初试', url: 'https://autorfp.ai/pricing', reliability: 'high', aiGenerated: true },
      { id: 'a-ev2', type: 'security', title: 'Trust 页（自述）', summary: '声称 SOC 2 Type II，但报告未公开可查', url: 'https://autorfp.ai/trust', reliability: 'low', aiGenerated: true },
      { id: 'a-ev3', type: 'case_study', title: '客户故事（弱）', summary: '简短引用，无独立核验，更像营销文案', url: 'https://autorfp.ai/customer-stories', reliability: 'low', aiGenerated: true },
    ],

    dimensionBlocks: [
      {
        id: 'a-d1', dimension: '商业化层面',
        optimisticPremise: 'AutoRFP.ai 有真实付费客户基础，$49 起的定价可持续支撑产品迭代',
        evidenceSummary: '定价页透明，三档清晰，入门价格对小团队友好。但产品成立时间、融资状况、付费客户规模均无公开数据，无法判断商业可持续性。',
        paradoxSignals: [
          '定价透明但未披露客户数量，无法判断是否有足够规模支撑产品运营',
          '无融资公告、无公司背景信息，难以评估长期可持续性',
          '与竞品（包括成熟产品 Loopio）做直接价格对比，是常见初创营销手法，不能等同于能力对比'
        ],
        supportingEvidence: ['a-ev1'],
        weakeningEvidence: ['a-ev3'],
        relatedFlags: ['a-rf4'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 'a-d2', dimension: '用户层面',
        optimisticPremise: '"节省 90% 时间"的效果在真实用户场景中大致成立，用户在持续使用',
        evidenceSummary: '官网有客户故事页，但均为官方发布的简短引用，无 G2/Capterra 独立评分，无法判断真实留存和满意度。核心效果数字完全不透明。',
        paradoxSignals: [
          '"节省 90% 时间"是核心卖点，但计算基准完全不透明——不知道是与什么场景对比',
          '客户故事仅为简短引用，无客户公司名、规模、使用场景等可核验信息',
          '无 G2、Capterra 或其他独立用户评价平台数据'
        ],
        supportingEvidence: [],
        weakeningEvidence: ['a-ev3'],
        relatedFlags: ['a-rf1', 'a-rf2'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 'a-d3', dimension: '技术层面',
        optimisticPremise: 'AI 核心能力真实有效，SOC 2 Type II 合规承诺可信，数据安全有保障',
        evidenceSummary: '官网展示 AI 功能，但无技术架构说明。Trust 页声称 SOC 2 Type II 但报告不可查，合规承诺的实际状态存疑。',
        paradoxSignals: [
          'SOC 2 Type II 仅为自述，无法从公开渠道查阅审计报告',
          'AI 技术能力无任何基准测试或第三方评测',
          '是否基于通用大模型 API 还是自研能力完全不透明'
        ],
        supportingEvidence: [],
        weakeningEvidence: ['a-ev2'],
        relatedFlags: ['a-rf3'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 'a-d4', dimension: '适配层面',
        optimisticPremise: '$49 的起步价格在试点预算范围内，功能够用，上手门槛低',
        evidenceSummary: 'Starter $49/月 在 $300 月预算内。但功能边界不清晰，与现有工具的集成路径无公开文档。',
        paradoxSignals: [
          '定价透明不等于功能透明，Starter 套餐具体限制未说清',
          '与现有工具（如 CRM、邮件、文档系统）的集成路径无公开说明',
          '门槛低的背后可能是功能有限，与成熟度高的产品差距未知'
        ],
        supportingEvidence: ['a-ev1'],
        weakeningEvidence: [],
        relatedFlags: [],
        stance: '支撑', aiGenerated: true
      },
      {
        id: 'a-d5', dimension: '风险层面',
        optimisticPremise: '产品不会突然停服，数据不会泄露，不会因为竞争而快速被淘汰',
        evidenceSummary: '公司背景信息极少，融资状况不明，成立时间不详。AI RFP 赛道竞争激烈，初创产品停服风险高于成熟平台。',
        paradoxSignals: [
          '无任何公司背景公开信息，停服风险无法评估',
          '安全合规实际执行状态不透明，数据处理方式不明',
          '如果基于第三方 AI API，核心功能可能随 API 政策变化而变化'
        ],
        supportingEvidence: [],
        weakeningEvidence: ['a-ev2'],
        relatedFlags: ['a-rf3', 'a-rf4'],
        stance: '待评估', aiGenerated: true
      }
    ],

    redFlags: [
      { id: 'a-rf1', content: '"节省 90% 时间"核心主张的计算基准和验证方法完全不透明', category: '结果可验证性', dimensionId: 'a-d2', level: null, aiGenerated: true },
      { id: 'a-rf2', content: '官网大量直接拿竞品做价格对比，对比基准公平性无法核实', category: '结果可验证性', dimensionId: 'a-d2', level: null, aiGenerated: true },
      { id: 'a-rf3', content: 'SOC 2 Type II 仅为自述，公开审计报告不可查', category: '安全治理', dimensionId: 'a-d3', level: null, aiGenerated: true },
      { id: 'a-rf4', content: '产品成熟度信号（成立时间、客户规模、融资状况）几乎为零', category: '成熟度', dimensionId: 'a-d1', level: null, aiGenerated: true },
    ],
    allDimensionsReviewed: false,
    allFlagsTriaged: false,

    trackingSignals: [],
    reviewNotes: [],
    createdAt: '2026-03-22', updatedAt: '2026-03-25'
  },

  // ─────────────────────────────────────────────────────────
  // 3. Inventive AI
  // ─────────────────────────────────────────────────────────
  {
    id: 'inventive',
    name: 'Inventive AI',
    nameEn: 'Inventive AI',
    category: 'Proposal / RFP AI',
    tagline: 'AI-first RFP 响应工具，案例信号强，测试"强叙事边界"',
    targetProblem: 'AI 驱动知识库自动完成 RFP 和安全问卷，主打企业级 SSO 和集成',
    proposer: 'Inventive AI Inc.',
    publicUrl: 'https://www.inventive.ai',
    status: '未支持',
    currentBoundary: '继续观察',
    topRedFlag: '结果数字强但缺独立验证，定价完全不透明',
    hasNewInfo: false,
    lastSignalDate: '1周前',
    confidenceLevel: 'medium',

    infoItems: [
      { id: 'i-i1', content: '案例页含多个客户结果，包含"响应时间减少 70%"等数字叙事', source: 'Inventive Case Studies', sourceUrl: 'https://www.inventive.ai/case-studies', layer: '发起方主张', aiGenerated: true, userConfirmed: false },
      { id: 'i-i2', content: '支持 Google Workspace SSO，有专门集成说明页面', source: 'Inventive Integrations', sourceUrl: 'https://www.inventive.ai/integrations/google-workspace-sso', layer: '公开事实', aiGenerated: true, userConfirmed: true },
      { id: 'i-i3', content: '定价未在官网公开，需联系销售获取报价', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: false },
      { id: 'i-i4', content: '案例中客户的组织规模和行业背景未详细说明', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: false },
      { id: 'i-i5', content: 'AI 知识库准确率和在中文场景下的表现无公开数据', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: false },
    ],

    evidence: [
      { id: 'i-ev1', type: 'case_study', title: '案例页（官方发布）', summary: '多个案例含具体数字，但均为官方发布，无独立第三方验证', url: 'https://www.inventive.ai/case-studies', reliability: 'low', aiGenerated: true },
      { id: 'i-ev2', type: 'integration', title: 'SSO 与集成文档', summary: 'Google Workspace SSO 有详细文档，集成能力信号可信', url: 'https://www.inventive.ai/integrations/google-workspace-sso', reliability: 'high', aiGenerated: true },
    ],

    dimensionBlocks: [
      {
        id: 'i-d1', dimension: '商业化层面',
        optimisticPremise: 'Inventive AI 有付费客户基础，定价结构对目标用户可接受',
        evidenceSummary: '定价完全不公开，仅能通过销售获取报价。无融资信息，无客户规模数据。案例页存在但客户背景不详。',
        paradoxSignals: [
          '定价不透明是高门槛销售导向的信号，通常不利于资源有限团队',
          '无客户规模数据，无法判断付费基础是否足够支撑产品持续迭代',
          '案例数字（70% 提速）很强，但如果真有大量客户，通常会配合更多公开指标'
        ],
        supportingEvidence: ['i-ev1'],
        weakeningEvidence: [],
        relatedFlags: ['i-rf2'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 'i-d2', dimension: '用户层面',
        optimisticPremise: '案例中的效果数字（70% 提速等）在类似规模团队中同样可复现',
        evidenceSummary: '案例页有具体结果数字，但均为官方发布。案例客户的规模、行业、使用场景均不详，无法判断是否与我们的场景可比。',
        paradoxSignals: [
          '所有案例均由官方发布，存在选择性展示偏差',
          '案例客户背景不详，70% 提速的基准场景与我们的实际场景可能完全不同',
          '无 G2/Capterra 独立评价，无法独立核验用户满意度'
        ],
        supportingEvidence: ['i-ev1'],
        weakeningEvidence: [],
        relatedFlags: ['i-rf1'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 'i-d3', dimension: '技术层面',
        optimisticPremise: '知识库 AI 能力在我们的文档类型和语言下表现可靠，SSO 集成顺畅',
        evidenceSummary: 'SSO 集成有详细文档，技术可信度相对较高。但 AI 核心能力（知识库准确率、语言支持、私有化部署选项）无公开说明。',
        paradoxSignals: [
          'AI 知识库在中文场景下的效果无任何公开数据',
          '核心 AI 能力是否自研还是基于通用 API 完全不透明',
          '70% 提速的技术实现路径无法从公开材料推断'
        ],
        supportingEvidence: ['i-ev2'],
        weakeningEvidence: ['i-ev1'],
        relatedFlags: ['i-rf1', 'i-rf3'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 'i-d4', dimension: '适配层面',
        optimisticPremise: 'Google Workspace SSO 与我们现有系统兼容，知识库迁移成本可控',
        evidenceSummary: 'SSO 集成文档较完整，如果现有系统使用 Google Workspace，集成路径相对清晰。但预算可行性无法判断（定价不公开）。',
        paradoxSignals: [
          '定价不公开导致无法在接触前判断预算可行性',
          '知识库初始导入的格式要求和成本无公开说明',
          '仅有 Google SSO 文档，其他集成路径（如 CRM、企业邮件）不明'
        ],
        supportingEvidence: ['i-ev2'],
        weakeningEvidence: [],
        relatedFlags: ['i-rf2'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 'i-d5', dimension: '风险层面',
        optimisticPremise: '产品稳定可持续，不存在数据安全或突然停服的重大风险',
        evidenceSummary: '安全合规信息在公开页面无法直接查阅。公司背景、融资情况不明，早期 AI 产品普遍存在停服风险。',
        paradoxSignals: [
          '安全合规信息（SOC2、数据驻留）无公开入口',
          '公司背景信息不透明，停服风险无法评估',
          'AI RFP 赛道竞争加剧，早期产品生存压力大'
        ],
        supportingEvidence: [],
        weakeningEvidence: [],
        relatedFlags: ['i-rf3'],
        stance: '待评估', aiGenerated: true
      }
    ],

    redFlags: [
      { id: 'i-rf1', content: '案例结果数字（70%提速等）全部来自官方发布，无独立验证', category: '结果可验证性', dimensionId: 'i-d2', level: null, aiGenerated: true },
      { id: 'i-rf2', content: '定价完全不透明，仅通过销售获取，无法在接触前评估预算可行性', category: '定价透明度', dimensionId: 'i-d1', level: null, aiGenerated: true },
      { id: 'i-rf3', content: '安全合规信息在公开页面无法直接查阅', category: '安全治理', dimensionId: 'i-d5', level: null, aiGenerated: true },
    ],
    allDimensionsReviewed: false,
    allFlagsTriaged: false,

    trackingSignals: [],
    reviewNotes: [],
    createdAt: '2026-03-18', updatedAt: '2026-03-23'
  },

  // ─────────────────────────────────────────────────────────
  // 4. SafeBase AI Questionnaire Assistance
  // ─────────────────────────────────────────────────────────
  {
    id: 'safebase',
    name: 'SafeBase AI 问卷助手',
    nameEn: 'SafeBase AI Questionnaire Assistance',
    category: 'Security Questionnaire AI',
    tagline: '专注安全问卷自动响应，公开指标丰富，邻近类目扩展测试',
    targetProblem: '帮助安全和销售团队自动响应安全问卷，减少重复性安全评估工作量',
    proposer: 'SafeBase Inc.',
    publicUrl: 'https://safebase.io',
    status: '未支持',
    currentBoundary: '继续观察',
    topRedFlag: '定位高度专注安全问卷，通用 RFP 团队适配性需验证',
    hasNewInfo: true,
    lastSignalDate: '3天前',
    confidenceLevel: 'high',

    infoItems: [
      { id: 's-i1', content: '产品页明确说明 AI 辅助安全问卷响应，有专门产品页和解决方案页', source: 'SafeBase AI QA', sourceUrl: 'https://safebase.io/products/ai-questionnaire-assistance', layer: '公开事实', aiGenerated: true, userConfirmed: true },
      { id: 's-i2', content: '博客文章披露里程碑：超过 100 万个问题已通过 AI 处理', source: 'SafeBase Blog', sourceUrl: 'https://safebase.io/blog/safebase-aiqa-1-million-questions-milestone', layer: '公开事实', aiGenerated: true, userConfirmed: true },
      { id: 's-i3', content: '有面向安全问卷的专属解决方案页，定位明确', source: 'SafeBase Solutions', sourceUrl: 'https://safebase.io/solutions/security-questionnaires', layer: '公开事实', aiGenerated: true, userConfirmed: false },
      { id: 's-i4', content: '产品是否支持非安全类问卷（如 RFP）未在公开页面说明', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: false },
      { id: 's-i5', content: '定价页面入口不明显，具体费用需联系销售', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: false },
    ],

    evidence: [
      { id: 's-ev1', type: 'website', title: '产品定位清晰', summary: '专注安全问卷，产品页、解决方案页、博客均印证核心定位', url: 'https://safebase.io/products/ai-questionnaire-assistance', reliability: 'high', aiGenerated: true },
      { id: 's-ev2', type: 'changelog', title: '里程碑数据（100万问题）', summary: '有公开博客文章记录，处理量规模可独立核验', url: 'https://safebase.io/blog/safebase-aiqa-1-million-questions-milestone', reliability: 'high', aiGenerated: true },
    ],

    dimensionBlocks: [
      {
        id: 's-d1', dimension: '商业化层面',
        optimisticPremise: 'SafeBase 在安全问卷市场有真实付费客户，产品商业模式成立',
        evidenceSummary: '100万问题处理量的里程碑数据显示有相当规模的使用量，但付费客户数量和定价结构不公开，具体收入状况不明。',
        paradoxSignals: [
          '里程碑数据可能包含免费用户，付费规模不明',
          '定价不透明，对资源有限团队是否可负担未知',
          '安全问卷市场是否足够大、是否能支撑独立产品持续运营存疑'
        ],
        supportingEvidence: ['s-ev2'],
        weakeningEvidence: [],
        relatedFlags: ['s-rf3'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 's-d2', dimension: '用户层面',
        optimisticPremise: '安全问卷 AI 效果在真实场景中显著，用户在持续使用且满意度高',
        evidenceSummary: '100万问题处理量是较强的使用量信号，但具体效果数据（响应质量、节省时间）无公开量化指标。',
        paradoxSignals: [
          '处理量数据不等于效果数据，不知道 AI 响应的准确率和人工审核比例',
          '无独立用户评价，满意度未知',
          '产品高度专注安全专业人员，通用 RFP 团队上手难度未知'
        ],
        supportingEvidence: ['s-ev2'],
        weakeningEvidence: [],
        relatedFlags: ['s-rf1'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 's-d3', dimension: '技术层面',
        optimisticPremise: 'SafeBase 的 AI 在安全领域语义理解上有专业深度，不是通用 AI 简单套用',
        evidenceSummary: '产品专注安全问卷场景，有较强的专业定位信号，但核心技术架构和 AI 能力来源无公开说明。',
        paradoxSignals: [
          '技术架构不透明，无法判断是否有专业安全领域训练',
          'AI 在非英文安全问卷中的表现无任何公开数据',
          '100万问题处理量不能说明 AI 准确率'
        ],
        supportingEvidence: ['s-ev1'],
        weakeningEvidence: [],
        relatedFlags: [],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 's-d4', dimension: '适配层面',
        optimisticPremise: '我们的核心需求是安全问卷响应（而非通用 RFP），与 SafeBase 定位高度匹配',
        evidenceSummary: '这是关键的适配前提检验：如果团队的核心痛点确实是安全问卷，SafeBase 是强匹配；如果更多是通用 RFP，则定位偏差较大。',
        paradoxSignals: [
          '如果团队日常更多是通用 RFP 而非安全问卷，SafeBase 的专业化反而是劣势',
          '安全知识库初始建设成本和格式兼容性未公开',
          '定价不透明导致无法在接触前判断预算可行性'
        ],
        supportingEvidence: ['s-ev1'],
        weakeningEvidence: [],
        relatedFlags: ['s-rf1', 's-rf2'],
        stance: '待评估', aiGenerated: true
      },
      {
        id: 's-d5', dimension: '风险层面',
        optimisticPremise: 'SafeBase 作为有一定规模的专业产品，稳定性和安全性有保障',
        evidenceSummary: 'SafeBase 有公开博客和里程碑，产品迭代有据可查。但作为安全工具本身，其数据安全和合规情况的公开说明不足。',
        paradoxSignals: [
          '安全问卷工具本身处理敏感数据，其自身安全合规情况的公开程度反而较低',
          '细分赛道市场空间有限，可能面临大型平台进入的竞争风险',
          '产品背后的公司背景和融资状况不够清晰'
        ],
        supportingEvidence: ['s-ev1'],
        weakeningEvidence: [],
        relatedFlags: [],
        stance: '待评估', aiGenerated: true
      }
    ],

    redFlags: [
      { id: 's-rf1', content: '产品定位高度专注安全问卷，通用 RFP 团队能否受益需先验证核心需求匹配', category: '适用对象', dimensionId: 's-d4', level: null, aiGenerated: true },
      { id: 's-rf2', content: '安全知识库迁移成本和格式兼容性无公开说明', category: '集成路径', dimensionId: 's-d4', level: null, aiGenerated: true },
      { id: 's-rf3', content: '定价不透明，需联系销售，无法在接触前判断预算可行性', category: '定价透明度', dimensionId: 's-d1', level: null, aiGenerated: true },
    ],
    allDimensionsReviewed: false,
    allFlagsTriaged: false,

    trackingSignals: [],
    reviewNotes: [],
    createdAt: '2026-03-25', updatedAt: '2026-03-27'
  },

  // ─────────────────────────────────────────────────────────
  // 5. Guru
  // ─────────────────────────────────────────────────────────
  {
    id: 'guru',
    name: 'Guru',
    nameEn: 'Guru',
    category: 'Enterprise AI Search / Knowledge AI',
    tagline: '企业级 AI 知识搜索，超出 RFP 楔子，已完成评估并关闭',
    targetProblem: '帮助团队建立统一知识库，AI 自动推送相关知识卡片，减少重复性知识整理',
    proposer: 'Guru Technologies Inc.',
    publicUrl: 'https://www.getguru.com',
    status: '已关闭',
    currentBoundary: '暂不继续',
    topRedFlag: '类目偏差：产品解决知识检索问题，不解决 RFP 响应问题',
    hasNewInfo: false,
    lastSignalDate: '2周前',
    confidenceLevel: 'high',

    infoItems: [
      { id: 'g-i1', content: '官网定位：企业级 AI 知识管理，支持与 Slack、Teams、Chrome 等工具集成', source: 'Guru 首页', sourceUrl: 'https://www.getguru.com', layer: '公开事实', aiGenerated: true, userConfirmed: true },
      { id: 'g-i2', content: '定价页有公开分级：Free / Starter / Builder / Enterprise 四档', source: 'Guru Pricing', sourceUrl: 'https://www.getguru.com/pricing', layer: '公开事实', aiGenerated: true, userConfirmed: true },
      { id: 'g-i3', content: '安全页面有详细的 SOC 2 Type II、GDPR 等合规说明', source: 'Guru Security', sourceUrl: 'https://www.getguru.com/security', layer: '公开事实', aiGenerated: true, userConfirmed: true },
      { id: 'g-i4', content: 'AI 知识卡片推送的准确率无公开基准测试数据', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: true },
      { id: 'g-i5', content: '知识库初始建设的时间成本和维护负担无量化说明', source: 'AI 推断', layer: '当前未知', aiGenerated: true, userConfirmed: true },
    ],

    evidence: [
      { id: 'g-ev1', type: 'website', title: '产品定位清晰', summary: '企业级知识管理，官网信号完整，集成生态成熟', url: 'https://www.getguru.com', reliability: 'high', aiGenerated: true },
      { id: 'g-ev2', type: 'pricing', title: '定价透明', summary: '四档公开，有免费层，入门门槛合理', url: 'https://www.getguru.com/pricing', reliability: 'high', aiGenerated: true },
      { id: 'g-ev3', type: 'security', title: '安全合规完整', summary: 'SOC 2 Type II、GDPR 合规有专门安全页，可信度高', url: 'https://www.getguru.com/security', reliability: 'high', aiGenerated: true },
      { id: 'g-ev4', type: 'integration', title: '集成生态丰富', summary: 'Slack、Teams、Salesforce 等主流工具均支持', url: 'https://www.getguru.com/integrations', reliability: 'high', aiGenerated: true },
    ],

    dimensionBlocks: [
      {
        id: 'g-d1', dimension: '商业化层面',
        optimisticPremise: 'Guru 有稳定的商业模式，定价对小团队可接受',
        evidenceSummary: '定价透明，有免费层，商业化信号完整。公司成立时间较长，有一定客户规模。商业层面信号良好。',
        paradoxSignals: [
          '这不是关键矛盾点，商业层面风险较低'
        ],
        supportingEvidence: ['g-ev2'],
        weakeningEvidence: [],
        relatedFlags: [],
        stance: '支撑', aiGenerated: true
      },
      {
        id: 'g-d2', dimension: '用户层面',
        optimisticPremise: 'Guru 的实际用户在持续使用知识管理功能，效率提升显著',
        evidenceSummary: '有一定用户规模信号，但 AI 知识卡片推送的准确率和实际使用体验无独立验证数据。',
        paradoxSignals: [
          'AI 推送准确率低可能导致知识噪音反而增加',
          '知识库维护是持续工程，对资源有限团队是隐性成本'
        ],
        supportingEvidence: ['g-ev1'],
        weakeningEvidence: [],
        relatedFlags: [],
        stance: '存疑', aiGenerated: true
      },
      {
        id: 'g-d3', dimension: '技术层面',
        optimisticPremise: 'AI 知识检索和推送能力成熟可靠',
        evidenceSummary: '集成生态丰富，技术成熟度较高，但 AI 推送准确率无公开基准测试。',
        paradoxSignals: [
          'AI 卡片推送效果无独立基准测试',
          '知识图谱构建依赖人工分类，AI 只做辅助'
        ],
        supportingEvidence: ['g-ev4'],
        weakeningEvidence: [],
        relatedFlags: [],
        stance: '存疑', aiGenerated: true
      },
      {
        id: 'g-d4', dimension: '适配层面',
        optimisticPremise: '我们的核心问题是知识检索效率，Guru 能解决这个问题',
        evidenceSummary: '【关键矛盾】当前确认的核心痛点是 RFP 响应效率，而非知识检索效率。这两个问题有交集但本质不同。引入 Guru 是对错误问题的解决方案。',
        paradoxSignals: [
          '核心需求确认为 RFP 响应，不是知识检索——这是根本性的问题定义偏差',
          '知识库建设需要大量初始投入，而 RFP 响应工具不需要',
          '错误的问题定义会导致工具使用后没有预期效果，浪费资源'
        ],
        supportingEvidence: [],
        weakeningEvidence: ['g-ev1'],
        relatedFlags: ['g-rf1'],
        stance: '否定', aiGenerated: true
      },
      {
        id: 'g-d5', dimension: '风险层面',
        optimisticPremise: 'Guru 稳定可持续，安全合规无忧',
        evidenceSummary: '安全合规良好（SOC 2 Type II、GDPR），产品稳定，风险层面无重大问题。但这不是关闭决策的原因。',
        paradoxSignals: [
          '风险层面不是关键问题，关键问题是适配层面的根本性偏差'
        ],
        supportingEvidence: ['g-ev3'],
        weakeningEvidence: [],
        relatedFlags: [],
        stance: '支撑', aiGenerated: true
      }
    ],

    redFlags: [
      { id: 'g-rf1', content: '【根本性偏差】产品解决知识检索问题，当前核心需求是 RFP 响应效率，两者不是同一个问题', category: '适用对象', dimensionId: 'g-d4', level: '致命', aiGenerated: true },
      { id: 'g-rf2', content: '知识库初始建设是重型工程，对资源有限团队是高隐性成本', category: '集成路径', dimensionId: 'g-d4', level: '需关注', aiGenerated: true },
    ],
    allDimensionsReviewed: true,
    allFlagsTriaged: true,

    decisionSnapshot: {
      id: 'g-snap1',
      createdAt: '2026-03-15',
      boundary: '暂不继续',
      keyDimensions: ['g-d4', 'g-d2'],
      modificationTriggers: {
        upgrade: '仅当团队核心需求从 RFP 响应转向知识管理时可重新评估',
        pause: '当前边界已为暂不继续',
        exit: '已关闭，不再跟踪'
      },
      reviewDate: '2026-09-01',
      frozenAt: '2026-03-15'
    },

    trackingSignals: [
      { id: 'g-ts1', dimensionId: 'g-d4', description: '团队是否出现知识检索瓶颈而非 RFP 响应瓶颈', status: '已否定', lastUpdate: '2026-03-15', note: '核心痛点确认为 RFP 响应，知识管理非优先' }
    ],

    reviewNotes: [
      {
        id: 'g-rev1',
        createdAt: '2026-03-15',
        boundaryChange: '初始评估 → 暂不继续',
        isWrongDecision: false,
        summary: 'Guru 公开信号完整、安全合规良好、商业化成熟，但适配层面存在根本性偏差：当前核心需求是 RFP 响应效率，而 Guru 解决的是知识检索问题。两者有交集但不是同一个问题。在需求定义未转变前，引入 Guru 是对错误问题的解决方案。关闭跟踪，待需求转型后重新评估。'
      }
    ],
    createdAt: '2026-03-10', updatedAt: '2026-03-15'
  }
]

export const defaultResourceContext = {
  role: '中小团队负责人',
  currentGoal: '判断是否值得投入试点预算引入 AI 提案/RFP 响应工具，提升团队响应效率',
  resourceConstraints: '月试点预算上限 $300，可投入 1-2 人的实施时间，约 2-4 周',
  topRisk: '引入后团队实际不使用，或工具与现有流程不兼容导致效率反而下降',
  maxCommitmentLevel: '可以接触' as CommitmentBoundary
}

export const categories = [
  'Proposal / RFP AI',
  'Security Questionnaire AI',
  'Enterprise AI Search / Knowledge AI',
  'Sales Proposal AI',
  'Due Diligence AI'
]
