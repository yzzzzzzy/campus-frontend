<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="💬 校园综合论坛" bgColor="#F56C6C">
        <el-button @click="router.push('/home')" icon="Back">返回主页</el-button>
      </NavBar>

      <el-main class="main-content">
        <div class="toolbar">
          <div class="filter-group">
            <el-input v-model="searchQuery" placeholder="搜索帖子标题或正文内容..." clearable class="search-input" @keyup.enter="executeSearch">
              <template #append><el-button icon="Search" @click="executeSearch" /></template>
            </el-input>
            <el-select v-model="selectedCategory" placeholder="全部分类" clearable class="filter-select" @change="executeSearch">
              <el-option label="全部分类" value="" /> 
              <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </div>
          
          <el-button type="danger" icon="Edit" @click="dialogVisible = true">发布帖子</el-button>
        </div>

        <el-card v-for="post in postList" :key="post.id" class="post-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="post-title">{{ post.title }}</span>
              <el-tag type="success">{{ post.category_name }}</el-tag>
            </div>
          </template>
          <p class="post-text">{{ post.content }}</p>
          <div class="post-footer">
            <span>作者: {{ post.author_name }} | 标签: {{ post.tags || '无' }}</span>
            <div class="footer-actions">
              <span class="time-text">发布时间: {{ new Date(post.created_at).toLocaleString() }}</span>
              
              <el-tooltip :content="post.is_liked ? '取消点赞' : '点赞'" placement="top">
                <el-button 
                  :type="post.is_liked ? 'danger' : 'info'" 
                  link 
                  @click="handleLike(post)" 
                  style="font-size: 18px; margin-right: 15px;" 
                >
                  <el-icon size="18">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :fill="post.is_liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                  </el-icon>
                </el-button>
              </el-tooltip>
              
              <el-tooltip :content="post.is_favorited ? '取消收藏' : '加入收藏'" placement="top">
                <el-button 
                  :type="post.is_favorited ? 'warning' : 'info'" 
                  link 
                  :icon="post.is_favorited ? 'StarFilled' : 'Star'" 
                  @click="handleFavorite(post)" 
                  style="font-size: 18px;" 
                />
              </el-tooltip>
              
              <el-button type="primary" link icon="ChatDotRound" @click="toggleComments(post)">
                {{ post.showComments ? '收起评论' : '查看评论' }}
              </el-button>
            </div>
          </div>

          <div v-if="post.showComments" class="comments-section">
            <el-divider border-style="dashed" />
            <div class="comment-input-box">
              <el-input v-model="post.newComment" placeholder="写下你的评论..." size="small" style="width: 80%" />
              <el-button type="primary" size="small" @click="submitComment(post)" style="margin-left: 10px;">发送</el-button>
            </div>
            <div v-if="post.commentsList && post.commentsList.length > 0" class="comment-list">
              <div v-for="comment in post.commentsList" :key="comment.id" class="comment-item">
                <span class="comment-user">{{ comment.nickname }}: </span>
                <span class="comment-content">{{ comment.content }}</span>
                <span class="comment-time">{{ new Date(comment.created_at).toLocaleString() }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无评论，快来抢沙发吧！" :image-size="50" />
          </div>
        </el-card>
        <el-empty v-if="postList.length === 0" description="没有找到相关帖子" />

        <div class="pagination-container" v-if="totalPosts > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 50]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalPosts"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>

        <el-dialog v-model="dialogVisible" title="📝 发布论坛帖子" width="50%">
          <el-form :model="postForm" label-width="80px">
            <el-form-item label="标题" required>
              <el-input v-model="postForm.title" placeholder="请输入吸人眼球的标题" />
            </el-form-item>
            <el-form-item label="所属板块" required>
              <el-select v-model="postForm.category_id" placeholder="请选择板块" style="width: 100%">
                <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="标签">
              <el-input v-model="postForm.tags" placeholder="例如：考研, 二手 (逗号隔开)" />
            </el-form-item>
            <el-form-item label="正文内容" required>
              <el-input v-model="postForm.content" type="textarea" :rows="5" placeholder="请详细描述你的需求或分享的内容..." />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible = false">取 消</el-button>
              <el-button type="primary" @click="submitPost">确 定 发 布</el-button>
            </span>
          </template>
        </el-dialog>

      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import request from '../utils/request'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const postList = ref([])
const categoryList = ref([])
const dialogVisible = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const postForm = ref({ title: '', category_id: '', tags: '', content: '' })
const myFavoriteIds = ref([]) // 用来存当前用户收藏过的帖子 ID
// 👉 [新增] 分页相关状态
const currentPage = ref(1)   // 当前页码
const pageSize = ref(10)     // 每页显示几条
const totalPosts = ref(0)    // 总帖子数
const isPageActive = ref(true)

const syncIdList = (idsRef, targetId, shouldInclude) => {
  const currentIds = new Set(idsRef.value)
  if (shouldInclude) {
    currentIds.add(targetId)
  } else {
    currentIds.delete(targetId)
  }
  idsRef.value = Array.from(currentIds)
}

// 👉 [新增] 获取用户所有的收藏记录 ID
const fetchMyFavorites = async () => {
  try {
    const res = await request.get('/api/user/favorites')
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      // 把查到的收藏帖子的 ID 提取出来存进数组
      myFavoriteIds.value = res.data.data.map(item => item.id)
    }
  } catch (error) {
    console.error('获取收藏列表失败')
  }
}

