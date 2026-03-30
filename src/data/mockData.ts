// Project Compass - Mock Data
// 5个真实样本：Loopio / AutoRFP.ai / Inventive AI / SafeBase / Guru

export type ProjectStatus = '未支持' | '支持中' | '已关闭'
export type CommitmentBoundary = '暂不继续' | '继续观察' | '可以接触' | '可以投入有限试点'
export type InfoLayer = '公开事实' | '发起方主张' | '当前未知'
export type EvidenceType = 'website' | 'pricing' | 'security' | 'integration' | 'case_study' | 'help_doc' | 'user_review' | 'changelog'
export type FlagLevel = '致命' | '需关注' | '已解释'
export type AssumptionType = '问题假设' | '能力假设' | '落地假设' | '治理假设' | '资源假设'
export type AssumptionStance = '支撑' | '存疑' | '否定' | '待评估'
export type SignalStatus = '已验证' | '被削弱' | '尚不清楚' | '已否定'

export interface InfoItem {
  id: string
  content: string
  source?: string
  sourceUrl?: string
  layer: InfoLayer
  aiGenerated: boolean
  userConfirmed: boolean // 用户是否确认过
}

export interface Evidence {
  id: string
  type: EvidenceType
  title: string
  summary: string
  url?: string
  reliability: 'high' | 'medium' | 'low' // 可信度
  aiGenerated: boolean
}

export interface RedFlag {
  id: string
  content: string
  category: '定价透明度' | '案例匹配度' | '安全治理' | '集成路径' | '结果可验证性' | '适用对象' | '成熟度' | '其他'
  level: FlagLevel | null // null = 用户未处理
  userNote?: string
  aiGenerated: boolean
}

export interface Assumption {
  id: string
  type: AssumptionType
  content: string
  stance: AssumptionStance
  supportingEvidence: string[]  // Evidence id refs
  weakeningEvidence: string[]   // Evidence id refs
  redFlags: string[]            // RedFlag id refs
  aiGenerated: boolean
}

export interface TrackingSignal {
  id: string
  assumptionId: string
  description: string
  status: SignalStatus
  lastUpdate?: string
  note?: string
}

export interface DecisionSnapshot {
  id: string
  createdAt: string
  boundary: CommitmentBoundary
  keyAssumptions: string[]   // Assumption id refs
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
  wrongDecisionAnalysis?: string // 错判分析，用户必须自己写
  summary: string
}

export interface Project {
  id: string
  name: string
  nameEn: string
  category: string
  tagline: string          // 一句话说明
  targetProblem: string    // 它想解决什么问题
  proposer: string         // 发起方
  publicUrl: string
  status: ProjectStatus
  currentBoundary: CommitmentBoundary
  topRedFlag: string       // 首页卡片显示的最大红旗
  hasNewInfo: boolean      // 有新增信息待处理
  lastSignalDate: string
  reviewReminder?: string
  confidenceLevel: 'high' | 'medium' | 'low'  // 信息丰富度

  // T1 - 信息搜集
  infoItems: InfoItem[]

  // T2 - 分层后的 Evidence
  evidence: Evidence[]

  // T3 - 关键假设
  assumptions: Assumption[]

  // T4 - 逻辑串联完成标志（用户必须对每个假设给出态度）
  logicReviewCompleted: boolean

  // T5 - 红旗与反证
  redFlags: RedFlag[]
  allFlagsTriaged: boolean // 所有红旗都有用户定级

  // T6 - 决策快照
  decisionSnapshot?: DecisionSnapshot

  // T7 - 跟踪信号
  trackingSignals: TrackingSignal[]

  // T8 - 复盘归档
  reviewNotes: ReviewNote[]

  createdAt: string
  updatedAt: string
}

// ============================================================
// MOCK DATA - 5个真实样本
// ============================================================

