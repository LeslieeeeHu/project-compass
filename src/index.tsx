import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { mockProjects, defaultResourceContext } from './data/mockData'

const app = new Hono()

// 静态资源
app.use('/static/*', serveStatic({ root: './' }))

// API: 获取项目列表
app.get('/api/projects', (c) => {
  return c.json(mockProjects)
})

// API: 获取单个项目
app.get('/api/projects/:id', (c) => {
  const id = c.req.param('id')
  const project = mockProjects.find(p => p.id === id)
  if (!project) return c.json({ error: 'Not found' }, 404)
  return c.json(project)
})

// API: 获取决策方现状
app.get('/api/context', (c) => {
  return c.json(defaultResourceContext)
})

// 主页面
app.get('/', (c) => {
  const projectsJson = JSON.stringify(mockProjects).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
  const contextJson = JSON.stringify(defaultResourceContext).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

  return c.html(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>项目指南针 — Project Compass</title>
  <link rel="stylesheet" href="/static/styles.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
</head>
<body>

<!-- =========================================================
  顶部导航栏
  ========================================================= -->
<nav class="navbar">
  <a class="navbar-brand" id="nav-brand" href="#" onclick="navigateTo('projects');return false">
    <div class="brand-icon"><i class="fas fa-compass"></i></div>
    项目指南针
  </a>
  <div class="navbar-spacer"></div>
  <div class="navbar-nav">
    <button class="nav-btn active" id="nav-projects">
      <i class="fas fa-stream"></i> 项目流
    </button>
    <button class="nav-btn" id="nav-admin">
      <i class="fas fa-cog"></i> 后台管理
    </button>
  </div>
</nav>

<div class="app-body">

<!-- =========================================================
  界面1：项目流
  ========================================================= -->
<div class="page active" id="page-projects">
  <div class="container">
    <div class="page-header">
      <div>
        <h1 class="page-title">项目流 <span style="font-size:16px;font-weight:400;color:var(--color-text-tertiary)">Project Pipeline</span></h1>
        <p class="page-subtitle">所有待判断 / 跟踪中的机会档案，点击进入分析判断</p>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="filter-bar">
      <div class="filter-tabs">
        <button class="filter-tab active" data-status="全部">全部</button>
        <button class="filter-tab" data-status="未支持">未支持</button>
        <button class="filter-tab" data-status="支持中">支持中</button>
        <button class="filter-tab" data-status="已关闭">已关闭</button>
      </div>
      <label class="filter-checkbox" for="filter-new-info">
        <input type="checkbox" id="filter-new-info">
        <span>有新增信息待处理</span>
      </label>
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input class="search-input" id="search-input" placeholder="搜索项目名称、描述…" type="text">
      </div>
      <select class="category-select" id="category-select">
        <option value="">全部类别</option>
        <option value="Proposal / RFP AI">Proposal / RFP AI</option>
        <option value="Security Questionnaire AI">Security Questionnaire AI</option>
        <option value="Enterprise AI Search / Knowledge AI">Enterprise AI Search / Knowledge AI</option>
        <option value="Sales Proposal AI">Sales Proposal AI</option>
        <option value="Due Diligence AI">Due Diligence AI</option>
      </select>
    </div>

    <div class="result-count" id="result-count"></div>
    <div class="project-grid" id="project-grid"></div>
  </div>
</div>

<!-- =========================================================
  界面2：后台管理
  ========================================================= -->
<div class="page" id="page-admin">
  <div class="admin-layout">
    <div class="admin-sidebar">
      <div class="admin-sidebar-title">后台管理</div>
      <button class="admin-nav-item active" data-section="import">
        <i class="fas fa-plus-circle"></i> 机会导入
      </button>
      <button class="admin-nav-item" data-section="context">
        <i class="fas fa-user-circle"></i> 决策方现状
      </button>
      <div style="margin-top:auto;padding-top:24px;font-size:11px;color:var(--color-text-tertiary);padding:24px 12px 0">
        MVP 阶段：机会导入使用预置样本数据，决策方现状用于配置判断上下文。
      </div>
    </div>

    <div class="admin-content">
      <!-- 机会导入 -->
      <div class="admin-section active" id="admin-import">
        <div class="admin-section-title">机会导入</div>
        <div class="admin-section-desc">粘贴项目公开链接，系统生成初始机会档案。MVP 阶段使用预置样本数据。</div>

        <div class="card" style="margin-bottom:24px">
          <div class="card-body">
            <div class="ai-notice" style="margin-bottom:16px">
              <i class="fas fa-info-circle"></i>
              <div><strong>MVP 阶段说明：</strong>当前版本已预置 5 个真实样本（Loopio / AutoRFP.ai / Inventive AI / SafeBase / Guru），可直接在项目流中体验完整工作流。</div>
            </div>
            <form id="import-form">
              <div class="form-group">
                <label class="form-label">项目公开链接 <span class="label-note">（官网 / 定价页 / 产品页均可）</span></label>
                <input class="form-input" placeholder="https://..." type="url">
              </div>
              <div class="form-group">
                <label class="form-label">机会名称</label>
                <input class="form-input" placeholder="例如：ProposalAI">
              </div>
              <div class="form-group">
                <label class="form-label">类别</label>
                <select class="form-select">
                  <option>Proposal / RFP AI</option>
                  <option>Security Questionnaire AI</option>
                  <option>Enterprise AI Search / Knowledge AI</option>
                  <option>Sales Proposal AI</option>
                  <option>Due Diligence AI</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">一句话说明 <span class="label-note">（可选）</span></label>
                <input class="form-input" placeholder="简述这个机会的核心定位">
              </div>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-magic"></i> 生成初始档案
              </button>
            </form>
          </div>
        </div>

        <!-- 当前样本池 -->
        <div class="admin-section-title" style="font-size:15px;margin-bottom:12px">当前预置样本</div>
        ${mockProjects.map(p => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;margin-bottom:8px">
            <span style="font-size:20px">${p.category.includes('RFP') ? '📋' : p.category.includes('Security') ? '🔒' : '🔍'}</span>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:600">${p.name}</div>
              <div style="font-size:12px;color:var(--color-text-tertiary)">${p.category}</div>
            </div>
            <span class="badge badge-${p.status}">${p.status}</span>
          </div>
        `).join('')}
      </div>

      <!-- 决策方现状 -->
      <div class="admin-section" id="admin-context">
        <div class="admin-section-title">决策方现状</div>
        <div class="admin-section-desc">说明"你是谁、你手上有什么、你怕什么"，作为所有判断的起点。</div>

        <div class="card">
          <div class="card-body">
            <div class="ai-notice" style="margin-bottom:20px">
              <i class="fas fa-info-circle"></i>
              <div>这些信息会显示在每个项目判断页的顶部「判断上下文条」中，帮助你保持判断的一致性。</div>
            </div>
            <form id="context-form">
              <div class="form-group">
                <label class="form-label">你的角色</label>
                <input class="form-input" id="ctx-role" placeholder="例如：中小团队负责人">
              </div>
              <div class="form-group">
                <label class="form-label">当前目标</label>
                <textarea class="form-textarea" id="ctx-goal" rows="2" placeholder="你当前想解决什么问题，引入这类工具的初衷是什么"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">资源约束</label>
                <textarea class="form-textarea" id="ctx-resources" rows="2" placeholder="可用的预算上限、人力时间、试用周期等"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">最在意的风险</label>
                <textarea class="form-textarea" id="ctx-risk" rows="2" placeholder="你最担心的失败场景是什么"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">当前能接受的最高投入级别</label>
                <select class="form-select" id="ctx-max-level">
                  <option value="继续观察">继续观察</option>
                  <option value="可以接触">可以接触</option>
                  <option value="可以投入有限试点">可以投入有限试点</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> 保存现状
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- =========================================================
  界面3：项目分析判断页
  ========================================================= -->
<div class="page" id="page-analysis">
  <div class="analysis-layout">

    <!-- 固定头部：面包屑 + 上下文条 -->
    <div class="analysis-header">
      <div class="analysis-breadcrumb">
        <a id="breadcrumb-back"><i class="fas fa-chevron-left"></i> 项目流</a>
        <i class="fas fa-chevron-right"></i>
        <span id="analysis-project-name" style="color:var(--color-text-primary);font-weight:600"></span>
      </div>
      <div class="context-bar">
        <span class="context-bar-label"><i class="fas fa-user-circle"></i> 判断上下文</span>
        <div class="context-bar-items">
          <div class="context-bar-item">
            <i class="fas fa-user"></i>
            <strong id="ctx-bar-role"></strong>
          </div>
          <div class="context-bar-item">
            <i class="fas fa-bullseye"></i>
            <span id="ctx-bar-goal"></span>
          </div>
          <div class="context-bar-item">
            <i class="fas fa-coins"></i>
            <span id="ctx-bar-resources"></span>
          </div>
          <div class="context-bar-item">
            <i class="fas fa-exclamation-triangle" style="color:var(--color-orange)"></i>
            <span id="ctx-bar-risk"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 导航 -->
    <div class="tab-nav-wrap">
      <div class="tab-nav">
        <button class="tab-item active" data-tab="t1">
          <span class="tab-num">1</span> 信息搜集
          <span class="tab-dot"></span>
        </button>
        <button class="tab-item" data-tab="t2">
          <span class="tab-num">2</span> 事实·自述·未知
        </button>
        <button class="tab-item" data-tab="t3">
          <span class="tab-num">3</span> 关键假设
        </button>
        <button class="tab-item" data-tab="t4">
          <span class="tab-num">4</span> 逻辑串联
          <span class="tab-dot"></span>
        </button>
        <button class="tab-item" data-tab="t5">
          <span class="tab-num">5</span> 红旗与反证
          <span class="tab-dot"></span>
        </button>
        <button class="tab-item" data-tab="t6">
          <span class="tab-num">6</span> 决策快照
        </button>
        <button class="tab-item" data-tab="t7">
          <span class="tab-num">7</span> 跟踪信号
        </button>
        <button class="tab-item" data-tab="t8">
          <span class="tab-num">8</span> 复盘归档
        </button>
      </div>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-panels">

      <!-- T1: 信息搜集 -->
      <div class="tab-panel active" id="panel-t1">
        <div class="panel-title">信息搜集 <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Information Gathering</span></div>
        <div class="panel-desc">以下信息由 AI 从公开渠道整理。你可以一键采纳，也可以逐条确认或标记存疑。</div>

        <div class="ai-notice">
          <i class="fas fa-robot"></i>
          <div>
            <strong>AI 已完成初步整理</strong>——包括公开事实、发起方主张和当前未知项的初步分类。
            你可以直接采纳，也可以对有疑问的条目单独处理。
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="display:flex;gap:16px;flex:1">
            <span style="font-size:13px;color:var(--color-text-secondary)">
              <i class="fas fa-check-circle" style="color:var(--color-green)"></i>
              已确认 <strong id="t1-confirmed-count">0</strong> 条
            </span>
            <span style="font-size:13px;color:var(--color-text-secondary)">
              <i class="fas fa-clock" style="color:var(--color-orange)"></i>
              待确认 <strong id="t1-pending-count">0</strong> 条
            </span>
          </div>
          <button class="btn btn-secondary btn-sm" id="t1-confirm-all">
            <i class="fas fa-check-double"></i> 一键全部采纳
          </button>
        </div>

        <div id="t1-items"></div>
      </div>

      <!-- T2: 事实/自述/未知分层 -->
      <div class="tab-panel" id="panel-t2">
        <div class="panel-title">事实 · 自述 · 未知 <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Information Layering</span></div>
        <div class="panel-desc">严格区分三类信息——这是"不必先相信发起方也能工作"的核心机制。</div>

        <div class="ai-notice">
          <i class="fas fa-robot"></i>
          <div>
            <strong>AI 已完成初步分层。</strong>
            你可以直接采纳，也可以通过调整 T1 中的信息分类来修改这里的展示。
            <span style="color:var(--color-orange)">⚠️ 「当前未知」栏必须有内容——如果你认为某信息实际无法公开验证，请将其移至未知栏。</span>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
          <button class="btn btn-secondary btn-sm" id="t2-confirm-all">
            <i class="fas fa-check"></i> 采纳 AI 分层结果
          </button>
        </div>

        <div class="layer-columns">
          <div class="layer-column layer-公开事实">
            <div class="layer-column-header">
              <div class="layer-dot"></div>
              <span class="layer-column-title">公开事实</span>
              <span class="layer-column-count" id="layer-count-公开事实">0</span>
            </div>
            <div class="layer-column-body" id="layer-col-公开事实"></div>
          </div>
          <div class="layer-column layer-发起方主张">
            <div class="layer-column-header">
              <div class="layer-dot"></div>
              <span class="layer-column-title">发起方主张</span>
              <span class="layer-column-count" id="layer-count-发起方主张">0</span>
            </div>
            <div class="layer-column-body" id="layer-col-发起方主张"></div>
          </div>
          <div class="layer-column layer-当前未知">
            <div class="layer-column-header">
              <div class="layer-dot"></div>
              <span class="layer-column-title">当前未知</span>
              <span class="layer-column-count" id="layer-count-当前未知">0</span>
            </div>
            <div class="layer-column-body" id="layer-col-当前未知"></div>
          </div>
        </div>

        <div id="t2-unknown-warning" style="display:none" class="progress-gate"></div>

        <!-- 公开证据摘要 -->
        <div style="margin-top:24px">
          <div style="font-size:15px;font-weight:700;margin-bottom:12px">公开证据快照</div>
          <div id="t2-evidence-list"></div>
        </div>
      </div>

      <!-- T3: 关键假设 -->
      <div class="tab-panel" id="panel-t3">
        <div class="panel-title">建立关键假设 <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Key Assumptions</span></div>
        <div class="panel-desc">AI 已按 5 类假设模板生成初稿。展开每张假设卡，查看支持与削弱证据，在 T4 中给出你的判断。</div>

        <div class="ai-notice">
          <i class="fas fa-robot"></i>
          <div>
            <strong>假设类型严格固定为 5 类</strong>（问题假设 / 能力假设 / 落地假设 / 治理假设 / 资源假设），防止判断泛化。
            你可以在 T4 中对每个假设给出"支撑 / 存疑 / 否定"的态度——那是真正的判断行为。
          </div>
        </div>

        <div id="t3-assumptions"></div>
      </div>

      <!-- T4: 逻辑串联 -->
      <div class="tab-panel" id="panel-t4">
        <div class="panel-title">逻辑串联 <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Logic Review</span></div>
        <div class="panel-desc">对每个关键假设给出你的判断态度。这是 T4 的核心操作，不可跳过。</div>

        <div class="ai-notice">
          <i class="fas fa-exclamation-triangle" style="color:var(--color-orange)"></i>
          <div>
            <strong>T4 是判断核心步骤，需要你深度参与。</strong>
            每个假设都需要你给出"支撑 / 存疑 / 否定"的明确态度。
            AI 只展示关联证据，最终判断由你做出。
          </div>
        </div>

        <div id="t4-progress-gate" class="progress-gate" style="margin-bottom:16px">
          <i class="fas fa-exclamation-triangle"></i>
          <p>正在加载假设列表…</p>
        </div>

        <div id="t4-logic"></div>
      </div>

      <!-- T5: 红旗与反证 -->
      <div class="tab-panel" id="panel-t5">
        <div class="panel-title">红旗与反证 <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Red Flags & Counter-Evidence</span></div>
        <div class="panel-desc">AI 已根据规则库识别潜在红旗。每条红旗必须由你完成定级，才能推进到决策快照。</div>

        <div class="ai-notice">
          <i class="fas fa-exclamation-triangle" style="color:var(--color-orange)"></i>
          <div>
            <strong>T5 也是判断核心步骤。</strong>
            「致命」意味着在当前条件下此项足以阻止投入；「需关注」意味着需要后续跟踪；「已解释」意味着该风险在你的场景中已被充分说明。
          </div>
        </div>

        <div id="t5-progress-gate" class="progress-gate" style="margin-bottom:16px">
          <i class="fas fa-exclamation-triangle"></i>
          <p>正在加载红旗列表…</p>
        </div>

        <div id="t5-flags"></div>
      </div>

      <!-- T6: 决策快照 -->
      <div class="tab-panel" id="panel-t6">
        <div class="panel-title">决策快照 <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Decision Snapshot</span></div>
        <div class="panel-desc">将本次判断冻结为可复查的决策基线。投入边界由你来选择，AI 提供参考建议。</div>

        <div id="t6-gate" class="progress-gate" style="margin-bottom:20px"></div>

        <div id="t6-snapshot-display"></div>

        <div id="t6-editor">
          <div class="ai-notice" id="t6-ai-suggestion">
            <i class="fas fa-robot"></i>
            <div>AI 正在推断建议边界…</div>
          </div>

          <div style="font-size:15px;font-weight:700;margin-bottom:12px">选择投入边界 <span style="font-size:13px;font-weight:400;color:var(--color-red)">（必须由你决定）</span></div>
          <div class="boundary-selector" id="t6-boundary-selector"></div>

          <hr class="divider">

          <div style="font-size:15px;font-weight:700;margin-bottom:12px">当前关键假设状态</div>
          <div id="t6-assumptions-summary"></div>

          <hr class="divider">

          <div style="font-size:15px;font-weight:700;margin-bottom:12px">决策修改节点</div>
          <div class="form-group">
            <label class="form-label">升级触发条件 <span class="label-note">（什么情况下可以提升投入级别）</span></label>
            <input class="form-input" id="t6-trigger-upgrade" placeholder="例如：若能获取到独立客户验证，可升级到可以接触">
          </div>
          <div class="form-group">
            <label class="form-label">暂停触发条件 <span class="label-note">（什么情况下应立即暂停）</span></label>
            <input class="form-input" id="t6-trigger-pause" placeholder="例如：若出现安全合规问题或产品停止维护">
          </div>
          <div class="form-group">
            <label class="form-label">退出触发条件 <span class="label-note">（什么情况下彻底退出跟踪）</span></label>
            <input class="form-input" id="t6-trigger-exit" placeholder="例如：项目方停止更新超过 3 个月">
          </div>
          <div class="form-group">
            <label class="form-label">下次复查时间</label>
            <input class="form-input" id="t6-review-date" type="date" value="2026-05-01">
          </div>

          <button class="btn btn-primary btn-lg" id="t6-generate-snapshot" style="margin-top:8px">
            <i class="fas fa-camera"></i> 生成并冻结决策快照
          </button>
        </div>
      </div>

      <!-- T7: 跟踪信号 -->
      <div class="tab-panel" id="panel-t7">
        <div class="panel-title">跟踪信号 <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Tracking Signals</span></div>
        <div class="panel-desc">只跟踪"当初支持决策依赖的关键假设，后来有没有被验证"。不跟踪项目全貌。</div>

        <div class="ai-notice">
          <i class="fas fa-satellite-dish"></i>
          <div>
            <strong>聚焦关键假设的状态变化。</strong>
            对每个跟踪信号，选择当前状态：已验证 / 被削弱 / 尚不清楚 / 已否定。
            如果有假设被否定，请回到 T4 更新态度，再考虑是否需要修改决策快照。
          </div>
        </div>

        <div id="t7-signals"></div>
      </div>

      <!-- T8: 复盘归档 -->
      <div class="tab-panel" id="panel-t8">
        <div class="panel-title">复盘归档 <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Review & Archive</span></div>
        <div class="panel-desc">记录本次判断的过程与结论。如果是错判，<strong style="color:var(--color-red)">错判分析需要你独立思考完成——不提供 AI 初稿。</strong></div>

        <div class="ai-notice">
          <i class="fas fa-exclamation-triangle" style="color:var(--color-orange)"></i>
          <div>
            <strong>T8 是复盘核心步骤，尤其是错判记录。</strong>
            复盘摘要可参考 AI 整理，但错判分析必须由你独立完成——这是积累判断能力的唯一路径。
          </div>
        </div>

        <div id="t8-new-review"></div>
        <hr class="divider">
        <div style="font-size:15px;font-weight:700;margin-bottom:12px">历史复盘记录</div>
        <div id="t8-reviews"></div>
      </div>

    </div><!-- /tab-panels -->
  </div><!-- /analysis-layout -->
</div><!-- /page-analysis -->

</div><!-- /app-body -->

<!-- Toast 通知 -->
<div class="toast" id="app-toast"></div>

<!-- 数据注入 -->
<script>
  window.MOCK_PROJECTS = ${projectsJson};
  window.DEFAULT_CONTEXT = ${contextJson};
</script>
<script src="/static/app.js"></script>

</body>
</html>`)
})

export default app