const fetchPosts = async () => {
  try {
    const res = await request.get('/api/posts', {
      params: { 
        keyword: searchQuery.value, 
        categoryId: selectedCategory.value,
        // 把前端的页码和条数传给后端
        page: currentPage.value,
        limit: pageSize.value
      }
    })
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      postList.value = res.data.data.map(post => ({
        ...post,
        is_favorited: myFavoriteIds.value.includes(post.id),
        is_liked: myLikedIds.value.includes(post.id),
      }))
      // 👉 关键：接收后端传来的总条数，喂给分页器
      totalPosts.value = res.data.total || 0
      // 与后端规范化分页参数对齐（后端会自动做边界修正）
      currentPage.value = res.data.page || currentPage.value
      pageSize.value = res.data.limit || pageSize.value
    }
  } catch (error) { console.error('获取帖子失败') }
}

const fetchCategories = async () => {
  try {
    const res = await request.get('/api/categories')
    if (!isPageActive.value) return
    if (res.data.code === 200) categoryList.value = res.data.data
  } catch (error) { console.error('获取分类失败') }
}

const executeSearch = () => {
  // 经典防爆雷：搜索条件变了，必须强行把页码拉回第 1 页！
  // 否则如果你在第 5 页搜索一个只有 2 条结果的词，就会白屏。
  currentPage.value = 1 
  fetchPosts() 
}
// 👉 [新增] 切换每页显示条数 (比如从 10条/页 变成 20条/页)
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 改变条数后，为了防止页码越界，重置回第 1 页
  fetchPosts()
}

// 👉 [新增] 点击下一页 / 点击具体页码
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchPosts()
}

const submitPost = async () => {
  if (!postForm.value.title || !postForm.value.content || !postForm.value.category_id) {
    return ElMessage.warning('标题、板块和正文不能为空哦！')
  }
  try {
    const res = await request.post('/api/posts', postForm.value)
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      ElMessage.success('发布成功！')
      dialogVisible.value = false
      postForm.value = { title: '', category_id: '', tags: '', content: '' }
      fetchPosts() 
    }
  } catch (error) { ElMessage.error('发布失败') }
}

const toggleComments = async (post) => {
  if (!post.showComments) {
    try {
      const res = await request.get(`/api/comments/${post.id}`)
      if (!isPageActive.value) return
      if (res.data.code === 200) post.commentsList = res.data.data
    } catch (error) { ElMessage.error('获取评论失败') }
  }
  post.showComments = !post.showComments
}

