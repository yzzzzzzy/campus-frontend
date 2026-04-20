const mysql = require('mysql2');
require('dotenv').config(); // 读取 .env 文件里的密码配置

// 创建数据库连接池（连接池比普通的单次连接更稳定，这也是企业级开发的标准写法）
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 将连接池转换为支持 Promise 的形式（这样我们后面写代码就可以用高级的 async/await 语法，不用写成一团乱麻）
const promisePool = pool.promise();

// 启动时测试一下能不能连上
promisePool.getConnection()
    .then(connection => {
        console.log('✅ 成功连接到 MySQL 数据库 [campus_info_db]！');
        connection.release(); // 测试完把连接放回池子里
    })
    .catch(err => {
        console.error('❌ 数据库连接失败，请检查 .env 文件里的密码对不对！错误信息：', err);
    });

// 把这个连接池导出去，让别人可以用
module.exports = promisePool;