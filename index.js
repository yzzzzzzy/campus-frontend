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
const isAdmin = authenticateToken.isAdmin;
const app = express();

// 竞赛发布限流：同一用户 60 秒内最多发布 3 次，防止恶意刷接口
const competitionPublishLimiter = new Map();
const COMPETITION_PUBLISH_WINDOW_MS = 60 * 1000;
const COMPETITION_PUBLISH_MAX = 3;
const passwordResetRequestAccountLimiter = new Map();
const passwordResetRequestIpLimiter = new Map();
const PASSWORD_RESET_REQUEST_WINDOW_MS = 60 * 1000;
const PASSWORD_RESET_REQUEST_ACCOUNT_MAX = 1;
const PASSWORD_RESET_REQUEST_IP_MAX = 3;
const SERVER_PUBLIC_BASE_URL = (process.env.SERVER_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(item => item.trim()).filter(Boolean);

const API_ERROR_MESSAGES = {
    401: '登录状态已失效，请重新登录',
    403: '无权限访问该资源',
    500: '服务器开小差了，请稍后重试'
};
const ALLOWED_FAVORITE_TYPES = ['post', 'study', 'career', 'resource', 'competition'];
const PASSWORD_RESET_REQUEST_STATUS = {
    PENDING: 'pending',
    PROCESSED: 'processed'
};
const ADMIN_CREATE_CONFIRM_TEXT = 'CREATE_ADMIN';
const ALLOWED_RESOURCE_TYPES = ['编程开发', '创意设计', '办公效率'];
const ALLOWED_STUDY_CATEGORIES = ['考研资料', '考公资料', '四六级'];
const ALLOWED_CAREER_TYPES = ['校招内推', '实习机会', '面试经验'];
const ALLOWED_UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const tableColumnsCache = new Map();

const sendApiError = (res, status = 500, message, extra = {}) => {
    return res.status(status).send({
        code: status,
        message: message || API_ERROR_MESSAGES[status] || '请求失败，请稍后重试',
        ...extra
    });
};

const getServerBaseUrl = (req) => {
    if (SERVER_PUBLIC_BASE_URL) return SERVER_PUBLIC_BASE_URL;
    return `${req.protocol}://${req.get('host')}`;
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');
const ADMIN_DEFAULT_RESET_PASSWORD = normalizeString(process.env.ADMIN_DEFAULT_RESET_PASSWORD || '123456');
const normalizeOptionalString = (value) => {
    const normalized = normalizeString(value);
    return normalized || null;
};
const normalizeStatus = (value) => {
    if (value === 0 || value === '0' || value === false) {
        return 0;
    }
    if (value === 1 || value === '1' || value === true) {
        return 1;
    }
    return null;
};
const toPositiveInt = (value) => {
    const num = Number.parseInt(value, 10);
    return Number.isInteger(num) && num > 0 ? num : null;
};
const isHttpUrl = (value) => /^https?:\/\//i.test(value);
const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,50}$/.test(value);

const getTableColumns = async (tableName) => {
    if (tableColumnsCache.has(tableName)) {
        return tableColumnsCache.get(tableName);
    }

    const [rows] = await db.query(`SHOW COLUMNS FROM \`${tableName}\``);
    const columns = new Set(rows.map(row => row.Field));
    tableColumnsCache.set(tableName, columns);
    return columns;
};

const insertWithExistingColumns = async (tableName, fieldMap, requiredKeys = []) => {
    const columns = await getTableColumns(tableName);
    const entries = Object.entries(fieldMap).filter(([key, value]) => value !== undefined && columns.has(key));
    const existingKeys = new Set(entries.map(([key]) => key));

    for (const key of requiredKeys) {
        if (!existingKeys.has(key)) {
            throw new Error(`required-column-missing:${tableName}.${key}`);
        }
    }

    if (entries.length === 0) {
        throw new Error(`no-valid-columns:${tableName}`);
    }

    const columnSql = entries.map(([key]) => `\`${key}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map(([, value]) => value);

    const [result] = await db.query(
        `INSERT INTO \`${tableName}\` (${columnSql}) VALUES (${placeholders})`,
        values
    );

    return result;
};


app.use(cors({
    origin: (origin, callback) => {
        // 未配置白名单时保持开发环境兼容；生产请在 .env 显式配置 CORS_ALLOWED_ORIGINS
        if (CORS_ALLOWED_ORIGINS.length === 0) {
            return callback(null, true);
        }
        if (!origin || CORS_ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS origin not allowed'));
    }
}));
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
        const normalizedUsername = normalizeString(username);
        const normalizedPassword = normalizeString(password);
        const normalizedNickname = normalizeString(nickname);
        const normalizedMajor = normalizeOptionalString(major);
        const normalizedSkills = normalizeOptionalString(skills);

        if (!normalizedUsername || !normalizedPassword || !normalizedNickname) {
            return res.send({ code: 400, message: '账号、密码和昵称不能为空' });
        }
        if (normalizedUsername.length > 50 || normalizedNickname.length > 50) {
            return res.send({ code: 400, message: '账号或昵称长度不能超过50个字符' });
        }
        if (normalizedPassword.length < 6 || normalizedPassword.length > 50) {
            return res.send({ code: 400, message: '密码长度需在6到50个字符之间' });
        }
        if (normalizedMajor && normalizedMajor.length > 100) {
            return res.send({ code: 400, message: '专业长度不能超过100个字符' });
        }
        if (normalizedSkills && normalizedSkills.length > 255) {
            return res.send({ code: 400, message: '技能描述长度不能超过255个字符' });
        }

        // 2. 检查账号是否已经存在
        const [existingUsers] = await db.query('SELECT * FROM users WHERE username = ?', [normalizedUsername]);
        if (existingUsers.length > 0) {
            return res.send({ code: 400, message: '该学号/账号已被注册！' });
        }

        // 3. 核心考点：密码加密（加盐）
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(normalizedPassword, salt);

        // 4. 将新用户存入数据库 (注意这里存的是加密后的密码)
        await db.query(
            'INSERT INTO users (username, password, nickname, major, skills, status) VALUES (?, ?, ?, ?, ?, ?)',
            [normalizedUsername, hashedPassword, normalizedNickname, normalizedMajor, normalizedSkills, 1]
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
        const normalizedUsername = normalizeString(username);
        const normalizedPassword = normalizeString(password);

        if (!normalizedUsername || !normalizedPassword) {
            return res.send({ code: 400, message: '账号和密码不能为空' });
        }

        // 1. 去数据库里找这个账号
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [normalizedUsername]);
        if (users.length === 0) {
            return res.send({ code: 400, message: '账号不存在！' });
        }

        const user = users[0];

        if (Number(user.status) === 0) {
            return res.status(403).send({ code: 403, message: '账号已被封禁，请联系管理员' });
        }

        // 2. 核心考点：校验密码（将用户输入的明文和数据库里的密文进行安全比对）
        const isPasswordValid = bcrypt.compareSync(normalizedPassword, user.password);
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
                    role: user.role,
                    status: user.status
                }
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 忘记密码：联系管理员留言
app.post('/api/password-reset-requests', async (req, res) => {
    try {
        const { username, message } = req.body;
        const normalizedUsername = normalizeString(username);
        const normalizedMessage = normalizeString(message);
        const clientIp = normalizeString(req.ip || req.headers['x-forwarded-for'] || 'unknown');

        if (!normalizedUsername || !normalizedMessage) {
            return res.send({ code: 400, message: '账号和留言内容不能为空' });
        }
        if (normalizedUsername.length > 50) {
            return res.send({ code: 400, message: '账号长度不能超过50个字符' });
        }
        if (normalizedMessage.length < 6 || normalizedMessage.length > 500) {
            return res.send({ code: 400, message: '留言内容长度需在6到500个字符之间' });
        }

        // 双限流：同账号 60 秒内最多 1 次，同 IP 60 秒内最多 3 次
        const now = Date.now();
        const accountHistory = passwordResetRequestAccountLimiter.get(normalizedUsername) || [];
        const validAccountHistory = accountHistory.filter(timestamp => now - timestamp <= PASSWORD_RESET_REQUEST_WINDOW_MS);
        if (validAccountHistory.length >= PASSWORD_RESET_REQUEST_ACCOUNT_MAX) {
            return res.status(429).send({ code: 429, message: '提交过于频繁，请1分钟后再试' });
        }

        const ipHistory = passwordResetRequestIpLimiter.get(clientIp) || [];
        const validIpHistory = ipHistory.filter(timestamp => now - timestamp <= PASSWORD_RESET_REQUEST_WINDOW_MS);
        if (validIpHistory.length >= PASSWORD_RESET_REQUEST_IP_MAX) {
            return res.status(429).send({ code: 429, message: '当前网络提交过于频繁，请1分钟后再试' });
        }

        const [users] = await db.query('SELECT id FROM users WHERE username = ? LIMIT 1', [normalizedUsername]);
        if (users.length === 0) {
            return res.send({ code: 400, message: '该账号不存在，请检查后重试' });
        }

        await db.query(
            `INSERT INTO password_reset_requests (username, message, status)
             VALUES (?, ?, ?)`,
            [normalizedUsername, normalizedMessage, PASSWORD_RESET_REQUEST_STATUS.PENDING]
        );

        passwordResetRequestAccountLimiter.set(normalizedUsername, [...validAccountHistory, now]);
        passwordResetRequestIpLimiter.set(clientIp, [...validIpHistory, now]);

        res.send({ code: 200, message: '留言提交成功，管理员会尽快处理' });
    } catch (error) {
        console.error('提交找回密码留言失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 忘记密码：提交前校验账号是否存在
app.post('/api/password-reset-requests/verify-user', async (req, res) => {
    try {
        const { username } = req.body;
        const normalizedUsername = normalizeString(username);

        if (!normalizedUsername) {
            return res.send({ code: 400, message: '账号不能为空' });
        }
        if (normalizedUsername.length > 50) {
            return res.send({ code: 400, message: '账号长度不能超过50个字符' });
        }

        const [users] = await db.query('SELECT id, username, nickname FROM users WHERE username = ? LIMIT 1', [normalizedUsername]);
        if (users.length === 0) {
            return res.send({ code: 400, message: '账号不存在，请检查后重试' });
        }

        res.send({
            code: 200,
            message: '账号校验通过',
            data: {
                username: users[0].username,
                nickname: users[0].nickname
            }
        });
    } catch (error) {
        console.error('校验账号失败:', error);
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
        const normalizedTitle = normalizeString(title);
        const normalizedContent = normalizeString(content);
        const normalizedCategoryId = toPositiveInt(category_id);
        const normalizedTags = normalizeOptionalString(tags);

        // 简单的防呆校验，标题和内容不能为空
        if (!normalizedTitle || !normalizedContent || !normalizedCategoryId) {
            return res.send({ code: 400, message: '标题、内容和分类都不能为空哦！' });
        }
        if (normalizedTitle.length > 100) {
            return res.send({ code: 400, message: '帖子标题不能超过100个字符' });
        }
        if (normalizedTags && normalizedTags.length > 255) {
            return res.send({ code: 400, message: '标签长度不能超过255个字符' });
        }

        // 插入到 posts 数据库表中
        const [result] = await db.query(
            'INSERT INTO posts (title, content, user_id, category_id, tags) VALUES (?, ?, ?, ?, ?)',
            [normalizedTitle, normalizedContent, userId, normalizedCategoryId, normalizedTags]
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

// 👉 [升级版] 获取论坛帖子列表 (支持分页、搜索、分类)
app.get('/api/posts', async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        const categoryId = req.query.categoryId || '';

        // 👉 [新增] 接收分页参数，默认第1页，每页10条
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const offset = (page - 1) * limit; // 计算要跳过多少条数据

        let queryParams = [];
        let whereClause = 'WHERE 1=1'; // 1=1 是个拼接 SQL 的小技巧

        if (keyword) {
            whereClause += ' AND (p.title LIKE ? OR p.content LIKE ?)';
            queryParams.push(`%${keyword}%`, `%${keyword}%`);
        }
        if (categoryId) {
            whereClause += ' AND p.category_id = ?';
            queryParams.push(categoryId);
        }

        // 👉 1. 先查符合条件的总条数 (前端分页器必须知道一共有多少条，才能算出有多少页)
        const countQuery = `SELECT COUNT(*) as total FROM posts p ${whereClause}`;
        const [countResult] = await db.query(countQuery, queryParams);
        const total = countResult[0].total;

        // 👉 2. 再查当前页的具体数据 (加上 LIMIT 和 OFFSET)
        const dataQuery = `
            SELECT p.*, u.nickname as author_name, c.name as category_name
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;
        // 注意：LIMIT 和 OFFSET 的参数必须放在数组的最后面
        const [rows] = await db.query(dataQuery, [...queryParams, limit, offset]);

        // 👉 把 total/page/limit 一起返回给前端，统一分页响应格式
        res.send({
            code: 200,
            message: '获取成功',
            data: rows,
            total,
            page,
            limit
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
            'SELECT id, username, nickname, major, skills, avatar, created_at, role, status FROM users WHERE id = ?',
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

// 👉 [新增] 管理员数据面板统计
app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
        const [[userStats], [postStats], [resourceStats], [studyStats], [careerStats], [resetRequestStats], [usersTrendRows], [postsTrendRows], [resourcesTrendRows], [studyTrendRows], [careersTrendRows], [operationLogRows]] = await Promise.all([
            db.query(`
                SELECT
                    COUNT(*) AS totalUsers,
                    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS activeUsers,
                    SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS bannedUsers,
                    SUM(CASE WHEN role = 1 THEN 1 ELSE 0 END) AS adminUsers
                FROM users
            `),
            db.query(`
                SELECT
                    COUNT(*) AS totalPosts,
                    SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS todayPosts
                FROM posts
            `),
            db.query(`
                SELECT COUNT(*) AS totalResources
                FROM resources
            `),
            db.query(`
                SELECT COUNT(*) AS totalStudyMaterials
                FROM study_materials
            `),
            db.query(`
                SELECT COUNT(*) AS totalCareerItems
                FROM careers
            `),
            db.query(`
                SELECT COUNT(*) AS pendingResetRequests
                FROM password_reset_requests
                WHERE status = 'pending'
            `),
            db.query(`
                SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COUNT(*) AS count
                FROM users
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
            `),
            db.query(`
                SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COUNT(*) AS count
                FROM posts
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
            `),
            db.query(`
                SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COUNT(*) AS count
                FROM resources
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
            `),
            db.query(`
                SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COUNT(*) AS count
                FROM study_materials
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
            `),
            db.query(`
                SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COUNT(*) AS count
                FROM careers
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
            `),
            db.query(`
                SELECT action_time, action_type, detail
                FROM (
                    SELECT created_at AS action_time, '帖子发布' AS action_type, CONCAT('《', title, '》') AS detail
                    FROM posts

                    UNION ALL

                    SELECT created_at AS action_time, '资源发布' AS action_type, title AS detail
                    FROM resources

                    UNION ALL

                    SELECT created_at AS action_time, '资料发布' AS action_type, title AS detail
                    FROM study_materials

                    UNION ALL

                    SELECT created_at AS action_time, '就业信息发布' AS action_type, title AS detail
                    FROM careers

                    UNION ALL

                    SELECT processed_at AS action_time, '申诉处理' AS action_type, CONCAT('账号 ', username, ' 的找回请求已处理') AS detail
                    FROM password_reset_requests
                    WHERE status = 'processed' AND processed_at IS NOT NULL
                ) t
                ORDER BY action_time DESC
                LIMIT 20
            `)
        ]);

        const totalPosts = Number(postStats[0]?.totalPosts || 0);
        const totalResources = Number(resourceStats[0]?.totalResources || 0);
        const totalStudyMaterials = Number(studyStats[0]?.totalStudyMaterials || 0);
        const totalCareerItems = Number(careerStats[0]?.totalCareerItems || 0);

        const formatLocalDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const dayLabels = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - (6 - index));
            return formatLocalDate(date);
        });

        const toCountMap = (rows) => rows.reduce((map, row) => {
            const dateKey = row.date;
            map[dateKey] = Number(row.count || 0);
            return map;
        }, {});

        const usersTrendMap = toCountMap(usersTrendRows);
        const postsTrendMap = toCountMap(postsTrendRows);
        const resourcesTrendMap = toCountMap(resourcesTrendRows);
        const studyTrendMap = toCountMap(studyTrendRows);
        const careersTrendMap = toCountMap(careersTrendRows);

        const trend7Days = dayLabels.map((date) => {
            const users = usersTrendMap[date] || 0;
            const posts = postsTrendMap[date] || 0;
            const resources = resourcesTrendMap[date] || 0;
            const studyMaterials = studyTrendMap[date] || 0;
            const careers = careersTrendMap[date] || 0;
            return {
                date,
                users,
                posts,
                resources,
                studyMaterials,
                careers,
                totalContent: posts + resources + studyMaterials + careers
            };
        });

        const operationLogs = operationLogRows.map((row) => ({
            actionTime: row.action_time,
            actionType: row.action_type,
            detail: row.detail
        }));

        res.send({
            code: 200,
            message: '获取成功',
            data: {
                totalUsers: Number(userStats[0]?.totalUsers || 0),
                activeUsers: Number(userStats[0]?.activeUsers || 0),
                bannedUsers: Number(userStats[0]?.bannedUsers || 0),
                adminUsers: Number(userStats[0]?.adminUsers || 0),
                totalPosts,
                todayPosts: Number(postStats[0]?.todayPosts || 0),
                totalResources,
                totalStudyMaterials,
                totalCareerItems,
                totalContent: totalPosts + totalResources + totalStudyMaterials + totalCareerItems,
                pendingResetRequests: Number(resetRequestStats[0]?.pendingResetRequests || 0),
                trend7Days,
                operationLogs
            }
        });
    } catch (error) {
        console.error('获取管理员统计失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 管理员获取全站用户
app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
        const keyword = normalizeString(req.query.keyword);
        const status = normalizeStatus(req.query.status);
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const queryParams = [];

        if (keyword) {
            whereClause += ' AND (username LIKE ? OR nickname LIKE ? OR major LIKE ? OR skills LIKE ?)';
            queryParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }

        if (status !== null) {
            whereClause += ' AND status = ?';
            queryParams.push(status);
        }

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM users
            ${whereClause}
        `;

        const dataQuery = `
            SELECT id, username, nickname, major, skills, role, status, created_at
            FROM users
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [[countRows], [rows]] = await Promise.all([
            db.query(countQuery, queryParams),
            db.query(dataQuery, [...queryParams, limit, offset])
        ]);

        res.send({
            code: 200,
            message: '获取成功',
            data: rows,
            total: Number(countRows[0]?.total || 0),
            page,
            limit
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 管理员创建管理员账号（严格校验）
app.post('/api/admin/users/create-admin', isAdmin, async (req, res) => {
    try {
        const username = normalizeString(req.body.username);
        const password = normalizeString(req.body.password);
        const confirmPassword = normalizeString(req.body.confirmPassword);
        const nickname = normalizeString(req.body.nickname);
        const currentAdminPassword = normalizeString(req.body.currentAdminPassword);
        const confirmText = normalizeString(req.body.confirmText);

        if (!username || !password || !confirmPassword || !nickname || !currentAdminPassword || !confirmText) {
            return res.send({ code: 400, message: '请完整填写管理员创建信息' });
        }
        if (username.length > 50 || nickname.length > 50) {
            return res.send({ code: 400, message: '账号或昵称长度不能超过50个字符' });
        }
        if (confirmText !== ADMIN_CREATE_CONFIRM_TEXT) {
            return res.send({ code: 400, message: `确认口令不正确，请输入 ${ADMIN_CREATE_CONFIRM_TEXT}` });
        }
        if (password !== confirmPassword) {
            return res.send({ code: 400, message: '两次输入的新密码不一致' });
        }
        if (!isStrongPassword(password)) {
            return res.send({ code: 400, message: '管理员密码需8-50位，且包含大小写字母、数字和特殊字符' });
        }

        const [currentAdminRows] = await db.query(
            'SELECT id, password, role, status FROM users WHERE id = ? LIMIT 1',
            [req.user.id]
        );

        if (currentAdminRows.length === 0) {
            return res.send({ code: 404, message: '当前管理员账号不存在' });
        }

        const currentAdmin = currentAdminRows[0];
        if (Number(currentAdmin.role) !== 1 || Number(currentAdmin.status) !== 1) {
            return res.status(403).send({ code: 403, message: '当前账号无权执行此操作' });
        }

        const isCurrentAdminPasswordValid = bcrypt.compareSync(currentAdminPassword, currentAdmin.password);
        if (!isCurrentAdminPasswordValid) {
            return res.send({ code: 400, message: '当前管理员密码校验失败' });
        }

        const [existingUsers] = await db.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
        if (existingUsers.length > 0) {
            return res.send({ code: 400, message: '该账号已存在，请更换后重试' });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const [insertResult] = await db.query(
            `INSERT INTO users (username, password, nickname, major, skills, role, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, hashedPassword, nickname, null, null, 1, 1]
        );

        res.send({
            code: 200,
            message: '管理员账号创建成功',
            data: {
                id: insertResult.insertId,
                username,
                nickname,
                role: 1,
                status: 1
            }
        });
    } catch (error) {
        console.error('创建管理员账号失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 管理员封禁/解封用户
app.patch('/api/admin/users/:id/status', isAdmin, async (req, res) => {
    try {
        const targetUserId = toPositiveInt(req.params.id);
        const nextStatus = normalizeStatus(req.body.status);

        if (!targetUserId) {
            return res.send({ code: 400, message: '用户ID格式不正确' });
        }
        if (nextStatus === null) {
            return res.send({ code: 400, message: '状态值只能是 0 或 1' });
        }
        if (targetUserId === req.user.id) {
            return res.send({ code: 400, message: '不能修改自己的账号状态' });
        }

        const [targetUsers] = await db.query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [targetUserId]);
        if (targetUsers.length === 0) {
            return res.send({ code: 404, message: '目标用户不存在' });
        }
        if (Number(targetUsers[0].role) === 1) {
            return res.send({ code: 400, message: '管理员账号不支持在此页面封禁或解封' });
        }

        await db.query('UPDATE users SET status = ? WHERE id = ?', [nextStatus, targetUserId]);

        res.send({
            code: 200,
            message: nextStatus === 1 ? '用户已解封' : '用户已封禁'
        });
    } catch (error) {
        console.error('更新用户状态失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 管理员重置用户密码
app.post('/api/admin/users/:id/reset-password', isAdmin, async (req, res) => {
    try {
        const targetUserId = toPositiveInt(req.params.id);

        if (!targetUserId) {
            return res.send({ code: 400, message: '用户ID格式不正确' });
        }
        if (targetUserId === req.user.id) {
            return res.send({ code: 400, message: '请在个人中心自行修改密码' });
        }

        const [targetUsers] = await db.query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [targetUserId]);
        if (targetUsers.length === 0) {
            return res.send({ code: 404, message: '目标用户不存在' });
        }
        if (Number(targetUsers[0].role) === 1) {
            return res.send({ code: 400, message: '管理员账号不支持在此页面重置密码' });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(ADMIN_DEFAULT_RESET_PASSWORD, salt);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, targetUserId]);

        res.send({ code: 200, message: `密码已重置为默认值：${ADMIN_DEFAULT_RESET_PASSWORD}` });
    } catch (error) {
        console.error('管理员重置密码失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 管理员查看找回密码留言
app.get('/api/admin/password-reset-requests', isAdmin, async (req, res) => {
    try {
        const keyword = normalizeString(req.query.keyword);
        const status = normalizeString(req.query.status);

        let whereClause = 'WHERE 1=1';
        const queryParams = [];

        if (keyword) {
            whereClause += ' AND (username LIKE ? OR message LIKE ? OR admin_note LIKE ?)';
            queryParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }

        if (status) {
            if (![PASSWORD_RESET_REQUEST_STATUS.PENDING, PASSWORD_RESET_REQUEST_STATUS.PROCESSED].includes(status)) {
                return res.send({ code: 400, message: '状态参数不合法' });
            }
            whereClause += ' AND status = ?';
            queryParams.push(status);
        }

        const [rows] = await db.query(
            `SELECT id, username, message, status, created_at, processed_at, processed_by, admin_note
             FROM password_reset_requests
             ${whereClause}
             ORDER BY created_at DESC`,
            queryParams
        );

        res.send({ code: 200, message: '获取成功', data: rows });
    } catch (error) {
        console.error('获取找回密码留言失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 管理员处理找回密码留言
app.patch('/api/admin/password-reset-requests/:id', isAdmin, async (req, res) => {
    try {
        const requestId = toPositiveInt(req.params.id);
        const status = normalizeString(req.body.status);
        const adminNote = normalizeOptionalString(req.body.adminNote);

        if (!requestId) {
            return res.send({ code: 400, message: '留言ID格式不正确' });
        }
        if (![PASSWORD_RESET_REQUEST_STATUS.PROCESSED, PASSWORD_RESET_REQUEST_STATUS.PENDING].includes(status)) {
            return res.send({ code: 400, message: '状态参数不合法' });
        }
        if (adminNote && adminNote.length > 255) {
            return res.send({ code: 400, message: '管理员备注不能超过255个字符' });
        }

        const [targetRows] = await db.query('SELECT id FROM password_reset_requests WHERE id = ? LIMIT 1', [requestId]);
        if (targetRows.length === 0) {
            return res.send({ code: 404, message: '留言不存在' });
        }

        if (status === PASSWORD_RESET_REQUEST_STATUS.PROCESSED) {
            await db.query(
                `UPDATE password_reset_requests
                 SET status = ?, processed_at = NOW(), processed_by = ?, admin_note = ?
                 WHERE id = ?`,
                [status, req.user.id, adminNote, requestId]
            );
        } else {
            await db.query(
                `UPDATE password_reset_requests
                 SET status = ?, processed_at = NULL, processed_by = NULL, admin_note = ?
                 WHERE id = ?`,
                [status, adminNote, requestId]
            );
        }

        res.send({ code: 200, message: status === PASSWORD_RESET_REQUEST_STATUS.PROCESSED ? '已标记为已处理' : '已改回待处理' });
    } catch (error) {
        console.error('处理找回密码留言失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 管理员查看全站帖子
app.get('/api/admin/posts', isAdmin, async (req, res) => {
    try {
        const keyword = normalizeString(req.query.keyword);
        const authorUsername = normalizeString(req.query.username);
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const queryParams = [];

        if (keyword) {
            whereClause += ' AND (p.title LIKE ? OR p.content LIKE ? OR u.nickname LIKE ? OR u.username LIKE ?)';
            queryParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }

        if (authorUsername) {
            whereClause += ' AND u.username = ?';
            queryParams.push(authorUsername);
        }

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            ${whereClause}
        `;

        const dataQuery = `
            SELECT
                p.id,
                p.title,
                p.content,
                p.tags,
                p.created_at,
                p.user_id,
                u.username AS author_username,
                u.nickname AS author_nickname,
                c.name AS category_name
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [[countRows], [rows]] = await Promise.all([
            db.query(countQuery, queryParams),
            db.query(dataQuery, [...queryParams, limit, offset])
        ]);

        res.send({
            code: 200,
            message: '获取成功',
            data: rows,
            total: Number(countRows[0]?.total || 0),
            page,
            limit
        });
    } catch (error) {
        console.error('获取帖子列表失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 管理员发布个人提升资源
app.post('/api/admin/resources', isAdmin, async (req, res) => {
    try {
        const title = normalizeString(req.body.title);
        const description = normalizeOptionalString(req.body.description);
        const type = normalizeString(req.body.type);
        const link = normalizeString(req.body.url || req.body.download_url);
        const cover = normalizeOptionalString(req.body.cover);
        const fileFormat = normalizeOptionalString(req.body.file_format || req.body.fileFormat);
        const fileSize = normalizeOptionalString(req.body.file_size || req.body.fileSize);

        if (!title || !type || !link) {
            return res.send({ code: 400, message: '标题、分类和链接不能为空' });
        }
        if (!ALLOWED_RESOURCE_TYPES.includes(type)) {
            return res.send({ code: 400, message: '资源分类不合法' });
        }
        if (title.length > 100) {
            return res.send({ code: 400, message: '标题不能超过100个字符' });
        }
        if (description && description.length > 255) {
            return res.send({ code: 400, message: '简介不能超过255个字符' });
        }
        if (!isHttpUrl(link) || link.length > 255) {
            return res.send({ code: 400, message: '资源链接格式不正确或超长' });
        }
        if (cover && (!isHttpUrl(cover) || cover.length > 255)) {
            return res.send({ code: 400, message: '封面链接格式不正确或超长' });
        }
        if (fileFormat && fileFormat.length > 20) {
            return res.send({ code: 400, message: '文件格式不能超过20个字符' });
        }
        if (fileSize && fileSize.length > 50) {
            return res.send({ code: 400, message: '文件大小不能超过50个字符' });
        }

        const tableColumns = await getTableColumns('resources');
        if (!tableColumns.has('url') && !tableColumns.has('download_url')) {
            return res.status(500).send({ code: 500, message: 'resources 表缺少链接字段，请检查数据库结构' });
        }

        const result = await insertWithExistingColumns(
            'resources',
            {
                title,
                description,
                type,
                url: link,
                download_url: link,
                cover,
                file_format: fileFormat,
                file_size: fileSize,
                user_id: req.user.id
            },
            ['title', 'type']
        );

        res.send({ code: 200, message: '资源发布成功', data: { id: result.insertId } });
    } catch (error) {
        console.error('管理员发布资源失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 管理员发布升学考公资料
app.post('/api/admin/study', isAdmin, async (req, res) => {
    try {
        const title = normalizeString(req.body.title);
        const description = normalizeOptionalString(req.body.description);
        const category = normalizeString(req.body.category);
        const fileType = normalizeString(req.body.file_type || req.body.fileType || 'PDF');
        const link = normalizeString(req.body.download_url || req.body.url);

        if (!title || !category || !link) {
            return res.send({ code: 400, message: '标题、分类和资料链接不能为空' });
        }
        if (!ALLOWED_STUDY_CATEGORIES.includes(category)) {
            return res.send({ code: 400, message: '资料分类不合法' });
        }
        if (title.length > 100) {
            return res.send({ code: 400, message: '标题不能超过100个字符' });
        }
        if (description && description.length > 255) {
            return res.send({ code: 400, message: '简介不能超过255个字符' });
        }
        if (fileType.length > 20) {
            return res.send({ code: 400, message: '文件类型不能超过20个字符' });
        }
        if (!isHttpUrl(link) || link.length > 255) {
            return res.send({ code: 400, message: '资料链接格式不正确或超长' });
        }

        const tableColumns = await getTableColumns('study_materials');
        if (!tableColumns.has('download_url') && !tableColumns.has('url')) {
            return res.status(500).send({ code: 500, message: 'study_materials 表缺少链接字段，请检查数据库结构' });
        }

        const result = await insertWithExistingColumns(
            'study_materials',
            {
                title,
                description,
                category,
                file_type: fileType,
                download_url: link,
                url: link,
                user_id: req.user.id
            },
            ['title', 'category']
        );

        res.send({ code: 200, message: '资料发布成功', data: { id: result.insertId } });
    } catch (error) {
        console.error('管理员发布资料失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 管理员发布招聘信息/面经
app.post('/api/admin/careers', isAdmin, async (req, res) => {
    try {
        const company = normalizeString(req.body.company);
        const title = normalizeString(req.body.title);
        const type = normalizeString(req.body.type);
        const content = normalizeString(req.body.content);
        const tags = normalizeOptionalString(req.body.tags);
        const contact = normalizeOptionalString(req.body.contact);

        if (!company || !title || !type || !content) {
            return res.send({ code: 400, message: '公司、标题、分类和内容不能为空' });
        }
        if (!ALLOWED_CAREER_TYPES.includes(type)) {
            return res.send({ code: 400, message: '招聘信息分类不合法' });
        }
        if (company.length > 100 || title.length > 100) {
            return res.send({ code: 400, message: '公司名称和标题不能超过100个字符' });
        }
        if (content.length > 5000) {
            return res.send({ code: 400, message: '内容不能超过5000个字符' });
        }
        if (tags && tags.length > 255) {
            return res.send({ code: 400, message: '标签不能超过255个字符' });
        }
        if (contact && contact.length > 100) {
            return res.send({ code: 400, message: '联系方式不能超过100个字符' });
        }

        const finalContact = type === '面试经验' ? (contact || '无需投递') : (contact || '请联系管理员获取投递方式');

        const result = await insertWithExistingColumns(
            'careers',
            {
                company,
                title,
                type,
                content,
                tags,
                contact: finalContact,
                user_id: req.user.id
            },
            ['company', 'title', 'type', 'content']
        );

        res.send({ code: 200, message: '招聘信息发布成功', data: { id: result.insertId } });
    } catch (error) {
        console.error('管理员发布招聘信息失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [终极升级版] 6. 获取当前用户所有的发布 (帖子、面经、招募 三合一！)
app.get('/api/user/posts', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. 查论坛帖子 (标记 item_type 为 'post')
        const [posts] = await db.query(`
            SELECT p.id, p.title, p.content, p.created_at, c.name AS category_name, 'post' AS item_type
            FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.user_id = ?
        `, [userId]);

        // 2. 查面经分享 (标记 item_type 为 'career')
        const [careers] = await db.query(`
            SELECT id, title, content, created_at, type AS category_name, 'career' AS item_type
            FROM careers WHERE user_id = ?
        `, [userId]);

        // 3. 查竞赛招募 (标记 item_type 为 'competition')
        const [comps] = await db.query(`
            SELECT id, title, description AS content, created_at, comp_name AS category_name, 'competition' AS item_type
            FROM competitions WHERE user_id = ?
        `, [userId]);

        // 4. 将三个数组合并，并按照时间从新到旧重新排序！
        const allData = [...posts, ...careers, ...comps].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.send({ code: 200, message: '获取成功', data: allData });
    } catch (error) {
        console.error('获取我的发布失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 7. 发表评论 (需要保安验证，必须登录才能评论)
app.post('/api/comments', authenticateToken, async (req, res) => {
    try {
        const { post_id, content } = req.body;
        const normalizedPostId = toPositiveInt(post_id);
        const normalizedContent = normalizeString(content);

        if (!normalizedPostId || !normalizedContent) {
            return res.send({ code: 400, message: '评论内容不能为空！' });
        }
        if (normalizedContent.length > 1000) {
            return res.send({ code: 400, message: '评论内容不能超过1000个字符' });
        }

        const [targetPosts] = await db.query('SELECT id FROM posts WHERE id = ?', [normalizedPostId]);
        if (targetPosts.length === 0) {
            return res.send({ code: 404, message: '评论目标帖子不存在' });
        }

        // 插入评论数据
        await db.query(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [normalizedPostId, req.user.id, normalizedContent]
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
        const postId = toPositiveInt(req.params.postId);
        if (!postId) {
            return res.send({ code: 400, message: '帖子ID格式不正确' });
        }
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
// 👉 [终极版] 9. 获取个人提升资源列表 (支持分页 + 分类 + 搜索)
app.get('/api/resources', async (req, res) => {
    try {
        const { type, keyword } = req.query;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const queryParams = [];

        if (type) {
            whereClause += ' AND type = ?';
            queryParams.push(type);
        }
        if (keyword) {
            whereClause += ' AND (title LIKE ? OR description LIKE ?)';
            const searchStr = `%${keyword}%`;
            queryParams.push(searchStr, searchStr);
        }

        const countQuery = `SELECT COUNT(*) AS total FROM resources ${whereClause}`;
        const [countResult] = await db.query(countQuery, queryParams);
        const total = countResult[0].total;

        const dataQuery = `SELECT * FROM resources ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        const [rows] = await db.query(dataQuery, [...queryParams, limit, offset]);

        res.send({ code: 200, message: '获取成功', data: rows, total, page, limit });
    } catch (error) { res.status(500).send({ code: 500, message: '内部错误' }); }
});
// 👉 [终极版] 10. 获取升学考公资料列表 (支持分页 + 分类 + 搜索)
app.get('/api/study', async (req, res) => {
    try {
        const { category, keyword } = req.query;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const queryParams = [];

        if (category) {
            whereClause += ' AND category = ?';
            queryParams.push(category);
        }
        if (keyword) {
            whereClause += ' AND (title LIKE ? OR description LIKE ?)';
            const searchStr = `%${keyword}%`;
            queryParams.push(searchStr, searchStr);
        }

        const countQuery = `SELECT COUNT(*) AS total FROM study_materials ${whereClause}`;
        const [countResult] = await db.query(countQuery, queryParams);
        const total = countResult[0].total;

        const dataQuery = `SELECT * FROM study_materials ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        const [rows] = await db.query(dataQuery, [...queryParams, limit, offset]);

        res.send({ code: 200, message: '获取成功', data: rows, total, page, limit });
    } catch (error) { res.status(500).send({ code: 500, message: '内部错误' }); }
});
// 👉 [新增] 11. 获取竞赛组队列表 (公开接口)
app.get('/api/competitions', async (req, res) => {
    try {
        const { status } = req.query; // 允许按“是否满员”筛选
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const offset = (page - 1) * limit;

        let whereClause = '';
        const queryParams = [];

        if (status) {
            whereClause = ' WHERE status = ?';
            queryParams.push(status);
        }

        const countQuery = `SELECT COUNT(*) AS total FROM competitions${whereClause}`;
        const [countRows] = await db.query(countQuery, queryParams);
        const total = countRows[0]?.total || 0;

        const dataQuery = `SELECT * FROM competitions${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

        const [rows] = await db.query(dataQuery, [...queryParams, limit, offset]);

        res.send({
            code: 200,
            message: '获取竞赛信息成功',
            data: rows,
            total,
            page,
            limit
        });
    } catch (error) {
        console.error('获取竞赛信息失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 11-2. 发布竞赛组队信息 (需要保安验证)
app.post('/api/competitions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // 简易滑动窗口限流（单实例进程有效）
        const now = Date.now();
        const userRecords = competitionPublishLimiter.get(userId) || [];
        const validRecords = userRecords.filter(ts => now - ts < COMPETITION_PUBLISH_WINDOW_MS);

        if (validRecords.length >= COMPETITION_PUBLISH_MAX) {
            return res.status(429).send({ code: 429, message: '发布太频繁了，请稍后再试' });
        }

        const {
            comp_name,
            title,
            description,
            required_skills,
            contact_info,
            status
        } = req.body;

        const trimmedCompName = comp_name ? String(comp_name).trim() : '';
        const trimmedTitle = title ? String(title).trim() : '';
        const trimmedDescription = description ? String(description).trim() : '';
        const trimmedSkills = required_skills ? String(required_skills).trim() : null;
        const trimmedContact = contact_info ? String(contact_info).trim() : null;

        // 基础参数校验
        if (!trimmedCompName || !trimmedTitle || !trimmedDescription) {
            return res.send({ code: 400, message: '竞赛名称、招募口号和项目详情不能为空！' });
        }

        // 与数据库字段长度对齐，避免超长写入失败
        if (trimmedCompName.length > 100 || trimmedTitle.length > 100) {
            return res.send({ code: 400, message: '竞赛名称和招募口号长度不能超过100个字符' });
        }
        if (trimmedSkills && trimmedSkills.length > 255) {
            return res.send({ code: 400, message: '所需技能长度不能超过255个字符' });
        }
        if (trimmedContact && trimmedContact.length > 100) {
            return res.send({ code: 400, message: '联系方式长度不能超过100个字符' });
        }

        const allowedStatus = ['招募中', '已满员'];
        const finalStatus = status ? String(status).trim() : '招募中';
        if (!allowedStatus.includes(finalStatus)) {
            return res.send({ code: 400, message: '状态值非法，仅支持: 招募中 / 已满员' });
        }

        validRecords.push(now);
        competitionPublishLimiter.set(userId, validRecords);

        const [result] = await db.query(
            `INSERT INTO competitions (comp_name, title, description, required_skills, status, contact_info, user_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                trimmedCompName, trimmedTitle, trimmedDescription, trimmedSkills, finalStatus, trimmedContact, userId
            ]
        );

        const [createdRows] = await db.query(
            'SELECT * FROM competitions WHERE id = ?',
            [result.insertId]
        );

        res.send({
            code: 200,
            message: '竞赛招募发布成功',
            data: createdRows[0] || { id: result.insertId }
        });
    } catch (error) {
        console.error('发布竞赛招募失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 11-3. 删除自己的竞赛招募
app.delete('/api/competitions/:id', authenticateToken, async (req, res) => {
    try {
        const compId = toPositiveInt(req.params.id);
        const userId = req.user.id;
        const adminDeleting = Number(req.user.role) === 1;

        if (!compId) {
            return res.send({ code: 400, message: '记录ID格式不正确' });
        }

        const [comps] = await db.query('SELECT user_id FROM competitions WHERE id = ?', [compId]);
        if (comps.length === 0) return res.send({ code: 404, message: '记录不存在' });

        if (!adminDeleting && comps[0].user_id !== userId) {
            return res.send({ code: 403, message: '无权删除别人的招募' });
        }

        // 清理收藏并删除
        await db.query(`DELETE FROM favorites WHERE target_type = 'competition' AND target_id = ?`, [compId]);
        await db.query(`DELETE FROM competitions WHERE id = ?`, [compId]);

        res.send({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [终极版] 12. 获取实习与就业列表 (支持分页 + 分类 + 搜索)
app.get('/api/careers', async (req, res) => {
    try {
        const { type, keyword } = req.query;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const queryParams = [];

        if (type) {
            whereClause += ' AND type = ?';
            queryParams.push(type);
        }
        if (keyword) {
            whereClause += ' AND (company LIKE ? OR title LIKE ? OR content LIKE ?)';
            const searchStr = `%${keyword}%`;
            queryParams.push(searchStr, searchStr, searchStr);
        }

        // 1. 先查总条数
        const countQuery = `SELECT COUNT(*) AS total FROM careers ${whereClause}`;
        const [countResult] = await db.query(countQuery, queryParams);
        const total = countResult[0].total;

        // 2. 查当前页数据
        const dataQuery = `SELECT * FROM careers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        const [rows] = await db.query(dataQuery, [...queryParams, limit, offset]);

        res.send({ code: 200, message: '获取成功', data: rows, total, page, limit });
    } catch (error) { res.status(500).send({ code: 500, message: '内部错误' }); }
});

// 👉 [新增] 12.1 分享面试经验 / 管理员后续可扩展发布职业信息
app.post('/api/careers', authenticateToken, async (req, res) => {
    try {
        const { company, title, content, tags, type, contact } = req.body;
        const normalizedCompany = normalizeString(company);
        const normalizedTitle = normalizeString(title);
        const normalizedContent = normalizeString(content);
        const normalizedTags = normalizeOptionalString(tags);
        const requestedType = normalizeString(type) || '面试经验';
        const normalizedContact = normalizeOptionalString(contact) || '无需投递';

        if (!normalizedCompany || !normalizedTitle || !normalizedContent) {
            return res.send({ code: 400, message: '公司、标题和内容不能为空' });
        }
        if (normalizedCompany.length > 100) {
            return res.send({ code: 400, message: '公司名称不能超过100个字符' });
        }
        if (normalizedTitle.length > 100) {
            return res.send({ code: 400, message: '标题不能超过100个字符' });
        }
        if (normalizedContent.length > 5000) {
            return res.send({ code: 400, message: '内容不能超过5000个字符' });
        }
        if (normalizedTags && normalizedTags.length > 255) {
            return res.send({ code: 400, message: '标签长度不能超过255个字符' });
        }
        if (normalizedContact && normalizedContact.length > 100) {
            return res.send({ code: 400, message: '联系方式不能超过100个字符' });
        }

        // 普通用户只能分享面试经验；管理员后续可扩展发布其他就业信息
        if (Number(req.user.role) !== 1 && requestedType !== '面试经验') {
            return res.status(403).send({ code: 403, message: '普通用户只能分享面试经验' });
        }

        const finalType = Number(req.user.role) === 1 ? requestedType : '面试经验';
        const finalContact = finalType === '面试经验' ? '无需投递' : normalizedContact;

        const [result] = await db.query(
            'INSERT INTO careers (company, title, type, content, tags, contact, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [normalizedCompany, normalizedTitle, finalType, normalizedContent, normalizedTags, finalContact, req.user.id]
        );

        res.send({
            code: 200,
            message: finalType === '面试经验' ? '面经发布成功，感谢分享！' : '信息发布成功',
            data: { postId: result.insertId }
        });
    } catch (error) {
        console.error('发布就业信息失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 12.2 删除实习与就业信息
app.delete('/api/careers/:id', authenticateToken, async (req, res) => {
    try {
        const careerId = toPositiveInt(req.params.id);
        const userId = req.user.id;
        const adminDeleting = Number(req.user.role) === 1;

        if (!careerId) {
            return res.send({ code: 400, message: '记录ID格式不正确' });
        }

        // 1. 查一下这条信息是不是当前登录用户发的
        const [careers] = await db.query('SELECT user_id FROM careers WHERE id = ?', [careerId]);
        if (careers.length === 0) {
            return res.send({ code: 404, message: '该记录不存在' });
        }

        // 如果既不是管理员，也不是发帖人本人，就拒绝删除
        if (!adminDeleting && careers[0].user_id !== userId) {
            return res.send({ code: 403, message: '你没有权限删除别人的发布！' });
        }

        // 2. 清理相关收藏，再删掉本体
        await db.query(`DELETE FROM favorites WHERE target_type = 'career' AND target_id = ?`, [careerId]);
        await db.query(`DELETE FROM careers WHERE id = ?`, [careerId]);

        res.send({ code: 200, message: '删除成功' });
    } catch (error) {
        console.error('删除实习信息失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 14. 修改个人资料 (昵称、头像)
app.put('/api/user/info', authenticateToken, async (req, res) => {
    try {
        const { nickname, avatar } = req.body;
        const normalizedNickname = normalizeString(nickname);
        const normalizedAvatar = normalizeOptionalString(avatar);

        if (!normalizedNickname) {
            return res.send({ code: 400, message: '昵称不能为空' });
        }
        if (normalizedNickname.length > 50) {
            return res.send({ code: 400, message: '昵称长度不能超过50个字符' });
        }
        if (normalizedAvatar && (normalizedAvatar.length > 255 || !isHttpUrl(normalizedAvatar))) {
            return res.send({ code: 400, message: '头像地址格式不正确' });
        }

        // 更新当前登录用户的资料
        await db.query(
            'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
            [normalizedNickname, normalizedAvatar, req.user.id]
        );

        res.send({ code: 200, message: '个人资料更新成功！' });
    } catch (error) {
        console.error('更新资料失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});

// 👉 [新增] 修改密码
app.put('/api/user/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const normalizedCurrentPassword = normalizeString(currentPassword);
        const normalizedNewPassword = normalizeString(newPassword);
        const normalizedConfirmPassword = normalizeString(confirmPassword);

        if (!normalizedCurrentPassword || !normalizedNewPassword || !normalizedConfirmPassword) {
            return res.send({ code: 400, message: '当前密码、新密码和确认密码都不能为空' });
        }
        if (normalizedNewPassword.length < 6 || normalizedNewPassword.length > 50) {
            return res.send({ code: 400, message: '新密码长度需在6到50个字符之间' });
        }
        if (normalizedNewPassword !== normalizedConfirmPassword) {
            return res.send({ code: 400, message: '两次输入的新密码不一致' });
        }
        if (normalizedCurrentPassword === normalizedNewPassword) {
            return res.send({ code: 400, message: '新密码不能和当前密码一样' });
        }

        const [users] = await db.query('SELECT password FROM users WHERE id = ? LIMIT 1', [req.user.id]);
        if (users.length === 0) {
            return res.send({ code: 404, message: '找不到当前用户' });
        }

        const isPasswordValid = bcrypt.compareSync(normalizedCurrentPassword, users[0].password);
        if (!isPasswordValid) {
            return res.send({ code: 400, message: '当前密码不正确' });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(normalizedNewPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.send({ code: 200, message: '密码修改成功，请重新登录' });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).send({ code: 500, message: '服务器内部错误' });
    }
});
// 👉 [新增] 15. 收藏 / 取消收藏 (需要保安验证)
app.post('/api/favorites/toggle', authenticateToken, async (req, res) => {
    try {
        const { target_id, target_type = 'post' } = req.body;
        const user_id = req.user.id;
        const normalizedTargetId = toPositiveInt(target_id);
        const normalizedTargetType = normalizeString(target_type) || 'post';

        if (!normalizedTargetId) {
            return res.send({ code: 400, message: '收藏目标ID格式不正确' });
        }
        if (!ALLOWED_FAVORITE_TYPES.includes(normalizedTargetType)) {
            return res.send({ code: 400, message: '收藏类型不支持' });
        }

        // 检查数据库里是否已经有这条收藏记录
        const [existing] = await db.query(
            'SELECT id FROM favorites WHERE user_id = ? AND target_id = ? AND target_type = ?',
            [user_id, normalizedTargetId, normalizedTargetType]
        );

        if (existing.length > 0) {
            // 查到了 -> 说明已经收藏过了 -> 执行取消收藏
            await db.query('DELETE FROM favorites WHERE id = ?', [existing[0].id]);
            res.send({ code: 200, message: '已取消收藏' });
        } else {
            // 没查到 -> 执行添加收藏
            await db.query(
                'INSERT INTO favorites (user_id, target_id, target_type) VALUES (?, ?, ?)',
                [user_id, normalizedTargetId, normalizedTargetType]
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
        const type = normalizeString(req.query.type || 'post'); // 接收前端传来的 type，默认是 post
        let query = '';

        if (!ALLOWED_FAVORITE_TYPES.includes(type)) {
            return res.send({ code: 400, message: '收藏分类参数不合法' });
        }

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
    const connection = await db.getConnection();
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const adminDeleting = Number(req.user.role) === 1;

        await connection.beginTransaction();

        // 1. 安全校验：先查一下这篇帖子是不是当前登录用户发的
        const [posts] = await connection.query('SELECT user_id FROM posts WHERE id = ?', [postId]);

        if (posts.length === 0) {
            await connection.rollback();
            return res.send({ code: 404, message: '帖子不存在' });
        }
        if (!adminDeleting && posts[0].user_id !== userId) { // 👉 这里也要改成 user_id
            await connection.rollback();
            return res.send({ code: 403, message: '你没有权限删除别人的帖子哦！' });
        }

        // 2. 级联清理：先删掉和这篇帖子相关的点赞、收藏和评论记录
        await connection.query('DELETE FROM post_likes WHERE post_id = ?', [postId]);
        await connection.query(`DELETE FROM favorites WHERE target_type = 'post' AND target_id = ?`, [postId]);
        await connection.query(`DELETE FROM comments WHERE post_id = ?`, [postId]);

        // 3. 终极销毁：最后再把帖子本体删掉
        await connection.query(`DELETE FROM posts WHERE id = ?`, [postId]);

        await connection.commit();

        res.send({ code: 200, message: '帖子已彻底删除' });
    } catch (error) {
        await connection.rollback();
        console.error('删除帖子失败:', error);
        sendApiError(res, 500);
    } finally {
        connection.release();
    }
});
// 👉 [新增] 18. 点赞 / 取消点赞
app.post('/api/likes/toggle', authenticateToken, async (req, res) => {
    try {
        const { post_id } = req.body;
        const user_id = req.user.id;
        const normalizedPostId = toPositiveInt(post_id);

        if (!normalizedPostId) {
            return res.send({ code: 400, message: '帖子ID格式不正确' });
        }

        const [targetPosts] = await db.query('SELECT id FROM posts WHERE id = ?', [normalizedPostId]);
        if (targetPosts.length === 0) {
            return res.send({ code: 404, message: '点赞目标帖子不存在' });
        }

        const [existing] = await db.query('SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?', [user_id, normalizedPostId]);

        if (existing.length > 0) {
            await db.query('DELETE FROM post_likes WHERE id = ?', [existing[0].id]);
            res.send({ code: 200, message: '取消点赞', action: 'removed' });
        } else {
            await db.query('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', [user_id, normalizedPostId]);
            res.send({ code: 200, message: '点赞成功', action: 'added' });
        }
    } catch (error) { sendApiError(res, 500); }
});

// 👉 [新增] 19. 获取当前用户点过赞的帖子 ID 数组
app.get('/api/user/likes', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT post_id FROM post_likes WHERE user_id = ?', [req.user.id]);
        res.send({ code: 200, data: rows.map(r => r.post_id) });
    } catch (error) { sendApiError(res, 500); }
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
    } catch (error) { sendApiError(res, 500); }
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
    fileFilter: (req, file, cb) => {
        if (!file || !ALLOWED_UPLOAD_MIME_TYPES.includes(file.mimetype)) {
            return cb(new Error('仅支持上传 JPG/PNG/GIF/WEBP 图片'));
        }
        return cb(null, true);
    },
    limits: { fileSize: 2 * 1024 * 1024 }, // 限制 2MB
});

// 2. 创建上传接口
app.post('/api/upload', authenticateToken, (req, res) => {
    upload.single('file')(req, res, (error) => {
        if (error) {
            if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
                return res.send({ code: 400, message: '图片大小不能超过 2MB' });
            }
            return res.send({ code: 400, message: error.message || '上传失败，请检查文件格式' });
        }

        if (!req.file) {
            return res.send({ code: 400, message: '请选择要上传的图片' });
        }

        // 优先使用环境变量中的公网地址，未配置时自动使用当前请求域名
        const imgUrl = `${getServerBaseUrl(req)}/uploads/${req.file.filename}`;
        return res.send({ code: 200, message: '上传成功', url: imgUrl });
    });
});
// 👉 [新增] 账号注销接口 (使用数据库事务)
app.delete('/api/user/account', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    // 从连接池中获取一个专属连接来执行事务
    const connection = await db.getConnection();

    try {
        // 1. 开启事务
        await connection.beginTransaction();

        const [ownedPosts] = await connection.query('SELECT id FROM posts WHERE user_id = ?', [userId]);
        const ownedPostIds = ownedPosts.map(post => post.id);

        const deletePostRelatedRows = async (tableName, columnName, ids) => {
            if (!ids || ids.length === 0) {
                return;
            }

            const placeholders = ids.map(() => '?').join(', ');
            await connection.query(
                `DELETE FROM ${tableName} WHERE ${columnName} IN (${placeholders})`,
                ids
            );
        };

        // 2. 依次删除该用户产生的所有关联数据 (注意顺序，从子表到主表)
        await connection.query('DELETE FROM favorites WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM post_likes WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM comments WHERE user_id = ?', [userId]);

        // 2.1 删除其他用户对当前用户发布内容产生的关联数据，避免残留脏数据
        await deletePostRelatedRows('favorites', 'target_id', ownedPostIds);
        await deletePostRelatedRows('comments', 'post_id', ownedPostIds);
        await deletePostRelatedRows('post_likes', 'post_id', ownedPostIds);

        await connection.query('DELETE FROM posts WHERE user_id = ?', [userId]);

        // 3. 最后，删除用户本体
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);

        // 4. 全部成功，提交事务！
        await connection.commit();
        res.send({ code: 200, message: '账号已永久注销' });
    } catch (error) {
        // ❌ 如果中间任何一步报错，立刻回滚撤销，仿佛什么都没发生过
        await connection.rollback();
        console.error('注销账号失败:', error);
        sendApiError(res, 500);
    } finally {
        // 释放连接回到连接池
        connection.release();
    }
});

// 全局兜底：统一返回未捕获异常，避免前端出现静默失败
app.use((err, req, res, next) => {
    console.error('未处理异常:', err);
    if (res.headersSent) {
        return next(err);
    }
    return sendApiError(res, err?.status || 500, err?.message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`----------------------------------------`);
    console.log(`🚀 后端服务已启动!`);
    console.log(`👉 请在浏览器访问: http://localhost:${PORT}`);
    console.log(`----------------------------------------`);
});