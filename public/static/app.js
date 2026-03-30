/**
 * Project Compass - 前端应用主逻辑 v3
 * 三界面 SPA：项目流 / 后台管理 / 项目分析判断（5 Tab）
 * Tab A: 信息搜集与分层  Tab B: 假设·证据·红旗
 * Tab C: 决策快照  Tab D: 跟踪信号  Tab E: 复盘归档
 */

// =====================================================
// 状态管理
// =====================================================

const AppState = {
  currentPage: 'projects',
  currentProjectId: null,
  currentTab: 'ta',
  adminSection: 'import',
  filterStatus: '全部',
  filterNewInfo: false,
  filterCategory: '',
  searchKeyword: '',
  projects: [],

  init() {
    this.projects = JSON.parse(JSON.stringify(window.MOCK_PROJECTS || []))
    const saved = localStorage.getItem('compass_project_states_v3')
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
    const states = this.projects.map(p => ({
      id: p.id,
      currentBoundary: p.currentBoundary,
      status: p.status,
      allDimensionsReviewed: p.allDimensionsReviewed,
      allFlagsTriaged: p.allFlagsTriaged,
      dimensionBlocks: p.dimensionBlocks,
      redFlags: p.redFlags,
      trackingSignals: p.trackingSignals,
      decisionSnapshot: p.decisionSnapshot,
      reviewNotes: p.reviewNotes,
      infoItems: p.infoItems
    }))
    localStorage.setItem('compass_project_states_v3', JSON.stringify(states))
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
    website: 'fa-globe', pricing: 'fa-tag', security: 'fa-shield-alt',
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

function getDimensionIcon(dim) {
  const map = {
    '商业化层面': 'fa-chart-line',
    '用户层面': 'fa-users',
    '技术层面': 'fa-microchip',
    '适配层面': 'fa-puzzle-piece',
    '风险层面': 'fa-shield-alt'
  }
  return map[dim] || 'fa-circle'
}

function getDimensionColor(dim) {
  const map = {
    '商业化层面': '#007AFF',
    '用户层面': '#34C759',
    '技术层面': '#AF52DE',
    '适配层面': '#FF9500',
    '风险层面': '#FF3B30'
  }
  return map[dim] || '#8E8E93'
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('app-toast')
  const iconMap = { success: 'fa-check-circle', warning: 'fa-exclamation-circle', info: 'fa-info-circle' }
  toast.innerHTML = `<i class="fas ${iconMap[type] || 'fa-info-circle'}"></i> ${msg}`
  toast.className = `toast ${type} show`
  setTimeout(() => toast.classList.remove('show'), 2200)
}

function countUnhandledFlags(project) {
  return project.redFlags.filter(f => f.level === null).length
}

function countPendingDimensions(project) {
  return (project.dimensionBlocks || []).filter(d => d.stance === '待评估').length
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
// 界面1：项目流
// =====================================================

function renderProjectsPage() {
  const projects = AppState.getFilteredProjects()
  document.getElementById('result-count').textContent =
    `共 ${projects.length} 个项目${AppState.filterStatus !== '全部' ? '（已筛选）' : ''}`

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
  const pendingDims = countPendingDimensions(p)
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
          ${pendingDims > 0 ? `
          <div class="project-card-meta-item" style="color:var(--color-orange)">
            <i class="fas fa-question-circle" style="color:var(--color-orange)"></i>
            <span>${pendingDims} 个维度待评估</span>
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
  document.querySelectorAll('.filter-tab[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab[data-status]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      AppState.filterStatus = btn.dataset.status
      renderProjectsPage()
    })
  })

  const newInfoChk = document.getElementById('filter-new-info')
  newInfoChk?.addEventListener('change', () => {
    AppState.filterNewInfo = newInfoChk.checked
    const label = newInfoChk.closest('.filter-checkbox')
    label.classList.toggle('active', newInfoChk.checked)
    renderProjectsPage()
  })

  const searchInput = document.getElementById('search-input')
  let searchTimer
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      AppState.searchKeyword = searchInput.value.trim()
      renderProjectsPage()
    }, 200)
  })

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

  document.getElementById('import-form')?.addEventListener('submit', e => {
    e.preventDefault()
    showToast('机会导入成功！（MVP阶段使用预置数据）', 'success')
    e.target.reset()
  })

  document.getElementById('context-form')?.addEventListener('submit', e => {
    e.preventDefault()
    showToast('决策方现状已保存', 'success')
  })
}

// =====================================================
// 界面3：项目分析判断页（5 Tab）
// =====================================================

function renderAnalysisPage(projectId) {
  const project = AppState.getProject(projectId)
  if (!project) return

  // 面包屑
  document.getElementById('analysis-project-name').textContent = project.name

  // 项目 meta（投入边界 + 状态 badge）
  const metaEl = document.getElementById('analysis-project-meta')
  if (metaEl) {
    metaEl.innerHTML = `
      <span class="badge badge-${project.status}">${project.status}</span>
      <span class="badge badge-boundary-${project.currentBoundary}" style="margin-left:6px">
        <i class="fas ${getBoundaryIcon(project.currentBoundary)}"></i>
        ${project.currentBoundary}
      </span>
    `
  }

  // Tab 状态红点
  renderTabAlerts(project)

  // 切到第一个 Tab
  switchTab('ta', project)
}

function renderTabAlerts(project) {
  // Tab B: 未处理红旗 或 未评估维度
  const tbTab = document.querySelector('.tab-item[data-tab="tb"]')
  const unflagged = project.redFlags.filter(f => f.level === null).length
  const unassessed = (project.dimensionBlocks || []).filter(d => d.stance === '待评估').length
  if (tbTab) tbTab.classList.toggle('has-alert', unflagged > 0 || unassessed > 0)

  // Tab A: 有新信息 或 有未确认条目
  const taTab = document.querySelector('.tab-item[data-tab="ta"]')
  const unconfirmed = (project.infoItems || []).filter(i => !i.userConfirmed).length
  if (taTab) taTab.classList.toggle('has-alert', project.hasNewInfo || unconfirmed > 0)
}

function switchTab(tabId, project) {
  AppState.currentTab = tabId
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'))
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
  document.querySelector(`.tab-item[data-tab="${tabId}"]`)?.classList.add('active')
  document.getElementById(`panel-${tabId}`)?.classList.add('active')

  const renderers = {
    ta: () => renderTabA(project),
    tb: () => renderTabB(project),
    tc: () => renderTabC(project),
    td: () => renderTabD(project),
    te: () => renderTabE(project),
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
// Tab A: 信息搜集与分层
// ─────────────────────────────────────────────────────
function renderTabA(project) {
  const items = project.infoItems || []
  const pendingCount = items.filter(i => !i.userConfirmed).length
  const confirmedCount = items.filter(i => i.userConfirmed).length

  document.getElementById('ta-pending-count').textContent = pendingCount
  document.getElementById('ta-confirmed-count').textContent = confirmedCount

  // 信息条目列表
  const container = document.getElementById('ta-items')
  container.innerHTML = items.map(item => `
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
  const confirmAllBtn = document.getElementById('ta-confirm-all')
  if (confirmAllBtn) {
    // 先移除旧监听，防止重复绑定
    const newBtn = confirmAllBtn.cloneNode(true)
    confirmAllBtn.parentNode.replaceChild(newBtn, confirmAllBtn)
    newBtn.addEventListener('click', () => {
      project.infoItems.forEach(i => i.userConfirmed = true)
      AppState.save()
      showToast('已采纳全部信息', 'success')
      renderTabA(project)
      renderTabAlerts(project)
    })
  }

  // 单条确认
  container.querySelectorAll('.confirm-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = project.infoItems.find(i => i.id === btn.dataset.id)
      if (item) {
        item.userConfirmed = true
        AppState.save()
        renderTabA(project)
        renderTabAlerts(project)
      }
    })
  })

  // 存疑
  container.querySelectorAll('.doubt-item-btn').forEach(btn => {
    btn.addEventListener('click', () => showToast('已标记为存疑（功能完善中）', 'warning'))
  })

  // ─── 分层视图 ───
  const layers = ['公开事实', '发起方主张', '当前未知']
  layers.forEach(layer => {
    const layerItems = items.filter(i => i.layer === layer)
    const col = document.getElementById(`layer-col-${layer}`)
    const countEl = document.getElementById(`layer-count-${layer}`)
    if (countEl) countEl.textContent = layerItems.length
    if (col) {
      col.innerHTML = layerItems.length === 0
        ? `<div style="padding:16px;text-align:center;color:var(--color-text-tertiary);font-size:13px">暂无信息</div>`
        : layerItems.map(item => `
          <div class="layer-item">
            <div>${item.content}</div>
            <div class="layer-item-source">${item.source || ''}</div>
          </div>
        `).join('')
    }
  })

  // 未知项警告
  const unknownItems = items.filter(i => i.layer === '当前未知')
  const warningEl = document.getElementById('ta-unknown-warning')
  if (warningEl) {
    warningEl.style.display = unknownItems.length === 0 ? 'flex' : 'none'
    if (unknownItems.length === 0) {
      warningEl.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="color:var(--color-orange)"></i>
        <p>⚠️ 系统未检测到「当前未知」项。这可能意味着信息过于乐观——请确认是否有重要信息无法从公开渠道获取。</p>
      `
    }
  }

  // ─── 公开证据快照 ───
  const evidenceList = document.getElementById('ta-evidence-list')
  if (evidenceList) {
    const evidence = project.evidence || []
    evidenceList.innerHTML = evidence.length === 0
      ? `<div style="color:var(--color-text-tertiary);font-size:13px;padding:12px 0">暂无公开证据</div>`
      : evidence.map(ev => `
        <div class="evidence-card">
          <div class="evidence-type-icon evidence-type-${ev.type}">
            <i class="fas ${getEvidenceIcon(ev.type)}"></i>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
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
// Tab B: 假设·证据·红旗（使用 dimensionBlocks）
// ─────────────────────────────────────────────────────
function renderTabB(project) {
  const dims = project.dimensionBlocks || []
  const flags = project.redFlags || []

  const unassessed = dims.filter(d => d.stance === '待评估').length
  const unhandled = flags.filter(f => f.level === null).length

  // 进度提示
  const gateEl = document.getElementById('tb-progress-gate')
  if (gateEl) {
    const total = unassessed + unhandled
    if (total > 0) {
      const parts = []
      if (unassessed > 0) parts.push(`<strong>${unassessed} 个维度</strong>尚未给出态度`)
      if (unhandled > 0) parts.push(`<strong>${unhandled} 条红旗</strong>未完成定级`)
      gateEl.className = 'progress-gate'
      gateEl.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <p>${parts.join('，')}——完成后方可生成决策快照。</p>
      `
    } else {
      gateEl.className = 'gate-complete'
      gateEl.innerHTML = `<i class="fas fa-check-circle"></i><p>所有维度已评估，所有红旗已定级！可以进入决策快照。</p>`
    }
  }

  // ─── 渲染维度块 ───
  const dimContainer = document.getElementById('tb-dimensions')
  if (!dimContainer) return

  dimContainer.innerHTML = dims.map(dim => {
    const supportEvs = (project.evidence || []).filter(e => dim.supportingEvidence.includes(e.id))
    const weakenEvs = (project.evidence || []).filter(e => dim.weakeningEvidence.includes(e.id))
    const relFlags = flags.filter(f => dim.relatedFlags.includes(f.id))
    const dimColor = getDimensionColor(dim.dimension)
    const dimIcon = getDimensionIcon(dim.dimension)

    return `
    <div class="dimension-card stance-${dim.stance}" data-id="${dim.id}">
      <div class="dimension-header" onclick="toggleDimension('${dim.id}')">
        <div class="dimension-icon-wrap" style="background:${dimColor}20;color:${dimColor}">
          <i class="fas ${dimIcon}"></i>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
            <span style="font-size:13px;font-weight:700;color:${dimColor}">${dim.dimension}</span>
            <span class="badge badge-stance-${dim.stance}">${dim.stance}</span>
            ${dim.aiGenerated ? '<span style="font-size:11px;color:var(--color-text-tertiary)"><i class="fas fa-robot"></i> AI生成</span>' : ''}
          </div>
          <div style="font-size:13px;color:var(--color-text-secondary);line-height:1.5">
            <strong style="color:var(--color-text-primary)">乐观前提：</strong>${dim.optimisticPremise}
          </div>
        </div>
        <i class="fas fa-chevron-down dim-chevron" id="dim-chevron-${dim.id}" style="color:var(--color-text-tertiary);font-size:12px;transition:transform 0.2s;flex-shrink:0"></i>
      </div>

      <div class="dimension-body" id="dim-body-${dim.id}">
        <!-- 证据摘要 -->
        <div class="dim-section">
          <div class="dim-section-title"><i class="fas fa-search" style="color:var(--color-blue)"></i> 当前证据摘要</div>
          <p style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;margin:0">${dim.evidenceSummary}</p>
        </div>

        <!-- 悖论信号 -->
        ${dim.paradoxSignals && dim.paradoxSignals.length > 0 ? `
        <div class="dim-section">
          <div class="dim-section-title"><i class="fas fa-exclamation-circle" style="color:var(--color-orange)"></i> 悖论信号 <span style="font-size:12px;font-weight:400;color:var(--color-text-tertiary)">与乐观前提矛盾的已知信息</span></div>
          ${dim.paradoxSignals.map(s => `
            <div class="paradox-signal-item">
              <i class="fas fa-minus-circle" style="color:var(--color-orange);flex-shrink:0;margin-top:1px"></i>
              <span>${s}</span>
            </div>
          `).join('')}
        </div>` : ''}

        <!-- 支撑证据 -->
        ${supportEvs.length > 0 ? `
        <div class="dim-section">
          <div class="dim-section-title"><i class="fas fa-check-circle" style="color:var(--color-green)"></i> 支撑证据</div>
          ${supportEvs.map(e => `
            <div class="assumption-evidence-item">
              <i class="fas ${getEvidenceIcon(e.type)}" style="color:var(--color-blue)"></i>
              ${e.title}：${e.summary}
            </div>
          `).join('')}
        </div>` : ''}

        <!-- 削弱证据 -->
        ${weakenEvs.length > 0 ? `
        <div class="dim-section">
          <div class="dim-section-title"><i class="fas fa-times-circle" style="color:var(--color-red)"></i> 削弱证据</div>
          ${weakenEvs.map(e => `
            <div class="assumption-evidence-item" style="color:var(--color-orange)">
              <i class="fas ${getEvidenceIcon(e.type)}" style="color:var(--color-orange)"></i>
              ${e.title}：${e.summary}
            </div>
          `).join('')}
        </div>` : ''}

        <!-- 关联红旗 -->
        ${relFlags.length > 0 ? `
        <div class="dim-section">
          <div class="dim-section-title"><i class="fas fa-flag" style="color:var(--color-red)"></i> 关联红旗</div>
          ${relFlags.map(f => `
            <div class="assumption-evidence-item" style="color:var(--color-red)">
              <i class="fas fa-flag" style="color:var(--color-red)"></i>
              ${f.content}
              ${f.level ? `<span class="badge badge-flag-${f.level}" style="margin-left:6px">${f.level}</span>` : '<span style="font-size:11px;color:var(--color-orange);margin-left:6px">待定级</span>'}
            </div>
          `).join('')}
        </div>` : ''}

        <!-- 用户态度选择 -->
        <div class="dim-stance-area">
          <div class="dim-section-title" style="margin-bottom:8px">
            <i class="fas fa-brain" style="color:var(--color-blue)"></i>
            你的判断：这个维度的前提是否成立？
          </div>
          ${dim.stance === '待评估'
            ? `<div style="font-size:13px;color:var(--color-orange);margin-bottom:8px">⚠️ 请根据以上证据和悖论信号给出你的判断。</div>`
            : `<div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:8px">当前态度：<strong>${dim.stance}</strong>。如需修改，请重新选择。</div>`
          }
          <div class="stance-selector">
            ${['支撑', '存疑', '否定'].map(s => `
              <button class="stance-btn ${dim.stance === s ? `selected-${s}` : ''}"
                      data-dim="${dim.id}" data-stance="${s}">${s}</button>
            `).join('')}
          </div>
          ${dim.stance !== '待评估' ? `
          <div class="gate-complete" style="margin-top:8px;padding:8px 12px">
            <i class="fas fa-check-circle"></i>
            <p>已完成评估 — 态度：${dim.stance}</p>
          </div>` : ''}
        </div>
      </div>
    </div>`
  }).join('')

  // 维度展开/折叠事件
  dimContainer.querySelectorAll('.stance-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const dim = project.dimensionBlocks.find(d => d.id === btn.dataset.dim)
      if (dim) {
        dim.stance = btn.dataset.stance
        project.allDimensionsReviewed = project.dimensionBlocks.every(d => d.stance !== '待评估')
        AppState.save()
        renderTabB(project)
        renderTabAlerts(project)
        showToast(`「${dim.dimension}」已标记为「${btn.dataset.stance}」`, 'success')
      }
    })
  })

  // ─── 渲染红旗汇总 ───
  const flagContainer = document.getElementById('tb-flags')
  if (!flagContainer) return

  if (flags.length === 0) {
    flagContainer.innerHTML = `<div style="color:var(--color-text-tertiary);font-size:13px;padding:12px 0">暂无识别出的红旗</div>`
    return
  }

  flagContainer.innerHTML = flags.map(flag => `
    <div class="redflag-card level-${flag.level}" id="flag-${flag.id}">
      <div class="redflag-icon"><i class="fas fa-flag"></i></div>
      <div class="redflag-body">
        <div class="redflag-content">${flag.content}</div>
        <div class="redflag-category">
          类别：${flag.category} &nbsp;·&nbsp; 关联维度：${(project.dimensionBlocks.find(d => d.id === flag.dimensionId) || {}).dimension || '—'} &nbsp;·&nbsp;
          ${flag.aiGenerated ? 'AI 识别' : '手动添加'}
        </div>
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

  // 红旗级别选择
  flagContainer.querySelectorAll('.flag-level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const flag = project.redFlags.find(f => f.id === btn.dataset.flag)
      if (flag) {
        flag.level = btn.dataset.level
        project.allFlagsTriaged = project.redFlags.every(f => f.level !== null)
        AppState.save()
        renderTabB(project)
        renderTabAlerts(project)
        showToast(`红旗已标记为「${btn.dataset.level}」`, 'success')
      }
    })
  })

  // 解释说明
  flagContainer.querySelectorAll('.flag-note-input').forEach(input => {
    input.addEventListener('blur', () => {
      const flag = project.redFlags.find(f => f.id === input.dataset.flag)
      if (flag) { flag.userNote = input.value; AppState.save() }
    })
  })
}

window.toggleDimension = function(id) {
  const body = document.getElementById(`dim-body-${id}`)
  const chevron = document.getElementById(`dim-chevron-${id}`)
  if (body) {
    const expanded = body.classList.toggle('expanded')
    if (chevron) chevron.style.transform = expanded ? 'rotate(180deg)' : ''
  }
}

// ─────────────────────────────────────────────────────
// Tab C: 决策快照
// ─────────────────────────────────────────────────────
function renderTabC(project) {
  const dims = project.dimensionBlocks || []
  const allDimsDone = dims.every(d => d.stance !== '待评估')
  const allFlagsTriaged = project.redFlags.every(f => f.level !== null)
  const canProceed = allDimsDone && allFlagsTriaged

  const gateEl = document.getElementById('tc-gate')
  if (gateEl) {
    if (!canProceed) {
      const missing = []
      if (!allDimsDone) missing.push('Tab 2：尚有维度未完成评估')
      if (!allFlagsTriaged) missing.push('Tab 2：尚有红旗未定级')
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
    const editor = document.getElementById('tc-editor')
    if (editor) editor.style.display = 'none'
    return
  }

  const editor = document.getElementById('tc-editor')
  if (editor) editor.style.display = 'block'
  const snapDisplay = document.getElementById('tc-snapshot-display')
  if (snapDisplay) snapDisplay.innerHTML = ''

  // AI 推荐边界
  const fatalFlags = project.redFlags.filter(f => f.level === '致命').length
  const deniedDims = dims.filter(d => d.stance === '否定').length
  let suggestedBoundary = '继续观察'
  let suggestionReason = ''
  if (fatalFlags > 0 || deniedDims > 0) {
    suggestedBoundary = '暂不继续'
    suggestionReason = `存在 ${fatalFlags} 个致命红旗、${deniedDims} 个维度被否定`
  } else if (dims.filter(d => d.stance === '存疑').length >= 3) {
    suggestedBoundary = '继续观察'
    suggestionReason = '多个维度仍处于存疑状态，信息不足以推进'
  } else if (dims.filter(d => d.stance === '支撑').length >= 3) {
    suggestedBoundary = '可以接触'
    suggestionReason = '多个关键维度有较强支撑，可进行初步接触验证'
  }

  const aiNotice = document.getElementById('tc-ai-suggestion')
  if (aiNotice) {
    aiNotice.innerHTML = `
      <i class="fas fa-robot"></i>
      <div>
        <strong>AI 建议边界：${suggestedBoundary}</strong>
        <span style="color:var(--color-text-tertiary)">（${suggestionReason || '基于当前证据的保守推断'}）</span>
        <br><span style="font-size:12px">这只是参考——<strong>最终投入边界由你来决定</strong>。</span>
      </div>
    `
  }

  // 边界选择器
  const boundaries = [
    { key: '暂不继续', icon: '🚫', desc: '当前证据不足以支持任何形式投入，等待更多公开信号' },
    { key: '继续观察', icon: '👀', desc: '可持续关注公开信息更新，但暂不主动接触或投入资源' },
    { key: '可以接触', icon: '🤝', desc: '可进行初步接触（如预约 demo），不承诺资源投入' },
    { key: '可以投入有限试点', icon: '🚀', desc: '在明确的资源上限内，可投入试点预算和有限实施时间' }
  ]

  const selectorEl = document.getElementById('tc-boundary-selector')
  if (selectorEl) {
    selectorEl.innerHTML = boundaries.map(b => `
      <div class="boundary-option ${project.currentBoundary === b.key ? `selected-${b.key}` : ''}"
           data-boundary="${b.key}" onclick="selectBoundaryC('${b.key}')">
        <div class="boundary-option-icon">${b.icon}</div>
        <div class="boundary-option-label">${b.key}</div>
        <div class="boundary-option-desc">${b.desc}</div>
      </div>
    `).join('')
  }

  // 维度状态摘要
  const dimSummary = document.getElementById('tc-dimensions-summary')
  if (dimSummary) {
    dimSummary.innerHTML = dims.map(d => `
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-size:13px">
        <span class="badge badge-stance-${d.stance}" style="flex-shrink:0">${d.stance}</span>
        <span style="font-weight:600;color:${getDimensionColor(d.dimension)};flex-shrink:0">${d.dimension}</span>
        <span style="color:var(--color-text-secondary)">${d.optimisticPremise}</span>
      </div>
    `).join('')
  }

  // 绑定生成按钮
  const genBtn = document.getElementById('tc-generate-snapshot')
  if (genBtn) {
    const newBtn = genBtn.cloneNode(true)
    genBtn.parentNode.replaceChild(newBtn, genBtn)
    newBtn.addEventListener('click', generateSnapshot)
  }
}

window.selectBoundaryC = function(boundary) {
  const project = AppState.getProject(AppState.currentProjectId)
  if (project) {
    project.currentBoundary = boundary
    AppState.save()
    renderTabC(project)
    showToast(`投入边界已设为「${boundary}」`, 'success')
  }
}

function generateSnapshot() {
  const project = AppState.getProject(AppState.currentProjectId)
  if (!project) return
  if (!project.redFlags.every(f => f.level !== null)) {
    showToast('请先完成 Tab 2 红旗定级', 'warning'); return
  }

  const snapshot = {
    id: `snapshot-${Date.now()}`,
    createdAt: new Date().toLocaleDateString('zh-CN'),
    boundary: project.currentBoundary,
    keyDimensions: (project.dimensionBlocks || []).map(d => d.id),
    modificationTriggers: {
      upgrade: document.getElementById('tc-trigger-upgrade')?.value || '若关键维度得到独立验证，可升级至上一层边界',
      pause: document.getElementById('tc-trigger-pause')?.value || '若出现致命红旗或关键维度被否定，立即暂停',
      exit: document.getElementById('tc-trigger-exit')?.value || '项目方停止更新超过 3 个月'
    },
    reviewDate: document.getElementById('tc-review-date')?.value || '2026-05-01',
    frozenAt: new Date().toLocaleDateString('zh-CN')
  }

  project.decisionSnapshot = snapshot
  if (project.status === '未支持') project.status = '支持中'
  AppState.save()
  showToast('决策快照已生成并冻结 🎉', 'success')
  renderTabC(project)
}

function renderFrozenSnapshot(project) {
  const snap = project.decisionSnapshot
  const container = document.getElementById('tc-snapshot-display')
  if (!container) return

  const keyDims = (project.dimensionBlocks || []).filter(d => snap.keyDimensions.includes(d.id))

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
          <div class="snapshot-section-title">各维度态度</div>
          ${keyDims.map(d => `
            <div class="snapshot-item">
              <i class="fas ${getDimensionIcon(d.dimension)}" style="color:${getDimensionColor(d.dimension)}"></i>
              <span>[${d.stance}] <strong>${d.dimension}</strong>：${d.optimisticPremise.slice(0,40)}…</span>
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
    renderTabC(project)
  }
}

// ─────────────────────────────────────────────────────
// Tab D: 跟踪信号
// ─────────────────────────────────────────────────────
function renderTabD(project) {
  const container = document.getElementById('td-signals')

  if (!project.decisionSnapshot) {
    container.innerHTML = `
      <div class="progress-gate">
        <i class="fas fa-lock"></i>
        <p>请先在「决策快照」Tab 生成快照，再开始跟踪信号。</p>
      </div>`
    return
  }

  if (!project.trackingSignals || project.trackingSignals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-satellite-dish"></i>
        <p>暂无跟踪信号，可在决策快照后添加</p>
      </div>`
    return
  }

  container.innerHTML = project.trackingSignals.map(signal => {
    const dim = (project.dimensionBlocks || []).find(d => d.id === signal.dimensionId)
    return `
      <div class="signal-card">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span class="badge badge-signal-${signal.status}">${signal.status}</span>
            ${dim ? `<span style="font-size:12px;color:${getDimensionColor(dim.dimension)};font-weight:600">
              <i class="fas ${getDimensionIcon(dim.dimension)}"></i> ${dim.dimension}
            </span>` : ''}
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
        renderTabD(project)
        showToast(`信号状态已更新为「${btn.dataset.status}」`, 'success')
      }
    })
  })
}

// ─────────────────────────────────────────────────────
// Tab E: 复盘归档
// ─────────────────────────────────────────────────────
function renderTabE(project) {
  const container = document.getElementById('te-reviews')

  if (!project.reviewNotes || project.reviewNotes.length === 0) {
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
  const newReviewEl = document.getElementById('te-new-review')
  if (newReviewEl) {
    newReviewEl.innerHTML = `
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
            请独立思考：哪个维度或红旗当时没有被正确处理？是什么导致了边界判断偏差？
            不要只写结果，要写出推理过程。
          </div>
          <textarea id="wrong-analysis-text" rows="4"
            placeholder="例如：当时把发起方主张误判为公开事实，导致商业化维度被标记为支撑，实际上该证据强度不够…"></textarea>
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
  renderTabE(project)
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

  initProjectsFilters()
  initAdminNav()
  initTabNav()

  // 默认进入项目流
  navigateTo('projects')
})
