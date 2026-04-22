const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

// 这是一个中间件函数（我们的“保安”）
const authenticateToken = (req, res, next) => {
    // 1. 检查请求头里有没有带通行证 (通常前端会把它放在 Authorization 这个专属口袋里)
    const authHeader = req.headers['authorization'];
    // 标准格式是 "Bearer <token>"，所以我们用空格拆分，取后面的 token 部分
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).send({ code: 401, message: '没带通行证，请先登录！' });
    }

    // 2. 用我们的密钥来验一验这个证是不是真的，有没有过期
    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).send({ code: 403, message: '通行证已过期或无效，请重新登录！' });
        }

        try {
            const [rows] = await db.query(
                'SELECT id, username, nickname, role, status FROM users WHERE id = ? LIMIT 1',
                [user.id]
            );

            if (rows.length === 0) {
                return res.status(401).send({ code: 401, message: '账号不存在，请重新登录' });
            }

            const currentUser = rows[0];
            if (Number(currentUser.status) === 0) {
                return res.status(403).send({ code: 403, message: '账号已被封禁，请联系管理员' });
            }

            // 3. 通行证没问题！把最新的用户信息挂载到 req 上，方便后面用
            req.user = {
                ...user,
                ...currentUser
            };

            // 4. 关键动作：放行！允许程序继续往下走，去执行真正的业务逻辑
            next();
        } catch (dbError) {
            console.error('验证登录态时发生错误:', dbError);
            return res.status(500).send({ code: 500, message: '服务器内部错误' });
        }
    });
};

const isAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (Number(req.user?.role) !== 1) {
            return res.status(403).send({ code: 403, message: '仅管理员可访问该资源' });
        }

        next();
    });
};

module.exports = authenticateToken;
module.exports.isAdmin = isAdmin;