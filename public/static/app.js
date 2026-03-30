/**
 * Project Compass - 前端应用主逻辑
 * 三界面 SPA：项目流 / 后台管理 / 项目分析判断
 */

// =====================================================
// 状态管理
// =====================================================

const AppState = {
  currentPage: 'projects',        // 'projects' | 'admin' | 'analysis'
  currentProjectId: null,         // 当前打开的项目 ID
  currentTab: 't1',               // 当前分析 Tab
  adminSection: 'import',         // 'import' | 'context'
  filterStatus: '全部',
  filterNewInfo: false,
  filterCategory: '',
  searchKeyword: '',

  // 项目运行时状态（在内存中维护，页面刷新不保留）
  projects: [],

  init() {
    // 深拷贝 mock 数据
    this.projects = JSON.parse(JSON.stringify(window.MOCK_PROJECTS || []))
    // 尝试从 localStorage 恢复用户操作
    const saved = localStorage.getItem('compass_project_states')
    if (saved) {
      try {
        const states = JSON.parse(saved)
        states.forEach(s => {
          const p = this.projects.find(p => p.id === s.id)
          if (p) Object.assign(p, s)
        })
      } catch(e) {}
    }
  },

  save() {
    // 只保存用户修改过的字段
    const states = this.projects.map(p => ({
      id: p.id,
      currentBoundary: p.currentBoundary,
      status: p.status,
      logicReviewCompleted: p.logicReviewCompleted,
      allFlagsTriaged: p.allFlagsTriaged,
      assumptions: p.assumptions,
      redFlags: p.redFlags,
      trackingSignals: p.trackingSignals,
      decisionSnapshot: p.decisionSnapshot,
      reviewNotes: p.reviewNotes
    }))
    localStorage.setItem('compass_project_states', JSON.stringify(states))
  },

  getProject(id) {
    return this.projects.find(p => p.id === id)
  },

  getFilteredProjects() {
    return this.projects.filter(p => {
      if (this.filterStatus !== '全部' && p.status !== this.filterStatus) return false
      if (this.filterNewInfo && !p.hasNewInfo) return false
      if (this.filterCategory && p.category !== this.filterCategory) return false
      if (this.searchKeyword) {
        const kw = this.searchKeyword.toLowerCase()
        if (!p.name.toLowerCase().includes(kw) &&
            !p.tagline.toLowerCase().includes(kw) &&
            !p.category.toLowerCase().includes(kw)) return false
      }
      return true
    })
  }
}

// =====================================================
// 路由 / 导航
// =====================================================

function navigateTo(page, projectId = null) {
  AppState.currentPage = page
  AppState.currentProjectId = projectId

  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'))

  if (page === 'projects') {
    document.getElementById('page-projects').classList.add('active')
    document.getElementById('nav-projects').classList.add('active')
    renderProjectsPage()
  } else if (page === 'admin') {
    document.getElementById('page-admin').classList.add('active')
    document.getElementById('nav-admin').classList.add('active')
    renderAdminPage()
  } else if (page === 'analysis' && projectId) {
    document.getElementById('page-analysis').classList.add('active')
    renderAnalysisPage(projectId)
  }
}

// =====================================================
// 工具函数
// =====================================================

function getBoundaryColor(boundary) {
  const map = {
    '暂不继续': '#FF3B30', '继续观察': '#FF9500',
    '可以接触': '#007AFF', '可以投入有限试点': '#34C759'
  }
  return map[boundary] || '#8E8E93'
}

function getBoundaryIcon(boundary) {
  const map = {
    '暂不继续': 'fa-ban', '继续观察': 'fa-binoculars',
    '可以接触': 'fa-handshake', '可以投入有限试点': 'fa-rocket'
  }
  return map[boundary] || 'fa-circle'
}

function getProjectIcon(category) {
  const icons = {
    'Proposal / RFP AI': '📋',
    'Security Questionnaire AI': '🔒',
    'Enterprise AI Search / Knowledge AI': '🔍',
    'Sales Proposal AI': '💼',
    'Due Diligence AI': '🔎'
  }
  return icons[category] || '📁'
}

function getProjectColor(id) {
  const colors = ['#007AFF','#34C759','#FF9500','#AF52DE','#FF3B30','#5856D6','#FF2D55','#30B0C7']
  let hash = 0
  for (let c of id) hash = (hash * 31 + c.charCodeAt(0)) % colors.length
  return colors[hash]
}

function getEvidenceIcon(type) {
  const map = {
    website: 'fa-globe', pricing: 'fa-tag', security: 'fa-shield',
    integration: 'fa-plug', case_study: 'fa-file-alt', help_doc: 'fa-book',
    user_review: 'fa-star', changelog: 'fa-history'
  }
  return map[type] || 'fa-link'
}

function getEvidenceLabel(type) {
  const map = {
    website: '官网', pricing: '定价', security: '安全',
    integration: '集成', case_study: '案例', help_doc: '文档',
    user_review: '用户评价', changelog: '更新记录'
  }
  return map[type] || type
}

function getReliabilityLabel(r) {
  return { high: '高可信', medium: '中等', low: '低可信' }[r] || r
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('app-toast')
  const iconMap = { success: 'fa-check-circle', warning: 'fa-exclamation-circle', info: 'fa-info-circle' }
  toast.innerHTML = `<i class="fas ${iconMap[type]}"></i> ${msg}`
  toast.className = `toast ${type} show`
  setTimeout(() => toast.classList.remove('show'), 2200)
}

function countUnhandledFlags(project) {
  return project.redFlags.filter(f => f.level === null).length
}

function countPendingStances(project) {
  return project.assumptions.filter(a => a.stance === '待评估').length
}

