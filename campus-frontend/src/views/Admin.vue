<template>
  <div class="admin-page">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>

    <el-container class="admin-shell">
      <el-aside class="admin-aside" width="260px">
        <div class="brand-block">
          <div class="brand-mark">A</div>
          <div>
            <div class="brand-title">Admin Console</div>
            <div class="brand-subtitle">Campus Hub Control Room</div>
          </div>
        </div>

        <el-menu
          :default-active="activeSection"
          class="admin-menu"
          background-color="transparent"
          text-color="#475569"
          active-text-color="#2563eb"
          @select="activeSection = $event"
        >
          <el-menu-item index="overview">
            <el-icon><DataLine /></el-icon>
            <span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="posts">
            <el-icon><Document /></el-icon>
            <span>内容审核</span>
          </el-menu-item>
          <el-menu-item index="resetRequests">
            <el-icon><ChatDotSquare /></el-icon>
            <span>密码申诉</span>
          </el-menu-item>
          <el-menu-item index="publish">
            <el-icon><EditPen /></el-icon>
            <span>内容发布</span>
          </el-menu-item>
          <el-menu-item index="announcements">
            <el-icon><Bell /></el-icon>
            <span>公告管理</span>
          </el-menu-item>
        </el-menu>

        <div class="aside-footer">
          <div class="assistant-card">
            <div class="assistant-label">当前登录</div>
            <div class="assistant-name">{{ currentUser?.nickname || currentUser?.username || '管理员' }}</div>
            <el-tag type="danger" effect="dark" round>Admin</el-tag>
          </div>

          <el-button type="primary" class="home-btn" @click="router.push('/home')">
            返回前台
          </el-button>
        </div>
      </el-aside>

      <el-container class="admin-main-wrap">
        <el-header class="admin-topbar">
          <div>
            <div class="page-kicker">Dashboard</div>
            <h1 class="page-title">{{ sectionTitle }}</h1>
          </div>
          <div class="topbar-actions">
            <el-button plain @click="refreshAll" :loading="loading">
              <el-icon><RefreshRight /></el-icon>
              刷新数据
            </el-button>
            <el-button type="danger" plain @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出
            </el-button>
          </div>
        </el-header>

        <el-main class="admin-main">
          <section v-if="activeSection === 'overview'" class="overview-section">
            <div class="stats-grid">
              <el-card v-for="item in statCards" :key="item.label" class="stat-card" shadow="never">
                <div class="stat-label">{{ item.label }}</div>
                <div class="stat-value">{{ item.value }}</div>
                <div class="stat-hint">{{ item.hint }}</div>
              </el-card>
            </div>

            <div class="overview-grid">
              <el-card class="panel-card overview-panel" shadow="never">
                <template #header>
                  <div class="panel-header">
                    <span>内容分布</span>
                    <el-tag type="warning" effect="plain">全站内容总览</el-tag>
                  </div>
                </template>

                <div class="breakdown-list">
                  <div v-for="item in contentBreakdown" :key="item.label" class="breakdown-item">
                    <div class="breakdown-head">
                      <div>
                        <div class="breakdown-label">{{ item.label }}</div>
                        <div class="breakdown-meta">{{ item.count }} 条</div>
                      </div>
                      <div class="breakdown-ratio">{{ item.ratio }}%</div>
                    </div>
                    <el-progress :percentage="item.ratio" :stroke-width="10" :color="item.color" />
                  </div>
                </div>
              </el-card>

              <el-card class="panel-card overview-panel" shadow="never">
                <template #header>
                  <div class="panel-header">
                    <span>待处理事项</span>
                    <el-tag type="danger" effect="plain">需要关注</el-tag>
                  </div>
                </template>

                <el-empty v-if="pendingActions.length === 0" description="当前没有需要立即处理的事项" :image-size="110" />

                <div v-else class="pending-list">
                  <div v-for="item in pendingActions" :key="item.label" class="pending-item" :class="item.level">
                    <div class="pending-title-row">
                      <span class="pending-title">{{ item.label }}</span>
                      <el-tag :type="item.tagType" effect="dark" size="small">{{ item.badge }}</el-tag>
                    </div>
                    <div class="pending-desc">{{ item.description }}</div>
                  </div>
                </div>

                <div class="shortcut-actions">
                  <el-button type="primary" plain @click="activeSection = 'publish'">发布内容</el-button>
                  <el-button plain @click="activeSection = 'posts'">内容审核</el-button>
                  <el-button plain @click="activeSection = 'users'">用户管理</el-button>
                  <el-button plain @click="activeSection = 'resetRequests'">密码申诉</el-button>
                </div>
              </el-card>
            </div>

            

            <div class="overview-grid trend-log-grid">
              <el-card class="panel-card overview-panel" shadow="never">
                <template #header>
                  <div class="panel-header">
                    <span>最近7天趋势</span>
                    <el-tag type="success" effect="plain">每日新增内容</el-tag>
                  </div>
                </template>

                <el-empty v-if="trendViewData.length === 0" description="暂无趋势数据" :image-size="100" />

                <div v-else class="trend-chart">
                  <div v-for="item in trendViewData" :key="item.date" class="trend-col">
                    <div class="trend-bar-wrap">
                      <div class="trend-bar" :style="{ height: `${item.ratio}%` }"></div>
                    </div>
                    <div class="trend-value">{{ item.totalContent }}</div>
                    <div class="trend-label">{{ item.shortDate }}</div>
                  </div>
                </div>

                <div class="trend-legend">
                  <span>总量：{{ stats.totalContent || 0 }}</span>
                  <span>7日新增：{{ sevenDayNewContent }}</span>
                </div>
              </el-card>

              <el-card class="panel-card overview-panel" shadow="never">
                <template #header>
                  <div class="panel-header">
                    <span>操作日志</span>
                    <el-tag type="info" effect="plain">最近20条</el-tag>
                  </div>
                </template>

                <el-empty v-if="operationLogs.length === 0" description="暂无操作日志" :image-size="100" />

                <div v-else class="log-list">
                  <div v-for="(log, index) in operationLogs" :key="`${log.actionTime}-${index}`" class="log-item">
                    <div class="log-head">
                      <el-tag size="small" effect="plain">{{ log.actionType }}</el-tag>
                      <span class="log-time">{{ formatDateTime(log.actionTime) }}</span>
                    </div>
                    <div class="log-detail">{{ log.detail }}</div>
                  </div>
                </div>
              </el-card>
            </div>
          </section>

          <section v-else-if="activeSection === 'users'" class="table-section">
            <el-card class="panel-card" shadow="never">
              <template #header>
                <div class="panel-header">
                  <span>用户检索</span>
                  <div class="inline-actions">
                    <el-input v-model="userFilters.keyword" placeholder="学号 / 昵称 / 专业 / 技能" clearable class="search-input" />
                    <el-select v-model="userFilters.status" placeholder="账号状态" clearable class="filter-select">
                      <el-option label="正常" :value="'1'" />
                      <el-option label="封禁" :value="'0'" />
                    </el-select>
                    <el-button type="warning" plain @click="openCreateAdminDialog">创建管理员</el-button>
                    <el-button type="primary" @click="loadUsers" :loading="usersLoading">搜索</el-button>
                  </div>
                </div>
              </template>

              <el-table :data="users" v-loading="usersLoading" stripe class="data-table" :row-key="row => row.id">
                <el-table-column prop="username" label="学号 / 账号" min-width="140" />
                <el-table-column prop="nickname" label="昵称" min-width="120" />
                <el-table-column prop="major" label="专业" min-width="160" show-overflow-tooltip />
                <el-table-column prop="created_at" label="注册时间" min-width="180" />
                <el-table-column label="身份" width="110">
                  <template #default="scope">
                    <el-tag :type="Number(scope.row.role) === 1 ? 'danger' : 'success'" effect="dark">
                      {{ Number(scope.row.role) === 1 ? '管理员' : '用户' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="140">
                  <template #default="scope">
                    <el-switch
                      :model-value="Number(scope.row.status) === 1"
                      active-text="正常"
                      inactive-text="封禁"
                      inline-prompt
                      @change="value => handleUserStatusToggle(scope.row, value)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="220" fixed="right">
                  <template #default="scope">
                    <div class="user-actions">
                      <el-button size="small" type="danger" plain @click="toggleUserStatusQuick(scope.row)">
                        {{ Number(scope.row.status) === 1 ? '封禁' : '解封' }}
                      </el-button>
                      <el-button size="small" type="warning" plain @click="handleResetUserPassword(scope.row)">
                        重置密码
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>

              <div class="pagination-row" v-if="userPagination.total > 0">
                <el-pagination
                  v-model:current-page="userPagination.page"
                  v-model:page-size="userPagination.limit"
                  :page-sizes="[10, 20, 50, 100]"
                  background
                  layout="total, sizes, prev, pager, next"
                  :total="userPagination.total"
                  @size-change="handleUserPageSizeChange"
                  @current-change="handleUserPageChange"
                />
              </div>
            </el-card>
          </section>

          <section v-else-if="activeSection === 'posts'" class="table-section">
            <el-card class="panel-card" shadow="never">
              <template #header>
                <div class="panel-header">
                  <span>帖子检索</span>
                  <div class="inline-actions">
                    <el-input v-model="postFilters.keyword" placeholder="关键词：标题 / 内容 / 作者" clearable class="search-input" />
                    <el-input v-model="postFilters.username" placeholder="发帖人学号" clearable class="filter-select" />
                    <el-button type="primary" @click="loadPosts" :loading="postsLoading">搜索</el-button>
                  </div>
                </div>
              </template>

              <el-table :data="posts" v-loading="postsLoading" stripe class="data-table" :row-key="row => row.id">
                <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
                <el-table-column prop="author_username" label="作者学号" min-width="120" />
                <el-table-column prop="author_nickname" label="作者昵称" min-width="120" />
                <el-table-column prop="category_name" label="分类" min-width="120" />
                <el-table-column prop="created_at" label="发布时间" min-width="180" />
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="scope">
                    <el-button size="small" type="danger" plain @click="handleDeletePost(scope.row)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div class="pagination-row" v-if="postPagination.total > 0">
                <el-pagination
                  v-model:current-page="postPagination.page"
                  v-model:page-size="postPagination.limit"
                  :page-sizes="[10, 20, 50, 100]"
                  background
                  layout="total, sizes, prev, pager, next"
                  :total="postPagination.total"
                  @size-change="handlePostPageSizeChange"
                  @current-change="handlePostPageChange"
                />
              </div>
            </el-card>
          </section>

          <section v-else-if="activeSection === 'resetRequests'" class="table-section">
            <el-card class="panel-card" shadow="never">
              <template #header>
                <div class="panel-header">
                  <span>找回密码留言</span>
                  <div class="inline-actions">
                    <el-input v-model="resetRequestFilters.keyword" placeholder="按账号或留言关键字搜索" clearable class="search-input" />
                    <el-select v-model="resetRequestFilters.status" placeholder="处理状态" clearable class="filter-select">
                      <el-option label="待处理" value="pending" />
                      <el-option label="已处理" value="processed" />
                    </el-select>
                    <el-button type="primary" @click="loadResetRequests" :loading="resetRequestsLoading">搜索</el-button>
                  </div>
                </div>
              </template>

              <el-table :data="resetRequests" v-loading="resetRequestsLoading" stripe class="data-table" :row-key="row => row.id">
                <el-table-column prop="username" label="账号" min-width="130" />
                <el-table-column label="留言内容" min-width="260">
                  <template #default="scope">
                    <div class="request-message">{{ scope.row.message }}</div>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="提交时间" min-width="180" />
                <el-table-column label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'processed' ? 'success' : 'warning'" effect="dark">
                      {{ scope.row.status === 'processed' ? '已处理' : '待处理' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="admin_note" label="处理备注" min-width="160" show-overflow-tooltip />
                <el-table-column label="操作" width="180" fixed="right">
                  <template #default="scope">
                    <div class="user-actions">
                      <el-button
                        size="small"
                        type="success"
                        plain
                        :disabled="scope.row.status === 'processed'"
                        @click="handleProcessResetRequest(scope.row)"
                      >
                        标记已处理
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </section>

          <section v-else-if="activeSection === 'publish'" class="table-section">
            <el-card class="panel-card" shadow="never">
              <template #header>
                <div class="panel-header">
                  <span>管理员发布内容</span>
                  <el-tag type="warning" effect="plain">免 Navicat 直发</el-tag>
                </div>
              </template>

              <el-alert
                title="发布后会立即在对应前台页面显示，请确认分类与链接无误"
                type="info"
                :closable="false"
                show-icon
                style="margin-bottom: 16px;"
              />

              <el-tabs v-model="publishTab" class="publish-tabs">
                <el-tab-pane label="个人提升资源" name="resource">
                  <el-form :model="resourceForm" label-position="top" class="publish-form-grid">
                    <el-form-item label="资源标题">
                      <el-input v-model="resourceForm.title" maxlength="100" show-word-limit placeholder="例如：Java面试高频题精讲" />
                    </el-form-item>
                    <el-form-item label="资源分类">
                      <el-select v-model="resourceForm.type" placeholder="请选择分类">
                        <el-option v-for="item in resourceTypeOptions" :key="item" :label="item" :value="item" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="资源链接" class="full-width">
                      <el-input v-model="resourceForm.url" placeholder="https://..." />
                    </el-form-item>
                    <el-form-item label="上传资源文件（可选）" class="full-width">
                      <el-upload
                        :action="adminUploadAction"
                        :headers="uploadHeaders"
                        :show-file-list="false"
                        :before-upload="beforeResourceFileUpload"
                        :on-success="handleResourceFileUploadSuccess"
                        :on-error="handleResourceFileUploadError"
                      >
                        <el-button type="primary" plain :loading="resourceFileUploading">上传文件并自动填入链接</el-button>
                      </el-upload>
                      <div class="upload-tip">支持图片、PDF、Office、TXT、ZIP/RAR/7Z，单文件不超过 50MB</div>
                    </el-form-item>
                    <el-form-item label="资源简介" class="full-width">
                      <el-input v-model="resourceForm.description" type="textarea" :rows="3" maxlength="255" show-word-limit />
                    </el-form-item>
                    <el-form-item label="文件格式（可选）">
                      <el-input v-model="resourceForm.fileFormat" maxlength="20" placeholder="例如：PDF / 视频" />
                    </el-form-item>
                    <el-form-item label="文件大小（可选）">
                      <el-input v-model="resourceForm.fileSize" maxlength="50" placeholder="例如：120MB" />
                    </el-form-item>
                    <el-form-item label="封面链接（可选）" class="full-width">
                      <el-input v-model="resourceForm.cover" placeholder="https://..." />
                    </el-form-item>
                  </el-form>
                  <div class="publish-actions">
                    <el-button @click="resetResourceForm">重置</el-button>
                    <el-button type="primary" :loading="publishLoading" @click="handlePublishResource">发布资源</el-button>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="升学考公资料" name="study">
                  <el-form :model="studyForm" label-position="top" class="publish-form-grid">
                    <el-form-item label="资料标题">
                      <el-input v-model="studyForm.title" maxlength="100" show-word-limit placeholder="例如：2027考研英语真题精讲" />
                    </el-form-item>
                    <el-form-item label="资料分类">
                      <el-select v-model="studyForm.category" placeholder="请选择分类">
                        <el-option v-for="item in studyCategoryOptions" :key="item" :label="item" :value="item" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="文件类型">
                      <el-input v-model="studyForm.fileType" maxlength="20" placeholder="例如：PDF / 视频" />
                    </el-form-item>
                    <el-form-item label="资料链接" class="full-width">
                      <el-input v-model="studyForm.downloadUrl" placeholder="https://..." />
                    </el-form-item>
                    <el-form-item label="上传资料文件（可选）" class="full-width">
                      <el-upload
                        :action="adminUploadAction"
                        :headers="uploadHeaders"
                        :show-file-list="false"
                        :before-upload="beforeStudyFileUpload"
                        :on-success="handleStudyFileUploadSuccess"
                        :on-error="handleStudyFileUploadError"
                      >
                        <el-button type="primary" plain :loading="studyFileUploading">上传文件并自动填入链接</el-button>
                      </el-upload>
                      <div class="upload-tip">上传成功后会自动填入资料链接与文件类型</div>
                    </el-form-item>
                    <el-form-item label="资料简介" class="full-width">
                      <el-input v-model="studyForm.description" type="textarea" :rows="3" maxlength="255" show-word-limit />
                    </el-form-item>
                  </el-form>
                  <div class="publish-actions">
                    <el-button @click="resetStudyForm">重置</el-button>
                    <el-button type="primary" :loading="publishLoading" @click="handlePublishStudy">发布资料</el-button>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="招聘与面经" name="career">
                  <el-form :model="careerForm" label-position="top" class="publish-form-grid">
                    <el-form-item label="公司 / 平台">
                      <el-input v-model="careerForm.company" maxlength="100" show-word-limit placeholder="例如：腾讯" />
                    </el-form-item>
                    <el-form-item label="信息类型">
                      <el-select v-model="careerForm.type" placeholder="请选择类型">
                        <el-option v-for="item in careerTypeOptions" :key="item" :label="item" :value="item" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="标题" class="full-width">
                      <el-input v-model="careerForm.title" maxlength="100" show-word-limit placeholder="例如：2027届校招内推-后台开发" />
                    </el-form-item>
                    <el-form-item label="内容详情" class="full-width">
                      <el-input v-model="careerForm.content" type="textarea" :rows="4" maxlength="5000" show-word-limit />
                    </el-form-item>
                    <el-form-item label="标签（可选）">
                      <el-input v-model="careerForm.tags" maxlength="255" placeholder="例如：Java,后端,内推" />
                    </el-form-item>
                    <el-form-item label="联系方式（可选）">
                      <el-input v-model="careerForm.contact" maxlength="100" placeholder="邮箱 / 链接 / 内推码" />
                    </el-form-item>
                  </el-form>
                  <div class="publish-actions">
                    <el-button @click="resetCareerForm">重置</el-button>
                    <el-button type="primary" :loading="publishLoading" @click="handlePublishCareer">发布信息</el-button>
                  </div>
                </el-tab-pane>

              </el-tabs>
            </el-card>
          </section>

          <!-- 公告管理 -->
          <section v-else-if="activeSection === 'announcements'" class="table-section">
            <el-card class="panel-card" shadow="never">
              <template #header>
                <div class="panel-header">
                  <span>公告管理</span>
                  <div class="inline-actions">
                    <el-tag type="info" effect="plain">共 {{ announcementTotal }} 条</el-tag>
                    <el-button type="primary" @click="openAnnouncementEditDialog()">新增公告</el-button>
                  </div>
                </div>
              </template>

              <el-table :data="announcementList" v-loading="announcementLoading" stripe class="data-table">
                <el-table-column prop="id" label="ID" width="70" />
                <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
                <el-table-column prop="content" label="内容摘要" min-width="200" show-overflow-tooltip>
                  <template #default="{ row }">
                    {{ (row.content || '').slice(0, 40) }}{{ (row.content || '').length > 40 ? '...' : '' }}
                  </template>
                </el-table-column>
                <el-table-column label="置顶" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.is_pinned ? 'danger' : 'info'" effect="plain" size="small">
                      {{ row.is_pinned ? '置顶' : '普通' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="发布时间" width="170">
                  <template #default="{ row }">
                    {{ formatDateTime(row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="270" fixed="right">
                  <template #default="{ row }">
                    <el-button size="small" type="primary" plain @click="openAnnouncementEditDialog(row)">编辑</el-button>
                    <el-button
                      size="small"
                      :type="row.is_pinned ? 'warning' : 'success'"
                      plain
                      @click="toggleAnnouncementPin(row)"
                    >
                      {{ row.is_pinned ? '取消置顶' : '置顶' }}
                    </el-button>
                    <el-button size="small" type="danger" plain @click="deleteAnnouncement(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div class="pagination-row" v-if="announcementTotal > 0">
                <el-pagination
                  v-model:current-page="announcementPage"
                  v-model:page-size="announcementPageSize"
                  :page-sizes="[10, 20, 50]"
                  background
                  layout="total, sizes, prev, pager, next"
                  :total="announcementTotal"
                  @size-change="loadAnnouncementList"
                  @current-change="loadAnnouncementList"
                />
              </div>
            </el-card>
          </section>

          <!-- 公告编辑弹窗 -->
          <el-dialog
            v-model="announcementEditDialogVisible"
            :title="announcementEditId ? '编辑公告' : '新增公告'"
            width="600px"
            destroy-on-close
          >
            <el-form :model="announcementEditForm" label-position="top">
              <el-form-item label="公告标题">
                <el-input v-model="announcementEditForm.title" maxlength="100" show-word-limit placeholder="请输入公告标题" />
              </el-form-item>
              <el-form-item label="公告内容">
                <el-input
                  v-model="announcementEditForm.content"
                  type="textarea"
                  :rows="6"
                  maxlength="2000"
                  show-word-limit
                  placeholder="请输入公告内容"
                />
              </el-form-item>
              <el-form-item label="是否置顶">
                <el-switch v-model="announcementEditForm.isPinned" inline-prompt active-text="置顶" inactive-text="普通" />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="announcementEditDialogVisible = false">取消</el-button>
              <el-button type="primary" :loading="announcementSaving" @click="saveAnnouncement">
                {{ announcementEditId ? '保存修改' : '发布公告' }}
              </el-button>
            </template>
          </el-dialog>

          <el-dialog v-model="createAdminDialogVisible" title="创建管理员账号" width="560px" destroy-on-close>
            <el-alert
              type="warning"
              title="该操作会授予后台管理权限，请谨慎执行"
              :closable="false"
              show-icon
              style="margin-bottom: 14px;"
            />

            <el-form :model="createAdminForm" label-position="top">
              <el-form-item label="新管理员账号（学号）">
                <el-input v-model="createAdminForm.username" maxlength="50" placeholder="例如：20260001" />
              </el-form-item>
              <el-form-item label="新管理员昵称">
                <el-input v-model="createAdminForm.nickname" maxlength="50" placeholder="例如：系统管理员-张三" />
              </el-form-item>
              <el-form-item label="新管理员密码">
                <el-input
                  v-model="createAdminForm.password"
                  type="password"
                  show-password
                  autocomplete="new-password"
                  placeholder="8-50位，含大小写字母、数字和特殊字符"
                />
              </el-form-item>
              <el-form-item label="确认新管理员密码">
                <el-input
                  v-model="createAdminForm.confirmPassword"
                  type="password"
                  show-password
                  autocomplete="new-password"
                  placeholder="再次输入新管理员密码"
                />
              </el-form-item>
              <el-form-item label="当前管理员密码（用于授权验证）">
                <el-input
                  v-model="createAdminForm.currentAdminPassword"
                  type="password"
                  show-password
                  autocomplete="current-password"
                  placeholder="请输入你当前账号密码"
                />
              </el-form-item>
              <el-form-item label="确认口令（必须输入 CREATE_ADMIN）">
                <el-input v-model="createAdminForm.confirmText" placeholder="CREATE_ADMIN" maxlength="32" />
              </el-form-item>
            </el-form>

            <template #footer>
              <el-button @click="createAdminDialogVisible = false">取消</el-button>
              <el-button type="danger" :loading="createAdminLoading" @click="handleCreateAdmin">确认创建</el-button>
            </template>
          </el-dialog>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request, { API_BASE_URL } from '../utils/request'

const router = useRouter()
const activeSection = ref('overview')
const loading = ref(false)
const usersLoading = ref(false)
const postsLoading = ref(false)
const resetRequestsLoading = ref(false)
const publishLoading = ref(false)
const resourceFileUploading = ref(false)
const studyFileUploading = ref(false)
const createAdminDialogVisible = ref(false)
const createAdminLoading = ref(false)
const currentUser = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const publishTab = ref('resource')
const adminUploadAction = `${API_BASE_URL}/api/admin/upload-file`

const resourceTypeOptions = ['编程开发', '创意设计', '办公效率']
const studyCategoryOptions = ['考研资料', '考公资料', '四六级']
const careerTypeOptions = ['校招内推', '实习机会', '面试经验']

// 公告管理状态
const announcementList = ref([])
const announcementLoading = ref(false)
const announcementSaving = ref(false)
const announcementPage = ref(1)
const announcementPageSize = ref(20)
const announcementTotal = ref(0)
const announcementEditDialogVisible = ref(false)
const announcementEditId = ref(null)
const announcementEditForm = reactive({
  title: '',
  content: '',
  isPinned: false
})

const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  bannedUsers: 0,
  adminUsers: 0,
  totalPosts: 0,
  todayPosts: 0,
  totalResources: 0,
  totalStudyMaterials: 0,
  totalCareerItems: 0,
  totalContent: 0,
  pendingResetRequests: 0,
  trend7Days: [],
  operationLogs: []
})

const users = ref([])
const posts = ref([])
const resetRequests = ref([])
const userPagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})
const postPagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const userFilters = reactive({
  keyword: '',
  status: ''
})

const postFilters = reactive({
  keyword: '',
  username: ''
})

const resetRequestFilters = reactive({
  keyword: '',
  status: ''
})

const resourceForm = reactive({
  title: '',
  description: '',
  type: '编程开发',
  url: '',
  fileFormat: '',
  fileSize: '',
  cover: ''
})

const studyForm = reactive({
  title: '',
  description: '',
  category: '考研资料',
  fileType: 'PDF',
  downloadUrl: ''
})

const careerForm = reactive({
  company: '',
  title: '',
  type: '校招内推',
  content: '',
  tags: '',
  contact: ''
})

const createAdminForm = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  currentAdminPassword: '',
  confirmText: ''
})

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`
}))

const sectionTitle = computed(() => {
  const mapping = {
    overview: '数据看板',
    users: '用户管理',
    posts: '内容审核',
    resetRequests: '密码申诉',
    publish: '内容发布',
    announcements: '公告管理'
  }
  return mapping[activeSection.value] || '管理员后台'
})

const statCards = computed(() => ([
  { label: '总用户数', value: stats.value.totalUsers, hint: '平台账号总量' },
  { label: '正常用户', value: stats.value.activeUsers, hint: '当前可访问账号' },
  { label: '封禁账号', value: stats.value.bannedUsers, hint: '已限制登录账号' },
  { label: '管理员', value: stats.value.adminUsers, hint: '后台可用账号' },
  { label: '总帖子数', value: stats.value.totalPosts, hint: '全站内容库存' },
  { label: '今日新增', value: stats.value.todayPosts, hint: '当天发布帖子' },
  { label: '资源数量', value: stats.value.totalResources, hint: '个人提升资源' },
  { label: '资料数量', value: stats.value.totalStudyMaterials, hint: '升学考公资料' },
  { label: '招聘信息', value: stats.value.totalCareerItems, hint: '实习/面经内容' },
  { label: '待处理申诉', value: stats.value.pendingResetRequests, hint: '密码找回留言' }
]))

const contentBreakdown = computed(() => {
  const items = [
    { label: '论坛帖子', count: Number(stats.value.totalPosts || 0), color: '#409EFF' },
    { label: '个人提升资源', count: Number(stats.value.totalResources || 0), color: '#9C27B0' },
    { label: '升学考公资料', count: Number(stats.value.totalStudyMaterials || 0), color: '#67C23A' },
    { label: '招聘与面经', count: Number(stats.value.totalCareerItems || 0), color: '#E6A23C' }
  ]

  const backendTotal = Number(stats.value.totalContent || 0)
  const itemsTotal = items.reduce((sum, item) => sum + item.count, 0)
  const total = Math.max(backendTotal || itemsTotal, 1)

  return items.map((item) => ({
    ...item,
    ratio: Math.min(100, Math.max(0, Number(((item.count / total) * 100).toFixed(1))))
  }))
})

const pendingActions = computed(() => {
  const actions = []

  if (Number(stats.value.pendingResetRequests || 0) > 0) {
    actions.push({
      label: '密码申诉待处理',
      badge: `${stats.value.pendingResetRequests} 条`,
      tagType: 'danger',
      level: 'urgent',
      description: '有用户提交了找回密码留言，需要管理员尽快审核并处理。'
    })
  }

  if (Number(stats.value.bannedUsers || 0) > 0) {
    actions.push({
      label: '封禁账号复核',
      badge: `${stats.value.bannedUsers} 个`,
      tagType: 'warning',
      level: 'warning',
      description: '当前存在被封禁账号，建议结合用户检索确认是否需要复核。'
    })
  }

  if (Number(stats.value.todayPosts || 0) > 0) {
    actions.push({
      label: '今日新增内容',
      badge: `${stats.value.todayPosts} 条`,
      tagType: 'success',
      level: 'info',
      description: '今天平台已有新的帖子发布，可前往内容审核查看详情。'
    })
  }

  return actions
})

const trendViewData = computed(() => {
  const raw = Array.isArray(stats.value.trend7Days) ? stats.value.trend7Days : []
  if (raw.length === 0) return []

  const safeRows = raw.map((item) => ({
    date: item.date,
    shortDate: String(item.date || '').slice(5),
    totalContent: Number(item.totalContent || 0)
  }))

  const maxValue = Math.max(...safeRows.map((item) => item.totalContent), 1)

  return safeRows.map((item) => ({
    ...item,
    ratio: Math.max(10, Number(((item.totalContent / maxValue) * 100).toFixed(1)))
  }))
})

const sevenDayNewContent = computed(() => {
  return trendViewData.value.reduce((sum, item) => sum + Number(item.totalContent || 0), 0)
})

const operationLogs = computed(() => {
  return Array.isArray(stats.value.operationLogs) ? stats.value.operationLogs : []
})

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const refreshCurrentUser = () => {
  try {
    currentUser.value = JSON.parse(localStorage.getItem('user') || 'null')
  } catch (error) {
    currentUser.value = null
  }
}

const loadStats = async () => {
  try {
    const res = await request.get('/api/admin/stats')
    if (res.data.code === 200) {
      stats.value = {
        ...stats.value,
        ...res.data.data,
        trend7Days: Array.isArray(res.data.data?.trend7Days) ? res.data.data.trend7Days : [],
        operationLogs: Array.isArray(res.data.data?.operationLogs) ? res.data.data.operationLogs : []
      }
    }
  } catch (error) {
    handleAdminApiError(error)
  }
}

const loadUsers = async () => {
  usersLoading.value = true
  try {
    const res = await request.get('/api/admin/users', {
      params: {
        keyword: userFilters.keyword,
        status: userFilters.status,
        page: userPagination.page,
        limit: userPagination.limit
      }
    })
    if (res.data.code === 200) {
      users.value = res.data.data
      userPagination.total = Number(res.data.total || 0)
    }
  } catch (error) {
    users.value = []
    userPagination.total = 0
    handleAdminApiError(error)
  } finally {
    usersLoading.value = false
  }
}

const loadPosts = async () => {
  postsLoading.value = true
  try {
    const res = await request.get('/api/admin/posts', {
      params: {
        keyword: postFilters.keyword,
        username: postFilters.username,
        page: postPagination.page,
        limit: postPagination.limit
      }
    })
    if (res.data.code === 200) {
      posts.value = res.data.data
      postPagination.total = Number(res.data.total || 0)
    }
  } catch (error) {
    posts.value = []
    postPagination.total = 0
    handleAdminApiError(error)
  } finally {
    postsLoading.value = false
  }
}

const handleUserPageChange = async (page) => {
  userPagination.page = page
  await loadUsers()
}

const handleUserPageSizeChange = async (size) => {
  userPagination.limit = size
  userPagination.page = 1
  await loadUsers()
}

const handlePostPageChange = async (page) => {
  postPagination.page = page
  await loadPosts()
}

const handlePostPageSizeChange = async (size) => {
  postPagination.limit = size
  postPagination.page = 1
  await loadPosts()
}

const loadResetRequests = async () => {
  resetRequestsLoading.value = true
  try {
    const res = await request.get('/api/admin/password-reset-requests', {
      params: {
        keyword: resetRequestFilters.keyword,
        status: resetRequestFilters.status
      }
    })
    if (res.data.code === 200) {
      resetRequests.value = res.data.data
    }
  } catch (error) {
    resetRequests.value = []
    handleAdminApiError(error)
  } finally {
    resetRequestsLoading.value = false
  }
}

const handleAdminApiError = (error) => {
  const status = error?.response?.status
  if (status === 404) {
    ElMessage.error('管理员接口不存在，请重启后端服务并确认已加载最新代码')
    return
  }
  if (status === 403) {
    ElMessage.error('当前账号无管理员权限或已被封禁')
    return
  }
  if (status === 401) {
    ElMessage.error('登录状态已失效，请重新登录')
    return
  }
  ElMessage.error('管理员数据加载失败，请稍后重试')
}

const resetCreateAdminForm = () => {
  createAdminForm.username = ''
  createAdminForm.nickname = ''
  createAdminForm.password = ''
  createAdminForm.confirmPassword = ''
  createAdminForm.currentAdminPassword = ''
  createAdminForm.confirmText = ''
}

const openCreateAdminDialog = () => {
  resetCreateAdminForm()
  createAdminDialogVisible.value = true
}

const handleCreateAdmin = async () => {
  if (
    !createAdminForm.username ||
    !createAdminForm.nickname ||
    !createAdminForm.password ||
    !createAdminForm.confirmPassword ||
    !createAdminForm.currentAdminPassword ||
    !createAdminForm.confirmText
  ) {
    ElMessage.warning('请完整填写管理员创建信息')
    return
  }

  if (createAdminForm.password !== createAdminForm.confirmPassword) {
    ElMessage.warning('两次输入的新管理员密码不一致')
    return
  }

  if (createAdminForm.confirmText !== 'CREATE_ADMIN') {
    ElMessage.warning('确认口令不正确，请输入 CREATE_ADMIN')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认创建管理员账号 ${createAdminForm.username} 吗？该账号将拥有后台全部管理权限。`,
      '高危操作确认',
      {
        type: 'warning',
        confirmButtonText: '确认创建',
        cancelButtonText: '取消'
      }
    )
  } catch (error) {
    return
  }

  createAdminLoading.value = true
  try {
    const res = await request.post('/api/admin/users/create-admin', {
      username: createAdminForm.username,
      nickname: createAdminForm.nickname,
      password: createAdminForm.password,
      confirmPassword: createAdminForm.confirmPassword,
      currentAdminPassword: createAdminForm.currentAdminPassword,
      confirmText: createAdminForm.confirmText
    })

    if (res.data.code === 200) {
      ElMessage.success('管理员账号创建成功')
      createAdminDialogVisible.value = false
      resetCreateAdminForm()
      await Promise.all([loadUsers(), loadStats()])
    } else {
      ElMessage.error(res.data.message || '管理员账号创建失败')
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '管理员账号创建失败')
  } finally {
    createAdminLoading.value = false
  }
}