const submitComment = async (post) => {
  if (!post.newComment) return ElMessage.warning('评论内容不能为空哦！')
  try {
    const res = await request.post('/api/comments', { post_id: post.id, content: post.newComment })
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      ElMessage.success('评论成功！')
      post.newComment = ''
      const commentsRes = await request.get(`/api/comments/${post.id}`)
      if (!isPageActive.value) return
      post.commentsList = commentsRes.data.data
    }
  } catch (error) { ElMessage.error('评论失败') }
}

// 👉 [新增] 处理收藏逻辑
const handleFavorite = async (post) => {
  try {
    const res = await request.post('/api/favorites/toggle', {
      target_id: post.id,
      target_type: 'post'
    })
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      ElMessage.success(res.data.message)
      // 👉 [重点修改] 手动切换前端状态，让星星立刻变色！
      const nextFavorited = !post.is_favorited
      post.is_favorited = nextFavorited
      syncIdList(myFavoriteIds, post.id, nextFavorited)
    }
  } catch (error) {
    ElMessage.error('操作失败，请检查是否登录')
  }
}
const myLikedIds = ref([]) // 存用户点过赞的 ID

// 👉 [新增] 获取用户点赞记录
const fetchMyLikes = async () => {
  try {
    const res = await request.get('/api/user/likes')
    if (!isPageActive.value) return
    if (res.data.code === 200) myLikedIds.value = res.data.data
  } catch (error) {}
}

// 👉 [新增] 处理点赞点击
const handleLike = async (post) => {
  try {
    const res = await request.post('/api/likes/toggle', { post_id: post.id })
    if (!isPageActive.value) return
    if (res.data.code === 200) {
      // 乐观更新：前端直接修改状态和数字，不刷新网页
      if (res.data.action === 'added') {
        post.is_liked = true
        post.likes_count = (post.likes_count || 0) + 1
        syncIdList(myLikedIds, post.id, true)
      } else {
        post.is_liked = false
        post.likes_count = Math.max(0, (post.likes_count || 1) - 1)
        syncIdList(myLikedIds, post.id, false)
      }
    }
  } catch (error) { ElMessage.error('点赞失败') }
}

onMounted(async () => { // 👉 关键修复：在这里加上 async
  fetchCategories()
  await fetchMyLikes()       // 先等点赞列表拉取完
  await fetchMyFavorites()   // 再等收藏列表拉取完
  await fetchPosts()         // 最后再拉取帖子列表，这样状态才准！
})

onUnmounted(() => {
  isPageActive.value = false
})
</script>

<style scoped>
.header {
  background-color: #F56C6C; /* 论坛红 */
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.main-content {
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 20px 10%;
}
/* 👉 [修改] 工具栏排版样式 */
.toolbar { 
  display: flex; 
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center;
  margin-bottom: 20px; 
  background-color: white; /* 加上白底，和其他页面统一 */
  padding: 15px 20px;
  border-radius: 8px;
}
.filter-group {
  display: flex;
  gap: 15px;
}
/* 👉 [新增] 分页器居中排版 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-bottom: 20px;
}
.search-input { width: 350px; }
.filter-select { width: 150px; }
.post-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.post-title { font-size: 18px; font-weight: bold; }
.post-text { color: #606266; line-height: 1.6; }
.post-footer { margin-top: 15px; font-size: 13px; color: #909399; display: flex; justify-content: space-between; }
.footer-actions { display: flex; align-items: center; gap: 15px; }
.time-text { font-size: 13px; color: #909399; }
.comments-section { margin-top: 15px; background-color: #f9fafc; padding: 15px; border-radius: 8px; }
.comment-input-box { display: flex; margin-bottom: 15px; }
.comment-item { font-size: 13px; margin-bottom: 8px; line-height: 1.5; }
.comment-user { font-weight: bold; color: #409EFF; }
.comment-content { color: #303133; }
.comment-time { font-size: 11px; color: #c0c4cc; margin-left: 10px; }
</style>