// =====================================================
// 界面1：项目流
// =====================================================

function renderProjectsPage() {
  const projects = AppState.getFilteredProjects()

  // 更新结果计数
  document.getElementById('result-count').textContent =
    `共 ${projects.length} 个项目${AppState.filterStatus !== '全部' ? `（已筛选）` : ''}`

  const grid = document.getElementById('project-grid')
  if (projects.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-compass"></i>
        <p>没有找到匹配的项目</p>
      </div>`
    return
  }

  grid.innerHTML = projects.map(p => renderProjectCard(p)).join('')

  // 绑定点击
  grid.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => navigateTo('analysis', card.dataset.id))
  })
  grid.querySelectorAll('.card-enter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      navigateTo('analysis', btn.dataset.id)
    })
  })
}

function renderProjectCard(p) {
  const pendingFlags = countUnhandledFlags(p)
  const pendingStances = countPendingStances(p)
  const color = getProjectColor(p.id)
  const icon = getProjectIcon(p.category)

  return `
    <div class="project-card" data-id="${p.id}">
      <div class="project-card-icon" style="background:${color}">${icon}</div>

      <div class="project-card-main">
        <div class="project-card-top">
          <span class="project-card-name">${p.name}</span>
          ${p.hasNewInfo ? `<span class="new-info-dot"></span>` : ''}
          <span class="badge badge-${p.status}">${p.status}</span>
          <span class="badge badge-boundary-${p.currentBoundary}">
            <i class="fas ${getBoundaryIcon(p.currentBoundary)}"></i>
            ${p.currentBoundary}
          </span>
        </div>
        <div class="project-card-category">${p.category}</div>
        <div class="project-card-tagline">${p.tagline}</div>
        <div class="project-card-meta">
          <div class="project-card-meta-item">
            <i class="fas fa-clock"></i>
            <span>最近更新 ${p.lastSignalDate}</span>
          </div>
          ${p.reviewReminder ? `
          <div class="project-card-meta-item">
            <i class="fas fa-calendar-check"></i>
            <span>复查 ${p.reviewReminder}</span>
          </div>` : ''}
          ${pendingFlags > 0 ? `
          <div class="project-card-meta-item" style="color:var(--color-red)">
            <i class="fas fa-flag" style="color:var(--color-red)"></i>
            <span>${pendingFlags} 个红旗待处理</span>
          </div>` : ''}
          ${pendingStances > 0 ? `
          <div class="project-card-meta-item" style="color:var(--color-orange)">
            <i class="fas fa-question-circle" style="color:var(--color-orange)"></i>
            <span>${pendingStances} 个假设待评估</span>
          </div>` : ''}
        </div>
      </div>

      <div class="project-card-right">
        <button class="card-enter-btn" data-id="${p.id}">
          进入判断 <i class="fas fa-chevron-right"></i>
        </button>
        ${p.topRedFlag ? `
        <div class="project-card-flag">
          <i class="fas fa-exclamation-triangle"></i>
          <span>${p.topRedFlag.length > 40 ? p.topRedFlag.slice(0,40)+'…' : p.topRedFlag}</span>
        </div>` : ''}
      </div>
    </div>`
}

function initProjectsFilters() {
  // 状态 Tab
  document.querySelectorAll('.filter-tab[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab[data-status]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      AppState.filterStatus = btn.dataset.status
      renderProjectsPage()
    })
  })

  // 新增信息 checkbox
  const newInfoChk = document.getElementById('filter-new-info')
  newInfoChk?.addEventListener('change', () => {
    AppState.filterNewInfo = newInfoChk.checked
    const label = newInfoChk.closest('.filter-checkbox')
    label.classList.toggle('active', newInfoChk.checked)
    renderProjectsPage()
  })

  // 搜索
  const searchInput = document.getElementById('search-input')
  let searchTimer
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      AppState.searchKeyword = searchInput.value.trim()
      renderProjectsPage()
    }, 200)
  })

  // 类别筛选
  const categorySelect = document.getElementById('category-select')
  categorySelect?.addEventListener('change', () => {
    AppState.filterCategory = categorySelect.value
    renderProjectsPage()
  })
}

// =====================================================
// 界面2：后台管理
// =====================================================

function renderAdminPage() {
  // 填充决策方现状
  const ctx = window.DEFAULT_CONTEXT
  if (ctx) {
    document.getElementById('ctx-role').value = ctx.role || ''
    document.getElementById('ctx-goal').value = ctx.currentGoal || ''
    document.getElementById('ctx-resources').value = ctx.resourceConstraints || ''
    document.getElementById('ctx-risk').value = ctx.topRisk || ''
    document.getElementById('ctx-max-level').value = ctx.maxCommitmentLevel || '可以接触'
  }
}

function initAdminNav() {
  document.querySelectorAll('.admin-nav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'))
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'))
      btn.classList.add('active')
      const sec = btn.dataset.section
      document.getElementById(`admin-${sec}`)?.classList.add('active')
      AppState.adminSection = sec
    })
  })

  // 机会导入表单提交
  document.getElementById('import-form')?.addEventListener('submit', e => {
    e.preventDefault()
    showToast('机会导入成功！（MVP阶段使用预置数据）', 'success')
    e.target.reset()
  })

  // 决策方现状保存
  document.getElementById('context-form')?.addEventListener('submit', e => {
    e.preventDefault()
    showToast('决策方现状已保存', 'success')
  })
}

// =====================================================
// 界面3：项目分析判断页
// =====================================================

function renderAnalysisPage(projectId) {
  const project = AppState.getProject(projectId)
  if (!project) return

  // 面包屑
  document.getElementById('analysis-project-name').textContent = project.name

  // 上下文条
  const ctx = window.DEFAULT_CONTEXT
  document.getElementById('ctx-bar-role').textContent = ctx.role
  document.getElementById('ctx-bar-goal').textContent = ctx.currentGoal.slice(0, 30) + (ctx.currentGoal.length > 30 ? '…' : '')
  document.getElementById('ctx-bar-resources').textContent = ctx.resourceConstraints.slice(0, 25) + '…'
  document.getElementById('ctx-bar-risk').textContent = ctx.topRisk.slice(0, 25) + '…'

  // 渲染 Tab 状态
  renderTabAlerts(project)

  // 默认切到 T1
  switchTab('t1', project)
}

function renderTabAlerts(project) {
  // T5 有未处理红旗
  const t5Tab = document.querySelector('.tab-item[data-tab="t5"]')
  const unflagged = project.redFlags.filter(f => f.level === null).length
  if (t5Tab) t5Tab.classList.toggle('has-alert', unflagged > 0)

  // T4 有未评估假设
  const t4Tab = document.querySelector('.tab-item[data-tab="t4"]')
  const unassessed = project.assumptions.filter(a => a.stance === '待评估').length
  if (t4Tab) t4Tab.classList.toggle('has-alert', unassessed > 0)

  // T1 有新信息
  const t1Tab = document.querySelector('.tab-item[data-tab="t1"]')
  if (t1Tab) t1Tab.classList.toggle('has-alert', project.hasNewInfo)
}

function switchTab(tabId, project) {
  AppState.currentTab = tabId
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'))
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
  document.querySelector(`.tab-item[data-tab="${tabId}"]`)?.classList.add('active')
  document.getElementById(`panel-${tabId}`)?.classList.add('active')

  const renderers = {
    t1: () => renderT1(project),
    t2: () => renderT2(project),
    t3: () => renderT3(project),
    t4: () => renderT4(project),
    t5: () => renderT5(project),
    t6: () => renderT6(project),
    t7: () => renderT7(project),
    t8: () => renderT8(project)
  }
  renderers[tabId]?.()
}

function initTabNav() {
  document.querySelectorAll('.tab-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const project = AppState.getProject(AppState.currentProjectId)
      if (project) switchTab(btn.dataset.tab, project)
    })
  })
}

// ─────────────────────────────────────────────────────
// T1: 信息搜集
// ─────────────────────────────────────────────────────
function renderT1(project) {
  const container = document.getElementById('t1-items')
  const pendingCount = project.infoItems.filter(i => !i.userConfirmed).length
  const confirmedCount = project.infoItems.filter(i => i.userConfirmed).length

  // 统计
  document.getElementById('t1-pending-count').textContent = pendingCount
  document.getElementById('t1-confirmed-count').textContent = confirmedCount

  container.innerHTML = project.infoItems.map(item => `
    <div class="info-item-card ${item.userConfirmed ? 'confirmed' : 'pending-confirm'}" data-id="${item.id}">
      <div class="info-item-left">
        <div class="info-item-content">${item.content}</div>
        <div class="info-item-source">
          <i class="fas fa-${item.aiGenerated ? 'robot' : 'user'}"></i>
          <span>${item.source || 'AI 整理'}</span>
          ${item.sourceUrl ? `<a href="${item.sourceUrl}" target="_blank" onclick="event.stopPropagation()">
            <i class="fas fa-external-link-alt"></i>
          </a>` : ''}
          &nbsp;·&nbsp;
          <span class="badge badge-layer-${item.layer}">${item.layer}</span>
        </div>
      </div>
      <div class="info-item-actions">
        ${item.userConfirmed
          ? `<span class="info-item-confirmed"><i class="fas fa-check-circle"></i> 已确认</span>`
          : `<button class="btn btn-primary btn-sm confirm-item-btn" data-id="${item.id}">
              <i class="fas fa-check"></i> 确认
            </button>`
        }
        <button class="btn btn-secondary btn-sm doubt-item-btn" data-id="${item.id}" title="标记为存疑">
          <i class="fas fa-question"></i>
        </button>
      </div>
    </div>
  `).join('')

  // 一键采纳
  document.getElementById('t1-confirm-all')?.addEventListener('click', () => {
    project.infoItems.forEach(i => i.userConfirmed = true)
    AppState.save()
    showToast('已采纳全部信息', 'success')
    renderT1(project)
    renderTabAlerts(project)
  })

  // 单条确认
  container.querySelectorAll('.confirm-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = project.infoItems.find(i => i.id === btn.dataset.id)
      if (item) {
        item.userConfirmed = true
        AppState.save()
        renderT1(project)
      }
    })
  })

  // 存疑标记
  container.querySelectorAll('.doubt-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('已标记为存疑（功能完善中）', 'warning')
    })
  })
}

// ─────────────────────────────────────────────────────
// T2: 事实 / 自述 / 未知分层
// ─────────────────────────────────────────────────────
function renderT2(project) {
  const layers = ['公开事实', '发起方主张', '当前未知']
  const layerDesc = {
    '公开事实': '可从公开渠道独立核验的信息',
    '发起方主张': '来自官网/营销材料，代表发起方立场',
    '当前未知': '目前无法从公开渠道获取或确认的信息'
  }

  layers.forEach(layer => {
    const items = project.infoItems.filter(i => i.layer === layer)
    const col = document.getElementById(`layer-col-${layer}`)
    const countEl = document.getElementById(`layer-count-${layer}`)
    if (countEl) countEl.textContent = items.length
    if (col) {
      col.innerHTML = items.length === 0
        ? `<div style="padding:16px;text-align:center;color:var(--color-text-tertiary);font-size:13px">暂无信息</div>`
        : items.map(item => `
          <div class="layer-item">
            <div>${item.content}</div>
            <div class="layer-item-source">${item.source || ''}</div>
          </div>
        `).join('')
    }
  })

  // 一键采纳分层
  document.getElementById('t2-confirm-all')?.addEventListener('click', () => {
    showToast('已采纳 AI 分层结果', 'success')
  })

  // 未知项警告
  const unknownItems = project.infoItems.filter(i => i.layer === '当前未知')
  const warningEl = document.getElementById('t2-unknown-warning')
  if (warningEl) {
    warningEl.style.display = unknownItems.length === 0 ? 'flex' : 'none'
    if (unknownItems.length === 0) {
      warningEl.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="color:var(--color-orange)"></i>
        <p>⚠️ 系统未检测到"当前未知"项。这可能意味着信息过于乐观——请确认是否有重要信息无法从公开渠道获取。</p>
      `
    }
  }

  // 公开证据快照
  const evidenceList = document.getElementById('t2-evidence-list')
  if (evidenceList) {
    evidenceList.innerHTML = project.evidence.map(ev => `
      <div class="evidence-card">
        <div class="evidence-type-icon evidence-type-${ev.type}">
          <i class="fas ${getEvidenceIcon(ev.type)}"></i>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-size:13px;font-weight:600">${ev.title}</span>
            <span style="font-size:11px;color:var(--color-text-tertiary)">${getEvidenceLabel(ev.type)}</span>
            <span class="badge badge-reliability-${ev.reliability}">${getReliabilityLabel(ev.reliability)}</span>
          </div>
          <div style="font-size:13px;color:var(--color-text-secondary);line-height:1.5">${ev.summary}</div>
          ${ev.url ? `<a href="${ev.url}" target="_blank" style="font-size:11px;margin-top:4px;display:inline-block">
            <i class="fas fa-external-link-alt"></i> 查看来源
          </a>` : ''}
        </div>
      </div>
    `).join('')
  }
}