const resetResourceForm = () => {
  resourceForm.title = ''
  resourceForm.description = ''
  resourceForm.type = '编程开发'
  resourceForm.url = ''
  resourceForm.fileFormat = ''
  resourceForm.fileSize = ''
  resourceForm.cover = ''
}

const resetStudyForm = () => {
  studyForm.title = ''
  studyForm.description = ''
  studyForm.category = '考研资料'
  studyForm.fileType = 'PDF'
  studyForm.downloadUrl = ''
}

const resetCareerForm = () => {
  careerForm.company = ''
  careerForm.title = ''
  careerForm.type = '校招内推'
  careerForm.content = ''
  careerForm.tags = ''
  careerForm.contact = ''
}

const ensureAdminFileSizeValid = (file) => {
  if (!file) {
    ElMessage.error('请选择要上传的文件')
    return false
  }

  if (file.size > 50 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 50MB')
    return false
  }

  return true
}

const beforeResourceFileUpload = (file) => {
  const pass = ensureAdminFileSizeValid(file)
  resourceFileUploading.value = pass
  return pass
}

const beforeStudyFileUpload = (file) => {
  const pass = ensureAdminFileSizeValid(file)
  studyFileUploading.value = pass
  return pass
}

const extractFileExtUpper = (filename) => {
  const name = String(filename || '')
  const index = name.lastIndexOf('.')
  if (index < 0 || index === name.length - 1) return ''
  return name.slice(index + 1).toUpperCase()
}

