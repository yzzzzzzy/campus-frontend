const jwt = require('jsonwebtoken');
require('dotenv').config();

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
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send({ code: 403, message: '通行证已过期或无效，请重新登录！' });
        }

        // 3. 通行证没问题！把解析出来的用户信息（比如用户ID）挂载到 req 上，方便后面用
        req.user = user;

        // 4. 关键动作：放行！允许程序继续往下走，去执行真正的发帖逻辑
        next();
    });
};

module.exports = authenticateToken;