// ─────────────────────────────────────────────────────
// T3: 建立关键假设
// ─────────────────────────────────────────────────────
function renderT3(project) {
  const container = document.getElementById('t3-assumptions')
  const stanceLabels = { '支撑': '✓ 支撑', '存疑': '? 存疑', '否定': '✗ 否定' }

  container.innerHTML = project.assumptions.map(ass => {
    const supportEvidence = project.evidence.filter(e => ass.supportingEvidence.includes(e.id))
    const weakenEvidence = project.evidence.filter(e => ass.weakeningEvidence.includes(e.id))
    const flags = project.redFlags.filter(f => ass.redFlags.includes(f.id))

    return `
    <div class="assumption-card stance-${ass.stance}" data-id="${ass.id}">
      <div class="assumption-header" onclick="toggleAssumption('${ass.id}')">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span class="badge badge-type-${ass.type}">${ass.type}</span>
            <span class="badge badge-stance-${ass.stance}">${ass.stance}</span>
            ${ass.aiGenerated ? '<span style="font-size:11px;color:var(--color-text-tertiary)"><i class="fas fa-robot"></i> AI生成</span>' : ''}
          </div>
          <div style="font-size:14px;color:var(--color-text-primary);line-height:1.6">${ass.content}</div>
        </div>
        <i class="fas fa-chevron-down" style="color:var(--color-text-tertiary);font-size:12px;transition:transform 0.2s;flex-shrink:0" id="chevron-${ass.id}"></i>
      </div>
      <div class="assumption-body" id="assumption-body-${ass.id}">
        <div style="padding-top:12px">
          <div class="assumption-evidence-section">
            <div class="assumption-evidence-title"><i class="fas fa-check-circle" style="color:var(--color-green)"></i> 支持证据</div>
            ${supportEvidence.length === 0
              ? '<div class="assumption-evidence-item" style="color:var(--color-text-tertiary)"><i class="fas fa-minus"></i> 暂无支持证据</div>'
              : supportEvidence.map(e => `<div class="assumption-evidence-item"><i class="fas ${getEvidenceIcon(e.type)}" style="color:var(--color-blue)"></i>${e.title}：${e.summary}</div>`).join('')
            }
          </div>
          ${weakenEvidence.length > 0 ? `
          <div class="assumption-evidence-section">
            <div class="assumption-evidence-title"><i class="fas fa-exclamation-circle" style="color:var(--color-orange)"></i> 削弱证据</div>
            ${weakenEvidence.map(e => `<div class="assumption-evidence-item"><i class="fas ${getEvidenceIcon(e.type)}" style="color:var(--color-orange)"></i>${e.title}：${e.summary}</div>`).join('')}
          </div>` : ''}
          ${flags.length > 0 ? `
          <div class="assumption-evidence-section">
            <div class="assumption-evidence-title"><i class="fas fa-flag" style="color:var(--color-red)"></i> 相关红旗</div>
            ${flags.map(f => `<div class="assumption-evidence-item" style="color:var(--color-red)"><i class="fas fa-flag"></i>${f.content}</div>`).join('')}
          </div>` : ''}
        </div>
      </div>
    </div>`
  }).join('')
}