const toFileSizeLabel = (size) => {
  const bytes = Number(size || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)}MB`
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

const handleResourceFileUploadSuccess = (response, uploadFile) => {
  resourceFileUploading.value = false
  if (response?.code !== 200 || !response?.url) {
    ElMessage.error(response?.message || '资源文件上传失败')
    return
  }

  resourceForm.url = response.url
  if (!resourceForm.fileFormat) {
    resourceForm.fileFormat = extractFileExtUpper(uploadFile?.name || response?.data?.fileName)
  }
  if (!resourceForm.fileSize) {
    resourceForm.fileSize = toFileSizeLabel(response?.data?.size || uploadFile?.size)
  }

  ElMessage.success('文件上传成功，已自动填入资源链接')
}

const handleResourceFileUploadError = (error) => {
  resourceFileUploading.value = false
  ElMessage.error(error?.message || '资源文件上传失败')
}

const handleStudyFileUploadSuccess = (response, uploadFile) => {
  studyFileUploading.value = false
  if (response?.code !== 200 || !response?.url) {
    ElMessage.error(response?.message || '资料文件上传失败')
    return
  }

  studyForm.downloadUrl = response.url
  const ext = extractFileExtUpper(uploadFile?.name || response?.data?.fileName)
  if (ext) {
    studyForm.fileType = ext
  }

  ElMessage.success('文件上传成功，已自动填入资料链接')
}

const handleStudyFileUploadError = (error) => {
  studyFileUploading.value = false
  ElMessage.error(error?.message || '资料文件上传失败')
}

const handlePublishResource = async () => {
  if (!resourceForm.title || !resourceForm.type || !resourceForm.url) {
    ElMessage.warning('请填写资源标题、分类和链接')
    return
  }

  publishLoading.value = true
  try {
    const res = await request.post('/api/admin/resources', {
      title: resourceForm.title,
      description: resourceForm.description,
      type: resourceForm.type,
      url: resourceForm.url,
      fileFormat: resourceForm.fileFormat,
      fileSize: resourceForm.fileSize,
      cover: resourceForm.cover
    })

    if (res.data.code === 200) {
      ElMessage.success('资源发布成功')
      resetResourceForm()
    } else {
      ElMessage.error(res.data.message || '资源发布失败')
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '资源发布失败')
  } finally {
    publishLoading.value = false
  }
}

const handlePublishStudy = async () => {
  if (!studyForm.title || !studyForm.category || !studyForm.downloadUrl) {
    ElMessage.warning('请填写资料标题、分类和链接')
    return
  }

  publishLoading.value = true
  try {
    const res = await request.post('/api/admin/study', {
      title: studyForm.title,
      description: studyForm.description,
      category: studyForm.category,
      fileType: studyForm.fileType,
      download_url: studyForm.downloadUrl
    })

    if (res.data.code === 200) {
      ElMessage.success('资料发布成功')
      resetStudyForm()
    } else {
      ElMessage.error(res.data.message || '资料发布失败')
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '资料发布失败')
  } finally {
    publishLoading.value = false
  }
}

const handlePublishCareer = async () => {
  if (!careerForm.company || !careerForm.title || !careerForm.type || !careerForm.content) {
    ElMessage.warning('请填写公司、标题、分类和内容')
    return
  }

  publishLoading.value = true
  try {
    const res = await request.post('/api/admin/careers', {
      company: careerForm.company,
      title: careerForm.title,
      type: careerForm.type,
      content: careerForm.content,
      tags: careerForm.tags,
      contact: careerForm.contact
    })

    if (res.data.code === 200) {
      ElMessage.success('招聘信息发布成功')
      resetCareerForm()
    } else {
      ElMessage.error(res.data.message || '招聘信息发布失败')
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '招聘信息发布失败')
  } finally {
    publishLoading.value = false
  }
}

// ========== 公告管理函数 ==========
const loadAnnouncementList = async () => {
  announcementLoading.value = true
  try {
    const res = await request.get('/api/admin/announcements', {
      params: { page: announcementPage.value, limit: announcementPageSize.value }
    })
    if (res.data.code === 200) {
      announcementList.value = res.data.data || []
      announcementTotal.value = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('获取公告列表失败')
  } finally {
    announcementLoading.value = false
  }
}

const openAnnouncementEditDialog = (row = null) => {
  if (row) {
    announcementEditId.value = row.id
    announcementEditForm.title = row.title
    announcementEditForm.content = row.content
    announcementEditForm.isPinned = !!row.is_pinned
  } else {
    announcementEditId.value = null
    announcementEditForm.title = ''
    announcementEditForm.content = ''
    announcementEditForm.isPinned = false
  }
  announcementEditDialogVisible.value = true
}

const saveAnnouncement = async () => {
  if (!announcementEditForm.title || !announcementEditForm.content) {
    ElMessage.warning('请填写公告标题和内容')
    return
  }
  announcementSaving.value = true
  try {
    let res
    if (announcementEditId.value) {
      res = await request.put(`/api/admin/announcements/${announcementEditId.value}`, {
        title: announcementEditForm.title,
        content: announcementEditForm.content,
        is_pinned: announcementEditForm.isPinned ? 1 : 0
      })
    } else {
      res = await request.post('/api/admin/announcements', {
        title: announcementEditForm.title,
        content: announcementEditForm.content,
        is_pinned: announcementEditForm.isPinned ? 1 : 0
      })
    }
    if (res.data.code === 200) {
      ElMessage.success(announcementEditId.value ? '公告更新成功' : '公告发布成功')
      announcementEditDialogVisible.value = false
      await loadAnnouncementList()
    } else {
      ElMessage.error(res.data.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '操作失败')
  } finally {
    announcementSaving.value = false
  }
}

const toggleAnnouncementPin = async (row) => {
  try {
    const res = await request.put(`/api/admin/announcements/${row.id}/pin`)
    if (res.data.code === 200) {
      ElMessage.success(res.data.message)
      await loadAnnouncementList()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const deleteAnnouncement = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除公告「${row.title}」吗？删除后不可恢复。`,
      '删除确认',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    )
    const res = await request.delete(`/api/admin/announcements/${row.id}`)
    if (res.data.code === 200) {
      ElMessage.success('公告已删除')
      await loadAnnouncementList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '删除失败')
    }
  }
}