export const mockProjects: Project[] = [
  // ─────────────────────────────────────────────────────────
  // 1. Loopio - 高公开信号样本（成熟、完整）
  // ─────────────────────────────────────────────────────────
  {
    id: 'loopio',
    name: 'Loopio',
    nameEn: 'Loopio',
    category: 'Proposal / RFP AI',
    tagline: '成熟的 RFP / 安全问卷 / 销售提案响应平台，公开信号完整',
    targetProblem: '帮助销售、售前和响应团队更高效地完成 RFP、安全问卷和销售提案，减少重复性填写工作',
    proposer: 'Loopio Inc.',
    publicUrl: 'https://loopio.com',
    status: '支持中',
    currentBoundary: '继续观察',
    topRedFlag: '起步价格偏高，案例主要来自大型组织，与资源有限团队匹配度待验证',
    hasNewInfo: true,
    lastSignalDate: '2天前',
    reviewReminder: '4月10日',
    confidenceLevel: 'high',

    infoItems: [
      {
        id: 'l-info-1',
        content: 'Loopio 官网明确标注适用场景：RFPs、Security Questionnaires、Sales Proposals',
        source: 'Loopio 官网首页',
        sourceUrl: 'https://loopio.com',
        layer: '公开事实',
        aiGenerated: true,
        userConfirmed: true
      },
      {
        id: 'l-info-2',
        content: '定价页面公开了起步价区间，明确有分级方案，入门级约 $625/mo 起',
        source: 'Loopio Pricing',
        sourceUrl: 'https://loopio.com/pricing/',
        layer: '公开事实',
        aiGenerated: true,
        userConfirmed: true
      },
      {
        id: 'l-info-3',
        content: '集成列表包括 Salesforce、Slack、Microsoft Teams、Google Workspace 等主流工具',
        source: 'Loopio Integrations',
        sourceUrl: 'https://loopio.com/platform/integrations/',
        layer: '公开事实',
        aiGenerated: true,
        userConfirmed: false
      },
      {
        id: 'l-info-4',
        content: 'Zendesk 案例：使用 Loopio 后 RFP 响应时间减少 60%，规模为千人级企业',
        source: 'Zendesk Case Study',
        sourceUrl: 'https://loopio.com/case-study/zendesk-automates-and-scales-rfp-delivery/',
        layer: '发起方主张',
        aiGenerated: true,
        userConfirmed: true
      },
      {
        id: 'l-info-5',
        content: '小团队（<10人）的具体定价和功能限制在公开页面上未清晰说明',
        source: 'AI 推断',
        layer: '当前未知',
        aiGenerated: true,
        userConfirmed: false
      },
      {
        id: 'l-info-6',
        content: '是否提供中文界面或本地化支持，官网无明确说明',
        source: 'AI 推断',
        layer: '当前未知',
        aiGenerated: true,
        userConfirmed: false
      }
    ],

    evidence: [
      {
        id: 'l-ev-1',
        type: 'website',
        title: '官网核心定位',
        summary: '明确覆盖 RFP、安全问卷、销售提案三类场景，有专门的解决方案页',
        url: 'https://loopio.com',
        reliability: 'high',
        aiGenerated: true
      },
      {
        id: 'l-ev-2',
        type: 'pricing',
        title: '定价透明度',
        summary: '有公开定价起点，但高级功能需联系销售，小团队适配性不明',
        url: 'https://loopio.com/pricing/',
        reliability: 'medium',
        aiGenerated: true
      },
      {
        id: 'l-ev-3',
        type: 'integration',
        title: '集成生态',
        summary: '与主流 CRM / 沟通工具有集成，文档较完整',
        url: 'https://loopio.com/platform/integrations/',
        reliability: 'high',
        aiGenerated: true
      },
      {
        id: 'l-ev-4',
        type: 'case_study',
        title: 'Zendesk 案例',
        summary: '大型企业（千人级）案例，60% 响应提速，但与小团队场景差距较大',
        url: 'https://loopio.com/case-study/zendesk-automates-and-scales-rfp-delivery/',
        reliability: 'medium',
        aiGenerated: true
      }
    ],

    assumptions: [
      {
        id: 'l-ass-1',
        type: '问题假设',
        content: 'RFP / 提案响应是我们团队当前真实存在的重复性高、效率低下的痛点',
        stance: '待评估',
        supportingEvidence: ['l-ev-1'],
        weakeningEvidence: [],
        redFlags: [],
        aiGenerated: true
      },
      {
        id: 'l-ass-2',
        type: '能力假设',
        content: 'Loopio 的 AI 自动填写能力在我们的文档类型和语言要求下可用',
        stance: '待评估',
        supportingEvidence: ['l-ev-3'],
        weakeningEvidence: ['l-ev-2'],
        redFlags: ['l-rf-3'],
        aiGenerated: true
      },
      {
        id: 'l-ass-3',
        type: '资源假设',
        content: '我们团队能接受 Loopio 的起步定价（$625+/mo）进行试点',
        stance: '待评估',
        supportingEvidence: ['l-ev-2'],
        weakeningEvidence: [],
        redFlags: ['l-rf-1'],
        aiGenerated: true
      },
      {
        id: 'l-ass-4',
        type: '落地假设',
        content: '现有知识库和历史提案内容可以被迁移或导入 Loopio',
        stance: '待评估',
        supportingEvidence: ['l-ev-3'],
        weakeningEvidence: [],
        redFlags: ['l-rf-2'],
        aiGenerated: true
      },
      {
        id: 'l-ass-5',
        type: '治理假设',
        content: '安全合规要求（数据存储、访问控制）在 Loopio 现有方案下可满足',
        stance: '待评估',
        supportingEvidence: [],
        weakeningEvidence: [],
        redFlags: ['l-rf-3'],
        aiGenerated: true
      }
    ],

    logicReviewCompleted: false,

    redFlags: [
      {
        id: 'l-rf-1',
        content: '公开案例全部来自大型/中型企业（Zendesk、KPMG 等），无资源有限小团队的适配验证',
        category: '案例匹配度',
        level: null,
        aiGenerated: true
      },
      {
        id: 'l-rf-2',
        content: '入门价格 $625/月 对资源有限团队门槛较高，且不确定功能是否足够',
        category: '定价透明度',
        level: null,
        aiGenerated: true
      },
      {
        id: 'l-rf-3',
        content: '中文支持情况未在官网明确说明，本地化能力不明',
        category: '适用对象',
        level: null,
        aiGenerated: true
      },
      {
        id: 'l-rf-4',
        content: '安全合规说明（SOC2 等级、数据驻留选项）需深入查阅，无公开概览',
        category: '安全治理',
        level: null,
        aiGenerated: true
      }
    ],
    allFlagsTriaged: false,

    decisionSnapshot: undefined,

    trackingSignals: [
      {
        id: 'l-ts-1',
        assumptionId: 'l-ass-3',
        description: '是否能获取到资源有限团队的试用报价或 Starter 方案',
        status: '尚不清楚',
        lastUpdate: '2天前'
      },
      {
        id: 'l-ts-2',
        assumptionId: 'l-ass-1',
        description: '团队在过去3个月内是否实际参与过 RFP 响应工作',
        status: '尚不清楚'
      }
    ],

    reviewNotes: [],
    createdAt: '2026-03-20',
    updatedAt: '2026-03-28'
  },

  // ─────────────────────────────────────────────────────────
  // 2. AutoRFP.ai - 适合压测"营销说法 vs 证据强度"
  // ─────────────────────────────────────────────────────────
  {
    id: 'autorfp',
    name: 'AutoRFP.ai',
    nameEn: 'AutoRFP.ai',
    category: 'Proposal / RFP AI',
    tagline: '定价透明、自我对比强，典型营销主张密集型产品',
    targetProblem: '用 AI 自动回答 RFP / 安全问卷，宣称可节省 80% 响应时间',
    proposer: 'AutoRFP Inc.',
    publicUrl: 'https://autorfp.ai',
    status: '支持中',
    currentBoundary: '继续观察',
    topRedFlag: '大量自我对比说法缺少独立验证，定价透明但成熟度证明面薄',
    hasNewInfo: false,
    lastSignalDate: '5天前',
    reviewReminder: '4月15日',
    confidenceLevel: 'medium',

    infoItems: [
      {
        id: 'a-info-1',
        content: '定价页面公开列出 Starter $49/mo、Pro $149/mo、Enterprise 定制三档',
        source: 'AutoRFP.ai Pricing',
        sourceUrl: 'https://autorfp.ai/pricing',
        layer: '公开事实',
        aiGenerated: true,
        userConfirmed: true
      },
      {
        id: 'a-info-2',
        content: '官网宣称"节省高达 90% 的提案撰写时间"，与竞品直接做价格对比',
        source: 'AutoRFP.ai 首页',
        sourceUrl: 'https://autorfp.ai',
        layer: '发起方主张',
        aiGenerated: true,
        userConfirmed: true
      },
      {
        id: 'a-info-3',
        content: '有 Trust 页面，提及 SOC 2 Type II，但无法从公开页面直接查看报告',
        source: 'AutoRFP.ai Trust',
        sourceUrl: 'https://autorfp.ai/trust',
        layer: '发起方主张',
        aiGenerated: true,
        userConfirmed: false
      },
      {
        id: 'a-info-4',
        content: '客户故事入口存在，但点进去多为简短引用，无第三方独立核验',
        source: 'AutoRFP.ai Customer Stories',
        sourceUrl: 'https://autorfp.ai/customer-stories',
        layer: '发起方主张',
        aiGenerated: true,
        userConfirmed: false
      },
      {
        id: 'a-info-5',
        content: '"节省 90% 时间"这一核心主张的计算基准和方法论未公开说明',
        source: 'AI 推断',
        layer: '当前未知',
        aiGenerated: true,
        userConfirmed: false
      },
      {
        id: 'a-info-6',
        content: '产品成立时间、团队规模、融资状况未在公开页面披露',
        source: 'AI 推断',
        layer: '当前未知',
        aiGenerated: true,
        userConfirmed: false
      }
    ],

    evidence: [
      {
        id: 'a-ev-1',
        type: 'pricing',
        title: '定价透明度',
        summary: '三档定价清晰，Starter $49 入门门槛低，适合小团队初试',
        url: 'https://autorfp.ai/pricing',
        reliability: 'high',
        aiGenerated: true
      },
      {
        id: 'a-ev-2',
        type: 'security',
        title: 'Trust 页面',
        summary: '声称 SOC 2 Type II，但报告未公开可查，需额外获取',
        url: 'https://autorfp.ai/trust',
        reliability: 'low',
        aiGenerated: true
      },
      {
        id: 'a-ev-3',
        type: 'case_study',
        title: '客户故事',
        summary: '页面存在但内容简短，无独立第三方验证，更像营销文案',
        url: 'https://autorfp.ai/customer-stories',
        reliability: 'low',
        aiGenerated: true
      }
    ],

    assumptions: [
      {
        id: 'a-ass-1',
        type: '问题假设',
        content: 'RFP 响应是团队真实高频痛点，而非偶发需求',
        stance: '待评估',
        supportingEvidence: ['a-ev-1'],
        weakeningEvidence: [],
        redFlags: [],
        aiGenerated: true
      },
      {
        id: 'a-ass-2',
        type: '能力假设',
        content: 'AutoRFP.ai 宣称的 90% 时间节省在实际场景中大致成立',
        stance: '待评估',
        supportingEvidence: [],
        weakeningEvidence: ['a-ev-3'],
        redFlags: ['a-rf-1', 'a-rf-2'],
        aiGenerated: true
      },
      {
        id: 'a-ass-3',
        type: '治理假设',
        content: '团队对 SOC 2 Type II 的安全要求可接受"声称合规但无公开报告"的状态',
        stance: '待评估',
        supportingEvidence: ['a-ev-2'],
        weakeningEvidence: [],
        redFlags: ['a-rf-3'],
        aiGenerated: true
      },
      {
        id: 'a-ass-4',
        type: '资源假设',
        content: '$49/月起步价格在试点预算范围内',
        stance: '支撑',
        supportingEvidence: ['a-ev-1'],
        weakeningEvidence: [],
        redFlags: [],
        aiGenerated: true
      }
    ],

    logicReviewCompleted: false,

    redFlags: [
      {
        id: 'a-rf-1',
        content: '"节省 90% 时间"是核心卖点，但计算基准和验证方法完全不透明',
        category: '结果可验证性',
        level: null,
        aiGenerated: true
      },
      {
        id: 'a-rf-2',
        content: '官网中大量直接拿竞品做价格对比，对比基准的公平性无法核实',
        category: '结果可验证性',
        level: null,
        aiGenerated: true
      },
      {
        id: 'a-rf-3',
        content: 'SOC 2 Type II 仅为自述，公开报告不可查，安全合规实际状态不明',
        category: '安全治理',
        level: null,
        aiGenerated: true
      },
      {
        id: 'a-rf-4',
        content: '产品成熟度信号（成立时间、客户规模、公开用户数）几乎无法从公开信息获取',
        category: '成熟度',
        level: null,
        aiGenerated: true
      }
    ],
    allFlagsTriaged: false,

    decisionSnapshot: undefined,
    trackingSignals: [],
    reviewNotes: [],
    createdAt: '2026-03-22',
    updatedAt: '2026-03-25'
  },

  // ─────────────────────────────────────────────────────────
  // 3. Inventive AI - 适合测试"强结果叙事"边界
  // ─────────────────────────────────────────────────────────
  {
    id: 'inventive',
    name: 'Inventive AI',
    nameEn: 'Inventive AI',
    category: 'Proposal / RFP AI',
    tagline: 'AI-first RFP 响应工具，案例信号较强，公开集成说明完整',
    targetProblem: '用 AI 驱动的知识库自动完成 RFP 和安全问卷响应，主打企业级 SSO 和集成能力',
    proposer: 'Inventive AI Inc.',
    publicUrl: 'https://www.inventive.ai',
    status: '未支持',
    currentBoundary: '继续观察',
    topRedFlag: '强结果叙事（案例数字显著）缺乏独立验证，定价未公开',
    hasNewInfo: false,
    lastSignalDate: '1周前',
    confidenceLevel: 'medium',

    infoItems: [
      {
        id: 'i-info-1',
        content: '案例页面呈现多个客户结果，包含"响应时间减少 70%"等具体数字叙事',
        source: 'Inventive Case Studies',
        sourceUrl: 'https://www.inventive.ai/case-studies',
        layer: '发起方主张',
        aiGenerated: true,
        userConfirmed: false
      },
      {
        id: 'i-info-2',
        content: '支持 Google Workspace SSO，有专门集成说明页面',
        source: 'Inventive Integrations',
        sourceUrl: 'https://www.inventive.ai/integrations/google-workspace-sso',
        layer: '公开事实',
        aiGenerated: true,
        userConfirmed: true
      },
      {
        id: 'i-info-3',
        content: '定价未在官网公开，需联系销售获取报价',
        source: 'AI 推断',
        layer: '当前未知',
        aiGenerated: true,
        userConfirmed: false
      },
      {
        id: 'i-info-4',
        content: '案例中的客户组织规模和团队背景未在公开页面详细说明',
        source: 'AI 推断',
        layer: '当前未知',
        aiGenerated: true,
        userConfirmed: false
      }
    ],

    evidence: [
      {
        id: 'i-ev-1',
        type: 'case_study',
        title: '案例页面',
        summary: '多个案例含具体结果数字，但均为官方发布，缺少独立第三方验证',
        url: 'https://www.inventive.ai/case-studies',
        reliability: 'low',
        aiGenerated: true
      },
      {
        id: 'i-ev-2',
        type: 'integration',
        title: 'SSO 与集成说明',
        summary: 'Google Workspace SSO 有详细文档，集成能力可信度较高',
        url: 'https://www.inventive.ai/integrations/google-workspace-sso',
        reliability: 'high',
        aiGenerated: true
      }
    ],

    assumptions: [
      {
        id: 'i-ass-1',
        type: '问题假设',
        content: '团队当前 RFP/安全问卷响应量足够高，值得引入专项工具',
        stance: '待评估',
        supportingEvidence: [],
        weakeningEvidence: [],
        redFlags: [],
        aiGenerated: true
      },
      {
        id: 'i-ass-2',
        type: '能力假设',
        content: '案例中展示的结果（70% 提速等）在类似规模团队中同样适用',
        stance: '待评估',
        supportingEvidence: ['i-ev-1'],
        weakeningEvidence: [],
        redFlags: ['i-rf-1'],
        aiGenerated: true
      },
      {
        id: 'i-ass-3',
        type: '资源假设',
        content: '定价在试点预算可接受范围内（当前未知，需询价）',
        stance: '待评估',
        supportingEvidence: [],
        weakeningEvidence: [],
        redFlags: ['i-rf-2'],
        aiGenerated: true
      },
      {
        id: 'i-ass-4',
        type: '落地假设',
        content: 'Google Workspace SSO 集成与我们的现有系统兼容',
        stance: '支撑',
        supportingEvidence: ['i-ev-2'],
        weakeningEvidence: [],
        redFlags: [],
        aiGenerated: true
      }
    ],

    logicReviewCompleted: false,

    redFlags: [
      {
        id: 'i-rf-1',
        content: '案例中的结果数字（如 70% 提速）全部来自官方发布，无独立验证渠道',
        category: '结果可验证性',
        level: null,
        aiGenerated: true
      },
      {
        id: 'i-rf-2',
        content: '定价完全不透明，仅能通过联系销售获取，预算规划困难',
        category: '定价透明度',
        level: null,
        aiGenerated: true
      },
      {
        id: 'i-rf-3',
        content: '安全合规信息（SOC、数据驻留）在公开页面无法直接查阅',
        category: '安全治理',
        level: null,
        aiGenerated: true
      }
    ],
    allFlagsTriaged: false,

    decisionSnapshot: undefined,
    trackingSignals: [],
    reviewNotes: [],
    createdAt: '2026-03-18',
    updatedAt: '2026-03-23'
  },

  // ─────────────────────────────────────────────────────────
  // 4. SafeBase AI Questionnaire Assistance - 邻近类目扩展测试
  // ─────────────────────────────────────────────────────────
  {
    id: 'safebase',
    name: 'SafeBase AI 问卷助手',
    nameEn: 'SafeBase AI Questionnaire Assistance',
    category: 'Security Questionnaire AI',
    tagline: '专注安全问卷自动响应，公开指标丰富，邻近 RFP 类目',
    targetProblem: '帮助安全和销售团队自动响应安全问卷，减少重复性安全评估工作量',
    proposer: 'SafeBase Inc.',
    publicUrl: 'https://safebase.io',
    status: '未支持',
    currentBoundary: '继续观察',
    topRedFlag: '类目偏向安全专业领域，通用 RFP 团队适配性需验证',
    hasNewInfo: true,
    lastSignalDate: '3天前',
    confidenceLevel: 'high',

    infoItems: [
      {
        id: 's-info-1',
        content: '产品页明确说明 AI 辅助安全问卷响应功能，有专门产品页和解决方案页',
        source: 'SafeBase AI Questionnaire Assistance',
        sourceUrl: 'https://safebase.io/products/ai-questionnaire-assistance',
        layer: '公开事实',
        aiGenerated: true,
        userConfirmed: true
      },
      {
        id: 's-info-2',
        content: '博客文章披露里程碑数据：超过 100 万个问题已通过 AI 处理',
        source: 'SafeBase Blog',
        sourceUrl: 'https://safebase.io/blog/safebase-aiqa-1-million-questions-milestone',
        layer: '公开事实',
        aiGenerated: true,
        userConfirmed: true
      },
      {
        id: 's-info-3',
        content: '有面向安全问卷的专属解决方案页，定位明确',
        source: 'SafeBase Solutions',
        sourceUrl: 'https://safebase.io/solutions/security-questionnaires',
        layer: '公开事实',
        aiGenerated: true,
        userConfirmed: false
      },
      {
        id: 's-info-4',
        content: '产品是否支持非安全类问卷（如 RFP、尽调问卷）未在公开页面说明',
        source: 'AI 推断',
        layer: '当前未知',
        aiGenerated: true,
        userConfirmed: false
      }
    ],

    evidence: [
      {
        id: 's-ev-1',
        type: 'website',
        title: '产品定位清晰',
        summary: '专注安全问卷场景，产品页、解决方案页、博客均印证核心定位',
        url: 'https://safebase.io/products/ai-questionnaire-assistance',
        reliability: 'high',
        aiGenerated: true
      },
      {
        id: 's-ev-2',
        type: 'changelog',
        title: '里程碑数据',
        summary: '100万问题处理量，有公开博客文章记录，可独立核验',
        url: 'https://safebase.io/blog/safebase-aiqa-1-million-questions-milestone',
        reliability: 'high',
        aiGenerated: true
      }
    ],

    assumptions: [
      {
        id: 's-ass-1',
        type: '问题假设',
        content: '团队面临的主要是安全问卷类工作（而非通用 RFP），与 SafeBase 定位匹配',
        stance: '待评估',
        supportingEvidence: ['s-ev-1'],
        weakeningEvidence: [],
        redFlags: ['s-rf-1'],
        aiGenerated: true
      },
      {
        id: 's-ass-2',
        type: '能力假设',
        content: 'AI 处理安全问卷的效果在我们的问卷类型和行业背景下同样适用',
        stance: '待评估',
        supportingEvidence: ['s-ev-2'],
        weakeningEvidence: [],
        redFlags: [],
        aiGenerated: true
      },
      {
        id: 's-ass-3',
        type: '落地假设',
        content: '现有安全知识库内容可以被导入 SafeBase 作为 AI 响应的基础',
        stance: '待评估',
        supportingEvidence: ['s-ev-1'],
        weakeningEvidence: [],
        redFlags: ['s-rf-2'],
        aiGenerated: true
      }
    ],

    logicReviewCompleted: false,

    redFlags: [
      {
        id: 's-rf-1',
        content: '产品定位高度专注安全问卷，通用 RFP 团队能否受益仍需验证',
        category: '适用对象',
        level: null,
        aiGenerated: true
      },
      {
        id: 's-rf-2',
        content: '现有安全知识库迁移成本和格式兼容性未在公开文档中说明',
        category: '集成路径',
        level: null,
        aiGenerated: true
      },
      {
        id: 's-rf-3',
        content: '定价页面入口不明显，需联系销售，预算透明度一般',
        category: '定价透明度',
        level: null,
        aiGenerated: true
      }
    ],
    allFlagsTriaged: false,

    decisionSnapshot: undefined,
    trackingSignals: [],
    reviewNotes: [],
    createdAt: '2026-03-25',
    updatedAt: '2026-03-27'
  },

  // ─────────────────────────────────────────────────────────
  // 5. Guru - 类目扩展压测（Enterprise AI Search）
  // ─────────────────────────────────────────────────────────
  {
    id: 'guru',
    name: 'Guru',
    nameEn: 'Guru',
    category: 'Enterprise AI Search / Knowledge AI',
    tagline: '企业级 AI 知识搜索，超出 RFP 楔子，公开信号丰富',
    targetProblem: '帮助团队建立和检索统一知识库，AI 自动推送相关知识卡片，减少重复性知识整理',
    proposer: 'Guru Technologies Inc.',
    publicUrl: 'https://www.getguru.com',
    status: '未支持',
    currentBoundary: '暂不继续',
    topRedFlag: '类目已超出当前 RFP 工具边界，知识库构建成本高，适用性需重新定义',
    hasNewInfo: false,
    lastSignalDate: '2周前',
    confidenceLevel: 'high',

    infoItems: [
      {
        id: 'g-info-1',
        content: '官网定位：企业级 AI 知识管理，支持与 Slack、Teams、Chrome 等工具集成',
        source: 'Guru 首页',
        sourceUrl: 'https://www.getguru.com',
        layer: '公开事实',
        aiGenerated: true,
        userConfirmed: true
      },
      {
        id: 'g-info-2',
        content: '定价页有公开分级，Free / Starter / Builder / Enterprise 四档',
        source: 'Guru Pricing',
        sourceUrl: 'https://www.getguru.com/pricing',
        layer: '公开事实',
        aiGenerated: true,
        userConfirmed: true
      },
      {
        id: 'g-info-3',
        content: '安全页面有详细的 SOC 2 Type II、GDPR 等合规说明',
        source: 'Guru Security',
        sourceUrl: 'https://www.getguru.com/security',
        layer: '公开事实',
        aiGenerated: true,
        userConfirmed: false
      },
      {
        id: 'g-info-4',
        content: 'AI 知识卡片推送的准确率和实际使用体验无法从公开材料中独立验证',
        source: 'AI 推断',
        layer: '当前未知',
        aiGenerated: true,
        userConfirmed: false
      },
      {
        id: 'g-info-5',
        content: '知识库初始建设的时间成本（内容录入、分类、维护）在公开材料中未量化',
        source: 'AI 推断',
        layer: '当前未知',
        aiGenerated: true,
        userConfirmed: false
      }
    ],

    evidence: [
      {
        id: 'g-ev-1',
        type: 'website',
        title: '产品定位与集成',
        summary: '企业级知识管理定位清晰，集成生态丰富，官网信号完整',
        url: 'https://www.getguru.com',
        reliability: 'high',
        aiGenerated: true
      },
      {
        id: 'g-ev-2',
        type: 'pricing',
        title: '定价透明',
        summary: '四档定价公开，有免费层，入门门槛合理',
        url: 'https://www.getguru.com/pricing',
        reliability: 'high',
        aiGenerated: true
      },
      {
        id: 'g-ev-3',
        type: 'security',
        title: '安全合规',
        summary: 'SOC 2 Type II、GDPR 等合规信息有专门安全页，可信度较高',
        url: 'https://www.getguru.com/security',
        reliability: 'high',
        aiGenerated: true
      },
      {
        id: 'g-ev-4',
        type: 'integration',
        title: '集成生态',
        summary: '集成页面列出大量工具，涵盖 Slack、Teams、Salesforce 等主流平台',
        url: 'https://www.getguru.com/integrations',
        reliability: 'high',
        aiGenerated: true
      }
    ],

    assumptions: [
      {
        id: 'g-ass-1',
        type: '问题假设',
        content: '团队面临的核心问题是知识分散难以检索，而非 RFP 响应效率——这两者存在本质差异',
        stance: '存疑',
        supportingEvidence: ['g-ev-1'],
        weakeningEvidence: [],
        redFlags: ['g-rf-1'],
        aiGenerated: true
      },
      {
        id: 'g-ass-2',
        type: '落地假设',
        content: '团队有足够的时间和人力完成知识库的初始建设（录入、分类、维护）',
        stance: '存疑',
        supportingEvidence: [],
        weakeningEvidence: [],
        redFlags: ['g-rf-2'],
        aiGenerated: true
      },
      {
        id: 'g-ass-3',
        type: '资源假设',
        content: 'Guru 的定价在预算范围内，且功能与当前需求的匹配度足以支撑投入',
        stance: '存疑',
        supportingEvidence: ['g-ev-2'],
        weakeningEvidence: [],
        redFlags: ['g-rf-1'],
        aiGenerated: true
      }
    ],

    logicReviewCompleted: true, // 已完成，结论是暂不继续

    redFlags: [
      {
        id: 'g-rf-1',
        content: '产品定位（知识管理）与当前目标（RFP 响应效率）存在根本性偏差，不是同一个问题',
        category: '适用对象',
        level: '致命',
        aiGenerated: true
      },
      {
        id: 'g-rf-2',
        content: '知识库初始建设是重型工程，对资源有限团队是高隐性成本，文档中未量化',
        category: '集成路径',
        level: '需关注',
        aiGenerated: true
      },
      {
        id: 'g-rf-3',
        content: 'AI 卡片推送的实际效果（噪音比例）无法从公开材料中独立验证',
        category: '结果可验证性',
        level: '需关注',
        aiGenerated: true
      }
    ],
    allFlagsTriaged: true,

    decisionSnapshot: {
      id: 'g-snapshot-1',
      createdAt: '2026-03-15',
      boundary: '暂不继续',
      keyAssumptions: ['g-ass-1', 'g-ass-2'],
      modificationTriggers: {
        upgrade: '当团队实际工作中出现知识检索效率瓶颈，且 RFP 需求下降时可重新评估',
        pause: '当前边界即为暂不继续，无需额外暂停触发器',
        exit: '已关闭，不再跟踪'
      },
      reviewDate: '2026-06-01',
      frozenAt: '2026-03-15'
    },

    trackingSignals: [
      {
        id: 'g-ts-1',
        assumptionId: 'g-ass-1',
        description: '团队是否出现知识检索瓶颈而非 RFP 响应瓶颈',
        status: '已否定',
        lastUpdate: '2026-03-15',
        note: '当前核心痛点确认为 RFP 响应，知识管理非当前优先问题'
      }
    ],

    reviewNotes: [
      {
        id: 'g-review-1',
        createdAt: '2026-03-15',
        boundaryChange: '初始评估 → 暂不继续',
        isWrongDecision: false,
        summary: 'Guru 公开信号完整、安全合规良好，但核心定位与当前需求不匹配。在 RFP 响应效率成为主目标的前提下，引入知识管理工具属于错误的问题映射。等待需求转型后可重新评估。'
      }
    ],
    createdAt: '2026-03-10',
    updatedAt: '2026-03-15'
  }
]

// 决策方现状 - 默认模板
export const defaultResourceContext = {
  role: '中小团队负责人',
  currentGoal: '判断是否值得投入试点预算引入 AI 提案/RFP 响应工具，提升团队响应效率',
  resourceConstraints: '月试点预算上限 $300，可投入 1-2 人的实施时间，约 2-4 周',
  topRisk: '引入后团队实际不使用，或工具与现有流程不兼容导致效率反而下降',
  maxCommitmentLevel: '可以接触' as CommitmentBoundary
}

// 类目列表
export const categories = [
  'Proposal / RFP AI',
  'Security Questionnaire AI',
  'Enterprise AI Search / Knowledge AI',
  'Sales Proposal AI',
  'Due Diligence AI'
]

// 红旗类别列表
export const flagCategories = [
  '定价透明度',
  '案例匹配度',
  '安全治理',
  '集成路径',
  '结果可验证性',
  '适用对象',
  '成熟度',
  '其他'
]