window.toggleAssumption = function(id) {
  const body = document.getElementById(`assumption-body-${id}`)
  const chevron = document.getElementById(`chevron-${id}`)
  if (body) {
    const expanded = body.classList.toggle('expanded')
    if (chevron) chevron.style.transform = expanded ? 'rotate(180deg)' : ''
  }
}

// ─────────────────────────────────────────────────────
// T4: 逻辑串联（深度参与）
// ─────────────────────────────────────────────────────
function renderT4(project) {
  const container = document.getElementById('t4-logic')
  const unassessed = project.assumptions.filter(a => a.stance === '待评估').length

  container.innerHTML = project.assumptions.map(ass => `
    <div class="assumption-card stance-${ass.stance}" id="t4-ass-${ass.id}">
      <div style="padding:16px 20px">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
              <span class="badge badge-type-${ass.type}">${ass.type}</span>
              <span class="badge badge-stance-${ass.stance}">${ass.stance}</span>
            </div>
            <div style="font-size:14px;color:var(--color-text-primary);line-height:1.6;margin-bottom:12px">${ass.content}</div>
          </div>
        </div>

        <div style="background:var(--color-bg);border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-size:12px;font-weight:600;color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">
            <i class="fas fa-brain" style="color:var(--color-blue)"></i> 你的判断：这个假设的证据是否充分？
          </div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:12px;line-height:1.5">
            ${ass.stance === '待评估'
              ? '⚠️ 你还没有对这个假设给出态度。这是 T4 的核心操作——请根据你目前看到的证据做出判断。'
              : `当前态度：<strong>${ass.stance}</strong>。如需修改，请重新选择。`
            }
          </div>
          <div class="stance-selector">
            ${['支撑', '存疑', '否定'].map(s => `
              <button class="stance-btn ${ass.stance === s ? `selected-${s}` : ''}"
                      data-ass="${ass.id}" data-stance="${s}">${s}</button>
            `).join('')}
          </div>
        </div>

        ${ass.stance !== '待评估' ? `
        <div class="gate-complete" style="margin-top:0">
          <i class="fas fa-check-circle"></i>
          <p>已完成评估 — 态度：${ass.stance}</p>
        </div>` : ''}
      </div>
    </div>
  `).join('')

  // 进度提示
  const gateEl = document.getElementById('t4-progress-gate')
  if (gateEl) {
    if (unassessed > 0) {
      gateEl.className = 'progress-gate'
      gateEl.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <p>还有 <strong>${unassessed} 个假设</strong>尚未给出态度。T4 是判断核心环节——请对每个假设做出判断后再继续。</p>
      `
    } else {
      gateEl.className = 'gate-complete'
      gateEl.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <p>所有假设已完成评估！你可以继续进入 T5 红旗与反证。</p>
      `
    }
  }

  // 态度选择
  container.querySelectorAll('.stance-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ass = project.assumptions.find(a => a.id === btn.dataset.ass)
      if (ass) {
        ass.stance = btn.dataset.stance
        AppState.save()
        renderT4(project)
        renderTabAlerts(project)
        showToast(`假设已标记为「${btn.dataset.stance}」`, 'success')
      }
    })
  })
}

