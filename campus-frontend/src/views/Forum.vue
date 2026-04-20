<template>
  <div class="common-layout">
    <el-container>
      <NavBar title="💬 校园综合论坛" bgColor="#F56C6C">
        <el-button type="warning" plain icon="Edit" @click="dialogVisible = true">发布帖子</el-button>
      </NavBar>

      <el-main class="main-content">
        <div class="toolbar">
          <el-input v-model="searchQuery" placeholder="搜索帖子标题或正文内容..." clearable class="search-input" @keyup.enter="executeSearch">
            <template #append><el-button icon="Search" @click="executeSearch" /></template>
          </el-input>
          <el-select v-model="selectedCategory" placeholder="全部分类" clearable class="filter-select" @change="executeSearch">
            <el-option label="全部分类" value="" /> 
            <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
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
import { ref, onMounted } from 'vue'
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

const fetchPosts = async () => {
  try {
    const res = await request.get('/api/posts', {
      params: { keyword: searchQuery.value, categoryId: selectedCategory.value }
    })
    if (res.data.code === 200) postList.value = res.data.data
  } catch (error) { console.error('获取帖子失败') }
}

const fetchCategories = async () => {
  try {
    const res = await request.get('/api/categories')
    if (res.data.code === 200) categoryList.value = res.data.data
  } catch (error) { console.error('获取分类失败') }
}

const executeSearch = () => { fetchPosts() }

const submitPost = async () => {
  if (!postForm.value.title || !postForm.value.content || !postForm.value.category_id) {
    return ElMessage.warning('标题、板块和正文不能为空哦！')
  }
  try {
    const res = await request.post('/api/posts', postForm.value)
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
      if (res.data.code === 200) post.commentsList = res.data.data
    } catch (error) { ElMessage.error('获取评论失败') }
  }
  post.showComments = !post.showComments
}

const submitComment = async (post) => {
  if (!post.newComment) return ElMessage.warning('评论内容不能为空哦！')
  try {
    const res = await request.post('/api/comments', { post_id: post.id, content: post.newComment })
    if (res.data.code === 200) {
      ElMessage.success('评论成功！')
      post.newComment = ''
      const commentsRes = await request.get(`/api/comments/${post.id}`)
      post.commentsList = commentsRes.data.data
    }
  } catch (error) { ElMessage.error('评论失败') }
}

onMounted(() => {
  fetchPosts()
  fetchCategories()
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
.toolbar { display: flex; margin-bottom: 20px; gap: 15px; }
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