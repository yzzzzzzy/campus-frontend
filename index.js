const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // 引入加密工具
const jwt = require('jsonwebtoken'); // 引入 Token 工具
require('dotenv').config();
const multer = require('multer');
const path = require('path');
// 👉 [新增] 引入我们刚刚写好的数据库连接文件
const db = require('./db');
const authenticateToken = require('./auth'); // 引入保安
const app = express();


app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 原来的基础测试接口
app.get('/', (req, res) => {
    res.send({
        code: 200,
        message: '欢迎来到大学生信息共享平台！后端服务已成功启动！🎉'
    });
});

// 👉 [新增] 第一个真实业务接口：获取所有板块分类
// 当浏览器访问 /api/categories 时，触发这个函数
app.get('/api/categories', async (req, res) => {
    try {
        // 去数据库的 categories 表里查询所有数据，并按 sort_order 排序
        const [rows] = await db.query('SELECT * FROM categories ORDER BY sort_order ASC');

        // 把查到的数据打包成 JSON 发给前端
        res.send({
            code: 200,
            message: '获取板块分类成功',
            data: rows
        });
    } catch (error) {
        console.error('查询数据库时发生错误:', error);
        res.status(500).send({
            code: 500,
            message: '服务器内部错误'
        });
    }
});

// 👉 [新增] 1. 用户注册接口 (POST请求)
app.post('/api/register', async (req, res) => {
    try {
        // 1. 获取前端传过来的账号、密码、昵称等信息
        const { username, password, nickname, major, skills } = req.body;

        // 2. 检查账号是否已经存在
        const [existingUsers] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.send({ code: 400, message: '该学号/账号已被注册！' });
        }

        // 3. 核心考点：密码加密（加盐）
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // 4. 将新用户存入数据库 (注意这里存的是加密后的密码)
        await db.query(
            'INSERT INTO users (username, password, nickname, major, skills) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, nickname, major || null, skills || null]
        );

        res.send({ code: 200, message: '注册成功！欢迎加入平台！' });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});