// ─────────────────────────────────────────────────────
// T5: 红旗与反证（深度参与）
// ─────────────────────────────────────────────────────
function renderT5(project) {
  const container = document.getElementById('t5-flags')
  const unhandled = project.redFlags.filter(f => f.level === null).length

  // 进度提示
  const gateEl = document.getElementById('t5-progress-gate')
  if (gateEl) {
    if (unhandled > 0) {
      gateEl.className = 'progress-gate'
      gateEl.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <p>还有 <strong>${unhandled} 个红旗</strong>未完成定级。每条红旗都需要你给出处理结果，才能推进到决策快照。</p>
      `
    } else {
      gateEl.className = 'gate-complete'
      gateEl.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <p>所有红旗已完成定级！可以进入 T6 生成决策快照。</p>
      `
    }
  }

  container.innerHTML = project.redFlags.map(flag => `
    <div class="redflag-card level-${flag.level}" id="flag-${flag.id}">
      <div class="redflag-icon"><i class="fas fa-flag"></i></div>
      <div class="redflag-body">
        <div class="redflag-content">${flag.content}</div>
        <div class="redflag-category">类别：${flag.category} &nbsp;·&nbsp; ${flag.aiGenerated ? 'AI 识别' : '手动添加'}</div>

        <div style="font-size:12px;font-weight:600;color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">
          你的处理结果
        </div>
        <div class="flag-level-selector">
          ${['致命', '需关注', '已解释'].map(level => `
            <button class="flag-level-btn ${flag.level === level ? `selected-${level}` : ''}"
                    data-flag="${flag.id}" data-level="${level}">
              ${level === '致命' ? '⛔ 致命' : level === '需关注' ? '⚠️ 需关注' : '✅ 已解释'}
            </button>
          `).join('')}
        </div>

        ${flag.level === '已解释' ? `
        <div class="flag-user-note">
          <input type="text" placeholder="请简要说明如何解释这条红旗…"
            value="${flag.userNote || ''}"
            data-flag="${flag.id}" class="flag-note-input" />
        </div>` : ''}

        ${flag.level === null ? `
        <div style="font-size:12px;color:var(--color-orange);margin-top:8px">
          <i class="fas fa-exclamation-circle"></i> 待处理 — 请选择处理结果
        </div>` : ''}
      </div>
    </div>
  `).join('')

  // 级别选择
  container.querySelectorAll('.flag-level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const flag = project.redFlags.find(f => f.id === btn.dataset.flag)
      if (flag) {
        flag.level = btn.dataset.level
        AppState.save()
        project.allFlagsTriaged = project.redFlags.every(f => f.level !== null)
        renderT5(project)
        renderTabAlerts(project)
        showToast(`红旗已标记为「${btn.dataset.level}」`, 'success')
      }
    })
  })

  // 解释说明
  container.querySelectorAll('.flag-note-input').forEach(input => {
    input.addEventListener('blur', () => {
      const flag = project.redFlags.find(f => f.id === input.dataset.flag)
      if (flag) { flag.userNote = input.value; AppState.save() }
    })
  })
}