const refreshAll = async () => {
  loading.value = true
  try {
    await Promise.all([loadStats(), loadUsers(), loadPosts(), loadResetRequests()])
    ElMessage.success('数据已刷新')
  } catch (error) {
    handleAdminApiError(error)
  } finally {
    loading.value = false
  }
}

const handleUserStatusToggle = async (user, enabled) => {
  const status = enabled ? 1 : 0
  try {
    await request.patch(`/api/admin/users/${user.id}/status`, { status })
    ElMessage.success(status === 1 ? '用户已解封' : '用户已封禁')
    await Promise.all([loadUsers(), loadStats()])
  } catch (error) {
    await loadUsers()
  }
}

const toggleUserStatusQuick = async (user) => {
  const nextStatus = Number(user.status) === 1 ? 0 : 1
  await handleUserStatusToggle(user, nextStatus === 1)
}

const handleResetUserPassword = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确认将用户 ${user.username} 的密码重置为默认密码 123456 吗？`,
      '重置密码确认',
      {
        type: 'warning',
        confirmButtonText: '确认重置',
        cancelButtonText: '取消'
      }
    )

    const res = await request.post(`/api/admin/users/${user.id}/reset-password`)
    if (res.data.code === 200) {
      ElMessage.success(`已重置 ${user.username} 的密码为 123456`)
    } else {
      ElMessage.error(res.data.message || '重置密码失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '重置密码失败')
    }
  }
}

const handleDeletePost = async (post) => {
  try {
    await ElMessageBox.confirm(
      `确认删除帖子《${post.title}》吗？此操作会连同评论和点赞一起清除。`,
      '违规删除',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )
    await request.delete(`/api/posts/${post.id}`)
    ElMessage.success('帖子已删除')
    await Promise.all([loadPosts(), loadStats()])
  } catch (error) {
    if (error !== 'cancel') {
      await loadPosts()
    }
  }
}

const handleProcessResetRequest = async (requestItem) => {
  try {
    await ElMessageBox.confirm(
      `确认已处理账号 ${requestItem.username} 的找回密码请求吗？`,
      '处理确认',
      {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      }
    )

    const res = await request.patch(`/api/admin/password-reset-requests/${requestItem.id}`, {
      status: 'processed',
      adminNote: '管理员已重置密码为默认值 123456'
    })

    if (res.data.code === 200) {
      ElMessage.success('已标记为已处理')
      await loadResetRequests()
    } else {
      ElMessage.error(res.data.message || '更新处理状态失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '更新处理状态失败')
    }
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(async () => {
  refreshCurrentUser()
  try {
    await refreshAll()
  } catch (error) {
    handleAdminApiError(error)
  }
})

// 切换到公告管理时自动加载
watch(activeSection, (val) => {
  if (val === 'announcements') {
    loadAnnouncementList()
  }
})
</script>

<style scoped>
.admin-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(191, 219, 254, 0.55), transparent 30%),
    radial-gradient(circle at right 20%, rgba(219, 234, 254, 0.55), transparent 26%),
    linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
  color: #1f2937;
}

.ambient {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
}

.ambient-one {
  width: 280px;
  height: 280px;
  background: rgba(191, 219, 254, 0.45);
  top: -120px;
  right: 2%;
}

.ambient-two {
  width: 320px;
  height: 320px;
  background: rgba(226, 232, 240, 0.65);
  bottom: -140px;
  left: -100px;
}

.admin-shell {
  position: relative;
  z-index: 1;
  height: 100vh;
  overflow: hidden;
}

.admin-aside {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 28px 18px 22px;
  border-right: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.brand-mark {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.22);
}

.brand-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.brand-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.admin-menu {
  border-right: none;
}

.admin-menu :deep(.el-menu-item) {
  margin: 8px 0;
  border-radius: 14px;
  height: 48px;
  transition: all 0.25s ease;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(96, 165, 250, 0.08));
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.14);
}

.aside-footer {
  display: grid;
  gap: 14px;
  margin-top: 20px;
}

.assistant-card {
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.95));
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.assistant-label {
  font-size: 12px;
  color: #64748b;
}

.assistant-name {
  margin: 8px 0 12px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.home-btn {
  width: 100%;
  border-radius: 14px;
}

.admin-main-wrap {
  min-width: 0;
  height: 100vh;
  overflow-y: auto;
}

.admin-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: auto;
  padding: 28px 34px 0;
  color: #0f172a;
}

.page-kicker {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #94a3b8;
}

.page-title {
  margin: 6px 0 0;
  font-size: 30px;
  line-height: 1.15;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-main {
  padding: 22px 34px 34px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.stat-card,
.panel-card {
  border: 1px solid rgba(226, 232, 240, 1) !important;
  background: rgba(255, 255, 255, 0.96) !important;
  backdrop-filter: blur(12px);
  color: #0f172a;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
  border-radius: 22px;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

.stat-value {
  margin-top: 14px;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.stat-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.panel-card :deep(.el-card__header) {
  border-bottom: 1px solid rgba(226, 232, 240, 1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-size: 16px;
  font-weight: 700;
}

.inline-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  width: 220px;
}

.overview-note {
  color: #475569;
  line-height: 1.8;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
  margin-bottom: 18px;
}

.trend-log-grid {
  grid-template-columns: 1fr 1fr;
}

.overview-panel :deep(.el-card__body) {
  display: grid;
  gap: 14px;
}

.breakdown-list,
.pending-list {
  display: grid;
  gap: 14px;
}

.breakdown-item,
.pending-item {
  padding: 14px;
  border-radius: 16px;
  background: #f8fbff;
  border: 1px solid #e2e8f0;
}

.breakdown-head,
.pending-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.breakdown-label,
.pending-title {
  font-weight: 700;
  color: #0f172a;
}

.breakdown-meta,
.pending-desc {
  font-size: 12px;
  color: #64748b;
}

.breakdown-ratio {
  font-size: 18px;
  font-weight: 800;
}

.pending-item.urgent {
  border-color: rgba(239, 68, 68, 0.22);
}

.pending-item.warning {
  border-color: rgba(245, 158, 11, 0.22);
}

.pending-item.info {
  border-color: rgba(59, 130, 246, 0.16);
}

.shortcut-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.trend-chart {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  align-items: end;
  min-height: 180px;
}

.trend-col {
  display: grid;
  justify-items: center;
  gap: 8px;
}

.trend-bar-wrap {
  width: 100%;
  max-width: 34px;
  height: 120px;
  border-radius: 10px;
  background: #eef4ff;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.trend-bar {
  width: 100%;
  background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
  border-radius: 10px;
  min-height: 4px;
}

.trend-value {
  font-size: 12px;
  color: #0f172a;
}

.trend-label {
  font-size: 11px;
  color: #64748b;
}

.trend-legend {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #475569;
}

.log-list {
  display: grid;
  gap: 10px;
  max-height: 320px;
  overflow: auto;
  padding-right: 4px;
}

.log-item {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fbff;
}

.log-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.log-time {
  font-size: 12px;
  color: #64748b;
}

.log-detail {
  font-size: 13px;
  line-height: 1.5;
  color: #0f172a;
}

.data-table {
  --el-table-border-color: #e2e8f0;
  --el-table-border: 1px solid #e2e8f0;
  --el-table-header-bg-color: #f8fafc;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(59, 130, 246, 0.05);
  --el-table-text-color: #0f172a;
  --el-table-header-text-color: #475569;
}

.user-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.request-message {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.publish-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.publish-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: #e2e8f0;
}

.publish-tabs :deep(.el-tabs__item) {
  height: 42px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #64748b;
  transition: color 0.2s ease;
}

.publish-tabs :deep(.el-tabs__item:hover) {
  color: #2563eb;
}

.publish-tabs :deep(.el-tabs__item.is-active) {
  color: #2563eb;
}

.publish-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(90deg, #6eb5ff 0%, #8ec8ff 100%);
}

.publish-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.full-width {
  grid-column: 1 / -1;
}

.publish-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.upload-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

:deep(.el-table),
:deep(.el-table__inner-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table th),
:deep(.el-table td) {
  background-color: transparent !important;
}

:deep(.el-switch__core) {
  min-width: 48px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .trend-log-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 920px) {
  .admin-shell {
    display: block;
    height: auto;
    overflow: visible;
  }

  .admin-aside {
    position: static;
    top: auto;
    height: auto;
    overflow: visible;
    width: auto !important;
  }

  .admin-main-wrap {
    height: auto;
    overflow: visible;
  }

  .admin-topbar,
  .admin-main {
    padding-left: 18px;
    padding-right: 18px;
  }

  .admin-main {
    padding-bottom: calc(96px + env(safe-area-inset-bottom));
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .panel-header,
  .topbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .publish-form-grid {
    grid-template-columns: 1fr;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>
