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
  界面3：项目分析判断页（6 Tab）
  ========================================================= -->
<div class="page" id="page-analysis">
  <div class="analysis-layout">

    <!-- 固定头部：面包屑（无上下文条） -->
    <div class="analysis-header analysis-header-slim">
      <div class="analysis-breadcrumb">
        <a id="breadcrumb-back"><i class="fas fa-chevron-left"></i> 项目流</a>
        <i class="fas fa-chevron-right"></i>
        <span id="analysis-project-name" style="color:var(--color-text-primary);font-weight:600"></span>
      </div>
      <div class="analysis-project-meta" id="analysis-project-meta"></div>
    </div>

    <!-- Tab 导航（4 个） -->
    <div class="tab-nav-wrap">
      <div class="tab-nav">
        <button class="tab-item active" data-tab="ta">
          <span class="tab-num">1</span> 信息搜集与分层
        </button>
        <button class="tab-item" data-tab="tb">
          <span class="tab-num">2</span> 假设 · 证据 · 红旗
          <span class="tab-dot"></span>
        </button>
        <button class="tab-item" data-tab="tc">
          <span class="tab-num">3</span> 决策快照
        </button>
        <button class="tab-item" data-tab="td">
          <span class="tab-num">4</span> 复盘归档
        </button>
      </div>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-panels">

      <!-- Tab A: 信息搜集与分层 -->
      <div class="tab-panel active" id="panel-ta">
        <div class="panel-title">信息搜集与分层
          <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Information Gathering & Layering</span>
        </div>
        <div class="panel-desc">信息与证据直接按层级归类展示。可通过下拉框修改层级归属和可信度评级；来源链接点击直达。「当前未知」栏为空是警告信号。</div>

        <div class="ai-notice">
          <i class="fas fa-robot"></i>
          <div>
            <strong>AI 已完成初步整理与分层。</strong>
            绿色列 = 可独立核验的公开事实；橙色列 = 官方宣称但未经独立核验；灰色列 = 目前无法获取或确认。
          </div>
        </div>

        <div id="ta-unknown-warning" style="display:none" class="progress-gate"></div>

        <!-- 三栏直接展示，信息+证据混合 -->
        <div class="layer-columns">
          <div class="layer-column layer-公开事实">
            <div class="layer-column-header">
              <div class="layer-dot"></div>
              <span class="layer-column-title">公开事实</span>
              <span class="layer-column-count" id="layer-count-公开事实">0</span>
              <span style="font-size:11px;color:var(--color-text-tertiary);margin-left:auto">可独立核验</span>
            </div>
            <div class="layer-column-body" id="layer-col-公开事实"></div>
          </div>
          <div class="layer-column layer-发起方主张">
            <div class="layer-column-header">
              <div class="layer-dot"></div>
              <span class="layer-column-title">发起方主张</span>
              <span class="layer-column-count" id="layer-count-发起方主张">0</span>
              <span style="font-size:11px;color:var(--color-text-tertiary);margin-left:auto">官方宣称</span>
            </div>
            <div class="layer-column-body" id="layer-col-发起方主张"></div>
          </div>
          <div class="layer-column layer-当前未知">
            <div class="layer-column-header">
              <div class="layer-dot"></div>
              <span class="layer-column-title">当前未知</span>
              <span class="layer-column-count" id="layer-count-当前未知">0</span>
              <span style="font-size:11px;color:var(--color-text-tertiary);margin-left:auto">无法核验</span>
            </div>
            <div class="layer-column-body" id="layer-col-当前未知"></div>
          </div>
        </div>
      </div>

      <!-- Tab B: 假设·证据·红旗 -->
      <div class="tab-panel" id="panel-tb">
        <div class="panel-title">假设 · 证据 · 红旗
          <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Assumptions · Evidence · Red Flags</span>
        </div>
        <div class="panel-desc">
          AI 从 5 个维度分析当前信息是否自洽。展开每个维度，查看悖论信号、证据，并直接对关联红旗定级、给出你的判断态度。
        </div>

        <div class="ai-notice">
          <i class="fas fa-exclamation-triangle" style="color:var(--color-orange)"></i>
          <div>
            <strong>这是判断核心步骤，需要你深度参与。</strong>
            展开每个维度 → 查看悖论信号 → 对关联红旗定级 → 给出整体态度（支撑 / 存疑 / 否定）。
          </div>
        </div>

        <!-- 进度提示 -->
        <div id="tb-progress-gate" class="progress-gate" style="margin-bottom:16px">
          <i class="fas fa-exclamation-triangle"></i>
          <p>正在加载…</p>
        </div>

        <!-- 维度块（红旗在维度内嵌定级） -->
        <div id="tb-dimensions"></div>
      </div>

      <!-- Tab C: 决策快照 -->
      <div class="tab-panel" id="panel-tc">
        <div class="panel-title">决策快照 <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Decision Snapshot</span></div>
        <div class="panel-desc">每次决策冻结为一个快照版本。快照记录当时的投入边界、各维度态度和跟踪信号，以及修改触发节点。有新信息时可新增快照版本。</div>

        <div id="tc-gate" class="progress-gate" style="margin-bottom:20px"></div>

        <!-- 已有快照列表（可展开/收缩卡片） -->
        <div id="tc-snapshots-list"></div>

        <!-- 新建快照编辑区 -->
        <div id="tc-editor" style="display:none">
          <div class="snapshot-editor-card">
            <div class="snapshot-editor-title">
              <i class="fas fa-plus-circle" style="color:var(--color-blue)"></i>
              <span id="tc-editor-title-text">新建决策快照</span>
            </div>

            <div class="ai-notice" id="tc-ai-suggestion" style="margin-bottom:16px">
              <i class="fas fa-robot"></i>
              <div>AI 正在推断建议边界…</div>
            </div>

            <div style="font-size:14px;font-weight:700;margin-bottom:10px">选择投入边界 <span style="font-size:12px;font-weight:400;color:var(--color-red)">（必须由你决定）</span></div>
            <div class="boundary-selector" id="tc-boundary-selector"></div>

            <hr class="divider">

            <div style="font-size:14px;font-weight:700;margin-bottom:10px">各维度状态 <span style="font-size:12px;font-weight:400;color:var(--color-text-tertiary)">存疑/否定维度可填写跟踪信号</span></div>
            <div id="tc-dimensions-summary"></div>

            <hr class="divider">

            <div style="font-size:14px;font-weight:700;margin-bottom:10px">决策修改节点</div>
            <div class="form-group">
              <label class="form-label">升级触发条件 <span class="label-note">（什么情况下可以提升投入级别）</span></label>
              <input class="form-input" id="tc-trigger-upgrade" placeholder="例如：若能获取到独立客户验证，可升级到可以接触">
            </div>
            <div class="form-group">
              <label class="form-label">暂停触发条件 <span class="label-note">（什么情况下应立即暂停）</span></label>
              <input class="form-input" id="tc-trigger-pause" placeholder="例如：若出现安全合规问题或产品停止维护">
            </div>
            <div class="form-group">
              <label class="form-label">退出触发条件 <span class="label-note">（什么情况下彻底退出跟踪）</span></label>
              <input class="form-input" id="tc-trigger-exit" placeholder="例如：项目方停止更新超过 3 个月">
            </div>
            <div class="form-group">
              <label class="form-label">下次复查时间</label>
              <input class="form-input" id="tc-review-date" type="date" value="2026-05-01">
            </div>

            <div style="display:flex;gap:12px;margin-top:8px;align-items:center">
              <button class="btn btn-primary btn-lg" id="tc-generate-snapshot">
                <i class="fas fa-camera"></i> 冻结快照
              </button>
              <button class="btn btn-secondary" id="tc-cancel-editor">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab D: 复盘归档（原 Tab E） -->
      <div class="tab-panel" id="panel-td">
        <div class="panel-title">复盘归档 <span style="font-size:14px;font-weight:400;color:var(--color-text-tertiary)">Review & Archive</span></div>
        <div class="panel-desc">记录本次判断的过程与结论。如果是错判，<strong style="color:var(--color-red)">错判分析需要你独立思考完成——不提供 AI 初稿。</strong></div>

        <div class="ai-notice">
          <i class="fas fa-exclamation-triangle" style="color:var(--color-orange)"></i>
          <div>
            <strong>复盘是积累判断能力的唯一路径。</strong>
            复盘摘要可参考 AI 整理，但错判分析必须由你独立完成——不提供 AI 初稿，不能为空。
          </div>
        </div>

        <div id="td-new-review"></div>
        <hr class="divider">
        <div style="font-size:15px;font-weight:700;margin-bottom:12px">历史复盘记录</div>
        <div id="td-reviews"></div>
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