// ─────────────────────────────────────────────────────
// T6: 决策快照
// ─────────────────────────────────────────────────────
function renderT6(project) {
  const allFlagsTriaged = project.redFlags.every(f => f.level !== null)
  const allStancesDone = project.assumptions.every(a => a.stance !== '待评估')
  const canProceed = allFlagsTriaged && allStancesDone

  const gateEl = document.getElementById('t6-gate')
  if (gateEl) {
    if (!canProceed) {
      const missing = []
      if (!allStancesDone) missing.push('T4：尚有假设未评估')
      if (!allFlagsTriaged) missing.push('T5：尚有红旗未定级')
      gateEl.className = 'progress-gate'
      gateEl.innerHTML = `
        <i class="fas fa-lock"></i>
        <div>
          <p><strong>生成决策快照前，需要先完成：</strong></p>
          ${missing.map(m => `<p style="margin-top:4px">• ${m}</p>`).join('')}
        </div>
      `
    } else {
      gateEl.className = 'gate-complete'
      gateEl.innerHTML = `<i class="fas fa-unlock"></i><p>所有前置步骤已完成，可以生成决策快照。</p>`
    }
  }

  if (project.decisionSnapshot?.frozenAt) {
    renderFrozenSnapshot(project)
    const editor = document.getElementById('t6-editor')
    if (editor) editor.style.display = 'none'
    return
  }

  // 未冻结时显示 editor
  const editor = document.getElementById('t6-editor')
  if (editor) editor.style.display = 'block'
  const snapDisplay = document.getElementById('t6-snapshot-display')
  if (snapDisplay) snapDisplay.innerHTML = ''

  // AI 推荐边界
  const fatalFlags = project.redFlags.filter(f => f.level === '致命').length
  const deniedAssumptions = project.assumptions.filter(a => a.stance === '否定').length
  let suggestedBoundary = '继续观察'
  let suggestionReason = ''
  if (fatalFlags > 0 || deniedAssumptions > 0) {
    suggestedBoundary = '暂不继续'
    suggestionReason = `存在 ${fatalFlags} 个致命红旗、${deniedAssumptions} 个关键假设被否定`
  } else if (project.assumptions.filter(a => a.stance === '存疑').length >= 3) {
    suggestedBoundary = '继续观察'
    suggestionReason = '多个假设仍处于存疑状态，信息不足以推进'
  } else if (project.assumptions.filter(a => a.stance === '支撑').length >= 3) {
    suggestedBoundary = '可以接触'
    suggestionReason = '关键假设有较强支撑，可以进行初步接触验证'
  }

  const aiNotice = document.getElementById('t6-ai-suggestion')
  if (aiNotice) {
    aiNotice.innerHTML = `
      <i class="fas fa-robot"></i>
      <div>
        <strong>AI 建议边界：${suggestedBoundary}</strong>
        <span style="color:var(--color-text-tertiary)">（${suggestionReason || '基于当前证据的保守推断'}）</span>
        <br><span style="font-size:12px">这只是参考——<strong>最终投入边界由你来决定</strong>，请根据你的实际情况选择。</span>
      </div>
    `
  }

  // 边界选择器
  const boundaries = [
    { key: '暂不继续', icon: '🚫', desc: '当前证据不足以支持任何形式投入，需要等待更多公开信号' },
    { key: '继续观察', icon: '👀', desc: '可以持续关注公开信息更新，但暂不主动接触或投入资源' },
    { key: '可以接触', icon: '🤝', desc: '可以进行初步接触（如预约 demo），但不承诺任何资源投入' },
    { key: '可以投入有限试点', icon: '🚀', desc: '在明确的资源上限内，可投入试点预算和有限实施时间' }
  ]

  const selectorEl = document.getElementById('t6-boundary-selector')
  if (selectorEl) {
    selectorEl.innerHTML = boundaries.map(b => `
      <div class="boundary-option ${project.currentBoundary === b.key ? `selected-${b.key}` : ''}"
           data-boundary="${b.key}" onclick="selectBoundary('${b.key}')">
        <div class="boundary-option-icon">${b.icon}</div>
        <div class="boundary-option-label">${b.key}</div>
        <div class="boundary-option-desc">${b.desc}</div>
      </div>
    `).join('')
  }

  // 关键假设摘要
  const assumptionSummary = document.getElementById('t6-assumptions-summary')
  if (assumptionSummary) {
    assumptionSummary.innerHTML = project.assumptions.map(a => `
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-size:13px">
        <span class="badge badge-stance-${a.stance}" style="flex-shrink:0">${a.stance}</span>
        <span style="color:var(--color-text-secondary)">${a.content}</span>
      </div>
    `).join('')
  }
}

window.selectBoundary = function(boundary) {
  const project = AppState.getProject(AppState.currentProjectId)
  if (project) {
    project.currentBoundary = boundary
    AppState.save()
    renderT6(project)
    showToast(`投入边界已设为「${boundary}」`, 'success')
  }
}

document.getElementById('t6-generate-snapshot')?.addEventListener('click', generateSnapshot)