// 👉 [新增] 2. 用户登录接口 (POST请求)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. 去数据库里找这个账号
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.send({ code: 400, message: '账号不存在！' });
        }

        const user = users[0];

        // 2. 核心考点：校验密码（将用户输入的明文和数据库里的密文进行安全比对）
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.send({ code: 400, message: '密码错误！' });
        }

        // 3. 密码正确，颁发 JWT Token (电子通行证)
        // 注意：这里面千万不要放密码！只放 ID 和账号这种非敏感信息
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET, // 用我们在 .env 里写的密钥来盖章
            { expiresIn: '24h' }    // Token 24小时后自动过期失效
        );

        res.send({
            code: 200,
            message: '登录成功！',
            data: {
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    nickname: user.nickname,
                    major: user.major,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 3. 发布信息/帖子接口 (注意中间加了 authenticateToken 这个保安！)
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        // 因为保安已经验过通行证了，所以 req.user 里肯定有当前登录用户的信息
        const userId = req.user.id;

        // 获取前端填写的发帖内容
        const { title, content, category_id, tags } = req.body;

        // 简单的防呆校验，标题和内容不能为空
        if (!title || !content || !category_id) {
            return res.send({ code: 400, message: '标题、内容和分类都不能为空哦！' });
        }

        // 插入到 posts 数据库表中
        const [result] = await db.query(
            'INSERT INTO posts (title, content, user_id, category_id, tags) VALUES (?, ?, ?, ?, ?)',
            [title, content, userId, category_id, tags || null]
        );

        res.send({
            code: 200,
            message: '发布成功！',
            data: { postId: result.insertId } // 把刚刚生成的帖子ID返回给前端
        });
    } catch (error) {
        console.error('发帖失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [升级版] 4. 获取帖子列表接口 (支持关键词搜索和分类筛选)
app.get('/api/posts', async (req, res) => {
    try {
        // 获取前端可能传过来的搜索条件
        const { keyword, categoryId } = req.query;

        // 基础的 SQL 联查语句
        let query = `
            SELECT p.*, c.name AS category_name, u.nickname AS author_name,
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes_count 
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.user_id = u.id  
            WHERE 1=1
        `;

        const queryParams = [];

        // 如果前端传了板块ID，就加上板块过滤
        if (categoryId) {
            query += ` AND p.category_id = ?`;
            queryParams.push(categoryId);
        }

        // 如果前端传了关键词，就加上模糊搜索 (搜标题或内容)
        if (keyword) {
            query += ` AND (p.title LIKE ? OR p.content LIKE ?)`;
            const likeKeyword = `%${keyword}%`; // SQL 里的模糊匹配符号
            queryParams.push(likeKeyword, likeKeyword);
        }

        // 最后加上按时间倒序排列
        query += ` ORDER BY p.created_at DESC`;

        const [rows] = await db.query(query, queryParams);

        res.send({
            code: 200,
            message: '获取帖子列表成功',
            data: rows
        });
    } catch (error) {
        console.error('获取帖子失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 5. 获取当前登录用户的个人信息 (需要保安验证)
app.get('/api/user/info', authenticateToken, async (req, res) => {
    try {
        // 从数据库查询当前用户的详细信息（密码除外）
        const [users] = await db.query(
            'SELECT id, username, nickname, major, skills, avatar, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.send({ code: 400, message: '找不到该用户' });
        }
        res.send({ code: 200, message: '获取成功', data: users[0] });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 6. 获取当前用户自己发布的帖子 (需要保安验证)
app.get('/api/user/posts', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.title, p.content, p.tags, p.created_at, c.name AS category_name
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `;
        const [rows] = await db.query(query, [req.user.id]);
        res.send({ code: 200, message: '获取成功', data: rows });
    } catch (error) {
        console.error('获取我的帖子失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 7. 发表评论 (需要保安验证，必须登录才能评论)
app.post('/api/comments', authenticateToken, async (req, res) => {
    try {
        const { post_id, content } = req.body;
        if (!post_id || !content) {
            return res.send({ code: 400, message: '评论内容不能为空！' });
        }

        // 插入评论数据
        await db.query(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [post_id, req.user.id, content]
        );
        res.send({ code: 200, message: '评论发表成功！' });
    } catch (error) {
        console.error('发表评论失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 8. 获取某篇帖子的所有评论 (公开接口，大家都能看)
app.get('/api/comments/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        // 联表查询：把评论内容和评论者的昵称、头像一起查出来
        const query = `
            SELECT c.id, c.content, c.created_at, u.nickname, u.avatar
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `;
        const [rows] = await db.query(query, [postId]);

        res.send({ code: 200, message: '获取评论成功', data: rows });
    } catch (error) {
        console.error('获取评论失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 9. 获取个人提升资源列表 (公开接口)
app.get('/api/resources', async (req, res) => {
    try {
        // 允许前端传一个 type 过来进行分类筛选（比如只看“编程开发”）
        const { type } = req.query;

        let query = 'SELECT * FROM resources';
        const queryParams = [];

        // 如果前端传了分类，就加上 WHERE 条件
        if (type) {
            query += ' WHERE type = ?';
            queryParams.push(type);
        }

        // 按照添加时间倒序排列
        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, queryParams);

        res.send({
            code: 200,
            message: '获取资源成功',
            data: rows
        });
    } catch (error) {
        console.error('获取资源失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 10. 获取升学考公资料列表 (公开接口)
app.get('/api/study', async (req, res) => {
    try {
        const { category } = req.query; // 允许按分类筛选

        let query = 'SELECT * FROM study_materials';
        const queryParams = [];

        if (category) {
            query += ' WHERE category = ?';
            queryParams.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, queryParams);

        res.send({ code: 200, message: '获取资料成功', data: rows });
    } catch (error) {
        console.error('获取升学资料失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 11. 获取竞赛组队列表 (公开接口)
app.get('/api/competitions', async (req, res) => {
    try {
        const { status } = req.query; // 允许按“是否满员”筛选

        let query = 'SELECT * FROM competitions';
        const queryParams = [];

        if (status) {
            query += ' WHERE status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, queryParams);

        res.send({ code: 200, message: '获取竞赛信息成功', data: rows });
    } catch (error) {
        console.error('获取竞赛信息失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 12. 获取实习与就业列表 (公开接口)
app.get('/api/careers', async (req, res) => {
    try {
        const { type } = req.query; // 允许按分类筛选

        let query = 'SELECT * FROM careers';
        const queryParams = [];

        if (type) {
            query += ' WHERE type = ?';
            queryParams.push(type);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, queryParams);

        res.send({ code: 200, message: '获取就业信息成功', data: rows });
    } catch (error) {
        console.error('获取就业信息失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 14. 修改个人资料 (昵称、头像)
app.put('/api/user/info', authenticateToken, async (req, res) => {
    try {
        const { nickname, avatar } = req.body;

        // 更新当前登录用户的资料
        await db.query(
            'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
            [nickname, avatar, req.user.id]
        );

        res.send({ code: 200, message: '个人资料更新成功！' });
    } catch (error) {
        console.error('更新资料失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 15. 收藏 / 取消收藏 (需要保安验证)
app.post('/api/favorites/toggle', authenticateToken, async (req, res) => {
    try {
        const { target_id, target_type = 'post' } = req.body;
        const user_id = req.user.id;

        // 检查数据库里是否已经有这条收藏记录
        const [existing] = await db.query(
            'SELECT id FROM favorites WHERE user_id = ? AND target_id = ? AND target_type = ?',
            [user_id, target_id, target_type]
        );

        if (existing.length > 0) {
            // 查到了 -> 说明已经收藏过了 -> 执行取消收藏
            await db.query('DELETE FROM favorites WHERE id = ?', [existing[0].id]);
            res.send({ code: 200, message: '已取消收藏' });
        } else {
            // 没查到 -> 执行添加收藏
            await db.query(
                'INSERT INTO favorites (user_id, target_id, target_type) VALUES (?, ?, ?)',
                [user_id, target_id, target_type]
            );
            res.send({ code: 200, message: '收藏成功！' });
        }
    } catch (error) {
        console.error('收藏操作失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [升级版] 16. 获取我的收藏列表 (支持动态传参 type)
app.get('/api/user/favorites', authenticateToken, async (req, res) => {
    try {
        const type = req.query.type || 'post'; // 接收前端传来的 type，默认是 post
        let query = '';

        if (type === 'post') {
            query = `
                SELECT p.id, p.title, p.content, p.created_at, c.name AS category_name, f.created_at as favorited_at
                FROM favorites f
                JOIN posts p ON f.target_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE f.user_id = ? AND f.target_type = 'post'
                ORDER BY f.created_at DESC
            `;
        } else if (type === 'study') {
            // ... 原来的 study 查询代码保持不变 ...
            query = `
                SELECT s.id, s.title, s.description AS content, s.category AS category_name, f.created_at as favorited_at
                FROM favorites f
                JOIN study_materials s ON f.target_id = s.id 
                WHERE f.user_id = ? AND f.target_type = 'study'
                ORDER BY f.created_at DESC
            `;
        } else if (type === 'career') {
            // 👉 [新增] 实习就业收藏
            query = `
                SELECT c.id, c.title, c.content, c.type AS category_name, f.created_at as favorited_at
                FROM favorites f
                JOIN careers c ON f.target_id = c.id 
                WHERE f.user_id = ? AND f.target_type = 'career'
                ORDER BY f.created_at DESC
            `;
        } else if (type === 'resource') {
            // 👉 [新增] 提升资料收藏
            query = `
                SELECT r.id, r.title, r.description AS content, r.type AS category_name, f.created_at as favorited_at
                FROM favorites f
                JOIN resources r ON f.target_id = r.id 
                WHERE f.user_id = ? AND f.target_type = 'resource'
                ORDER BY f.created_at DESC
            `;
        } else if (type === 'competition') {
            // 👉 [新增] 竞赛大厅收藏
            query = `
                SELECT c.id, c.title, c.description AS content, c.comp_name AS category_name, f.created_at as favorited_at
                FROM favorites f
                JOIN competitions c ON f.target_id = c.id 
                WHERE f.user_id = ? AND f.target_type = 'competition'
                ORDER BY f.created_at DESC
            `;
        }

        const [rows] = await db.query(query, [req.user.id]);
        res.send({ code: 200, message: '获取收藏成功', data: rows });
    } catch (error) {
        console.error('获取收藏列表失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 17. 删除自己发布的帖子 (需要保安验证)
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        // 1. 安全校验：先查一下这篇帖子是不是当前登录用户发的
        const [posts] = await db.query('SELECT user_id FROM posts WHERE id = ?', [postId]);

        if (posts.length === 0) {
            return res.send({ code: 404, message: '帖子不存在' });
        }
        if (posts[0].user_id !== userId) { // 👉 这里也要改成 user_id
            return res.send({ code: 403, message: '你没有权限删除别人的帖子哦！' });
        }

        // 2. 级联清理：先删掉和这篇帖子相关的“收藏记录”和“评论记录”（防止数据库报错）
        await db.query(`DELETE FROM favorites WHERE target_type = 'post' AND target_id = ?`, [postId]);
        await db.query(`DELETE FROM comments WHERE post_id = ?`, [postId]);

        // 3. 终极销毁：最后再把帖子本体删掉
        await db.query(`DELETE FROM posts WHERE id = ?`, [postId]);

        res.send({ code: 200, message: '帖子已彻底删除' });
    } catch (error) {
        console.error('删除帖子失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 18. 点赞 / 取消点赞
app.post('/api/likes/toggle', authenticateToken, async (req, res) => {
    try {
        const { post_id } = req.body;
        const user_id = req.user.id;

        const [existing] = await db.query('SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?', [user_id, post_id]);

        if (existing.length > 0) {
            await db.query('DELETE FROM post_likes WHERE id = ?', [existing[0].id]);
            res.send({ code: 200, message: '取消点赞', action: 'removed' });
        } else {
            await db.query('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', [user_id, post_id]);
            res.send({ code: 200, message: '点赞成功', action: 'added' });
        }
    } catch (error) { res.status(500).send({ code: 500, message: '服务器错误' }); }
});

// 👉 [新增] 19. 获取当前用户点过赞的帖子 ID 数组
app.get('/api/user/likes', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT post_id FROM post_likes WHERE user_id = ?', [req.user.id]);
        res.send({ code: 200, data: rows.map(r => r.post_id) });
    } catch (error) { res.status(500).send({ code: 500 }); }
});

// 👉 [新增] 20. 获取个人数据面板统计 (获赞总数)
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        // 统计当前用户发的所有帖子，总共被别人点了多少个赞
        const [likeRes] = await db.query(`
            SELECT COUNT(*) AS totalLikes 
            FROM post_likes pl 
            JOIN posts p ON pl.post_id = p.id 
            WHERE p.user_id = ?
        `, [req.user.id]);

        res.send({ code: 200, data: { totalLikes: likeRes[0].totalLikes } });
    } catch (error) { res.status(500).send({ code: 500 }); }
});

// 1. 配置磁盘存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // 保存到 uploads 文件夹
    },
    filename: function (req, file, cb) {
        // 关键：重命名文件，防止重名覆盖（时间戳 + 随机数 + 原后缀）
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 限制 2MB
});

// 2. 创建上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.send({ code: 400, message: '请选择要上传的图片' });
    }
    // 构建图片在服务器上的访问 URL
    // 注意：实际开发中这里通常写成相对路径或配置好的域名
    const imgUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    res.send({ code: 200, message: '上传成功', url: imgUrl });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`----------------------------------------`);
    console.log(`🚀 后端服务已启动!`);
    console.log(`👉 请在浏览器访问: http://localhost:${PORT}`);
    console.log(`----------------------------------------`);
});