function generateSnapshot() {
  const project = AppState.getProject(AppState.currentProjectId)
  if (!project) return
  if (!project.redFlags.every(f => f.level !== null)) {
    showToast('请先完成 T5 红旗定级', 'warning'); return
  }

  const snapshot = {
    id: `snapshot-${Date.now()}`,
    createdAt: new Date().toLocaleDateString('zh-CN'),
    boundary: project.currentBoundary,
    keyAssumptions: project.assumptions.map(a => a.id),
    modificationTriggers: {
      upgrade: document.getElementById('t6-trigger-upgrade')?.value || '若关键假设得到独立验证，可升级至上一层边界',
      pause: document.getElementById('t6-trigger-pause')?.value || '若出现致命红旗或关键假设被否定，立即暂停',
      exit: document.getElementById('t6-trigger-exit')?.value || '项目方停止更新超过 3 个月，或安全合规问题无法解决'
    },
    reviewDate: document.getElementById('t6-review-date')?.value || '2026-05-01',
    frozenAt: new Date().toLocaleDateString('zh-CN')
  }

  project.decisionSnapshot = snapshot
  project.status = project.status === '未支持' ? '支持中' : project.status
  AppState.save()
  showToast('决策快照已生成并冻结 🎉', 'success')
  renderT6(project)
}

function renderFrozenSnapshot(project) {
  const snap = project.decisionSnapshot
  const container = document.getElementById('t6-snapshot-display')
  if (!container) return

  const keyAssumptions = project.assumptions.filter(a => snap.keyAssumptions.includes(a.id))

  container.innerHTML = `
    <div class="snapshot-frozen">
      <div class="snapshot-frozen-header">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <i class="fas fa-camera" style="font-size:20px;opacity:0.8"></i>
          <div>
            <div class="snapshot-frozen-title">决策快照 · 已冻结</div>
            <div class="snapshot-frozen-meta">冻结于 ${snap.frozenAt} · 复查日期 ${snap.reviewDate}</div>
          </div>
        </div>
        <div>
          <span class="badge badge-boundary-${snap.boundary}" style="font-size:14px;padding:4px 14px">
            <i class="fas ${getBoundaryIcon(snap.boundary)}"></i> ${snap.boundary}
          </span>
        </div>
      </div>
      <div class="snapshot-frozen-body">
        <div>
          <div class="snapshot-section-title">关键假设</div>
          ${keyAssumptions.map(a => `
            <div class="snapshot-item">
              <i class="fas fa-circle"></i>
              <span>[${a.stance}] ${a.content}</span>
            </div>
          `).join('')}
        </div>
        <div>
          <div class="snapshot-section-title">决策修改节点</div>
          <div class="snapshot-item"><i class="fas fa-arrow-up" style="color:var(--color-green)"></i><span><strong>升级：</strong>${snap.modificationTriggers.upgrade}</span></div>
          <div class="snapshot-item"><i class="fas fa-pause" style="color:var(--color-orange)"></i><span><strong>暂停：</strong>${snap.modificationTriggers.pause}</span></div>
          <div class="snapshot-item"><i class="fas fa-times" style="color:var(--color-red)"></i><span><strong>退出：</strong>${snap.modificationTriggers.exit}</span></div>
        </div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid var(--color-border);display:flex;gap:12px">
        <button class="btn btn-secondary btn-sm" onclick="unfreezeSnapshot()">
          <i class="fas fa-edit"></i> 修改快照
        </button>
        <span style="font-size:12px;color:var(--color-text-tertiary);align-self:center">
          修改前请确认已有新信号变化
        </span>
      </div>
    </div>
  `
}

window.unfreezeSnapshot = function() {
  const project = AppState.getProject(AppState.currentProjectId)
  if (project?.decisionSnapshot) {
    project.decisionSnapshot.frozenAt = undefined
    AppState.save()
    renderT6(project)
  }
}

// ─────────────────────────────────────────────────────
// T7: 跟踪信号
// ─────────────────────────────────────────────────────
function renderT7(project) {
  const container = document.getElementById('t7-signals')

  if (!project.decisionSnapshot) {
    container.innerHTML = `
      <div class="progress-gate">
        <i class="fas fa-lock"></i>
        <p>请先在 T6 生成决策快照，再开始跟踪信号。</p>
      </div>`
    return
  }

  if (project.trackingSignals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-satellite-dish"></i>
        <p>暂无跟踪信号，可在决策快照后添加</p>
      </div>`
    return
  }

  container.innerHTML = project.trackingSignals.map(signal => {
    const ass = project.assumptions.find(a => a.id === signal.assumptionId)
    return `
      <div class="signal-card">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span class="badge badge-signal-${signal.status}">${signal.status}</span>
            ${ass ? `<span style="font-size:12px;color:var(--color-text-tertiary)">关联假设：${ass.content.slice(0,30)}…</span>` : ''}
          </div>
          <div style="font-size:14px;color:var(--color-text-primary);margin-bottom:6px">${signal.description}</div>
          ${signal.note ? `<div style="font-size:12px;color:var(--color-text-secondary);background:var(--color-bg);padding:6px 10px;border-radius:6px">${signal.note}</div>` : ''}
          ${signal.lastUpdate ? `<div style="font-size:11px;color:var(--color-text-tertiary);margin-top:4px">最近更新：${signal.lastUpdate}</div>` : ''}
          <div class="signal-status-selector">
            ${['已验证', '被削弱', '尚不清楚', '已否定'].map(s => `
              <button class="signal-status-btn ${signal.status === s ? `selected-${s}` : ''}"
                      data-signal="${signal.id}" data-status="${s}">${s}</button>
            `).join('')}
          </div>
        </div>
      </div>
    `
  }).join('')

  container.querySelectorAll('.signal-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const signal = project.trackingSignals.find(s => s.id === btn.dataset.signal)
      if (signal) {
        signal.status = btn.dataset.status
        signal.lastUpdate = new Date().toLocaleDateString('zh-CN')
        AppState.save()
        renderT7(project)
        showToast(`信号状态已更新为「${btn.dataset.status}」`, 'success')
      }
    })
  })
}

// ─────────────────────────────────────────────────────
// T8: 复盘归档（错判分析深度参与）
// ─────────────────────────────────────────────────────
function renderT8(project) {
  const container = document.getElementById('t8-reviews')

  // 历史复盘
  if (project.reviewNotes.length === 0) {
    container.innerHTML = `
      <div style="padding:24px;text-align:center;color:var(--color-text-tertiary);font-size:13px">
        <i class="fas fa-archive" style="font-size:24px;opacity:0.3;display:block;margin-bottom:8px"></i>
        暂无历史复盘记录
      </div>`
  } else {
    container.innerHTML = project.reviewNotes.map(note => `
      <div class="review-card">
        <div class="review-card-header">
          <i class="fas fa-calendar-check" style="color:var(--color-blue)"></i>
          <div>
            <div style="font-size:14px;font-weight:600">${note.createdAt}</div>
            <div style="font-size:12px;color:var(--color-text-tertiary)">${note.boundaryChange}</div>
          </div>
          ${note.isWrongDecision ? `<span class="wrong-decision-badge">错判记录</span>` : ''}
        </div>
        <div class="review-card-body">
          <div style="font-size:13px;color:var(--color-text-primary);margin-bottom:8px">${note.summary}</div>
          ${note.wrongDecisionAnalysis ? `
          <div style="background:var(--color-red-light);border-radius:6px;padding:10px 14px;font-size:12px;color:var(--color-red)">
            <strong>错判分析：</strong>${note.wrongDecisionAnalysis}
          </div>` : ''}
        </div>
      </div>
    `).join('')
  }

  // 新建复盘表单
  const newReviewForm = document.getElementById('t8-new-review')
  if (newReviewForm) {
    newReviewForm.innerHTML = `
      <div class="new-review-form">
        <div style="font-size:16px;font-weight:700;margin-bottom:4px">新建复盘记录</div>
        <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px">记录本次判断的情况，归档后不可修改</div>

        <div class="form-group">
          <label class="form-label">边界变化情况</label>
          <input class="form-input" id="review-boundary-change" placeholder="例如：初始评估 → 继续观察" />
        </div>

        <div class="form-group">
          <label class="form-label">复盘摘要</label>
          <textarea class="form-textarea" id="review-summary" rows="3"
            placeholder="总结这次判断的过程、关键信号变化、主要结论…"></textarea>
        </div>

        <div class="wrong-decision-toggle">
          <label class="ios-toggle">
            <input type="checkbox" id="review-is-wrong" onchange="toggleWrongAnalysis(this)">
            <span class="ios-toggle-slider"></span>
          </label>
          <span class="toggle-label">这是一次错判</span>
          <span style="font-size:12px;color:var(--color-text-tertiary)">（如果你认为当时的边界判断与证据不符）</span>
        </div>

        <div class="wrong-analysis-area" id="wrong-analysis-area">
          <label>错判分析 <span style="font-size:12px;opacity:0.8">（必填，不提供 AI 初稿）</span></label>
          <div class="wrong-analysis-hint">
            请独立思考：哪个假设或红旗当时没有被正确处理？是什么导致了边界判断偏差？
            不要只写结果，要写出推理过程。
          </div>
          <textarea id="wrong-analysis-text" rows="4"
            placeholder="例如：当时把发起方主张误判为公开事实，导致能力假设被标记为支撑，实际上该证据强度不够…"></textarea>
        </div>

        <div style="margin-top:20px;display:flex;gap:12px">
          <button class="btn btn-primary" onclick="submitReview()">
            <i class="fas fa-archive"></i> 提交复盘
          </button>
          <span style="font-size:12px;color:var(--color-text-tertiary);align-self:center">
            提交后不可修改
          </span>
        </div>
      </div>
    `
  }
}

window.toggleWrongAnalysis = function(checkbox) {
  const area = document.getElementById('wrong-analysis-area')
  if (area) area.classList.toggle('visible', checkbox.checked)
}

window.submitReview = function() {
  const project = AppState.getProject(AppState.currentProjectId)
  if (!project) return

  const summary = document.getElementById('review-summary')?.value.trim()
  const boundaryChange = document.getElementById('review-boundary-change')?.value.trim()
  const isWrong = document.getElementById('review-is-wrong')?.checked
  const wrongAnalysis = document.getElementById('wrong-analysis-text')?.value.trim()

  if (!summary) { showToast('请填写复盘摘要', 'warning'); return }
  if (!boundaryChange) { showToast('请填写边界变化情况', 'warning'); return }
  if (isWrong && !wrongAnalysis) { showToast('错判分析不可为空，请独立思考后填写', 'warning'); return }

  const note = {
    id: `review-${Date.now()}`,
    createdAt: new Date().toLocaleDateString('zh-CN'),
    boundaryChange,
    isWrongDecision: isWrong,
    wrongDecisionAnalysis: wrongAnalysis || undefined,
    summary
  }

  project.reviewNotes.unshift(note)
  if (project.status === '支持中') project.status = '已关闭'
  AppState.save()
  showToast('复盘已归档 ✓', 'success')
  renderT8(project)
}

// =====================================================
// 应用初始化
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  AppState.init()

  // 导航按钮
  document.getElementById('nav-projects')?.addEventListener('click', () => navigateTo('projects'))
  document.getElementById('nav-admin')?.addEventListener('click', () => navigateTo('admin'))
  document.getElementById('breadcrumb-back')?.addEventListener('click', () => navigateTo('projects'))

  // T6 generate snapshot 按钮
  document.getElementById('t6-generate-snapshot')?.addEventListener('click', generateSnapshot)

  initProjectsFilters()
  initAdminNav()
  initTabNav()

  // 默认进入项目流
  navigateTo('projects')
})
