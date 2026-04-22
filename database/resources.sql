USE campus_info_db;

-- ----------------------------
-- 新增: 个人提升资源表
-- ----------------------------
DROP TABLE IF EXISTS `resources`;
CREATE TABLE `resources` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL COMMENT '资源标题',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '资源简介',
  `type` VARCHAR(50) NOT NULL COMMENT '资源分类(如: 编程开发, 创意设计, 办公效率)',
  `url` VARCHAR(255) NOT NULL COMMENT '资源链接(网盘链接或B站视频链接)',
  `cover` VARCHAR(255) DEFAULT NULL COMMENT '封面图链接(可选)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='个人提升资源库';

-- ----------------------------
-- 插入3条初始测试数据，方便一会儿我们前端有东西可以显示
-- ----------------------------
INSERT INTO `resources` (`title`, `description`, `type`, `url`) VALUES 
('Vue3 + Node.js 全栈开发零基础教程', '百万播放神级教程，手把手教你做全栈项目，适合准备做毕设的同学。', '编程开发', 'https://www.bilibili.com'),
('PR视频剪辑从入门到精通', '最新版 Premiere Pro 教学，附带超多练习素材，掌握自媒体流量密码。', '创意设计', 'https://www.bilibili.com'),
('Excel 职场进阶自动化指南', '告别加班！教你用数据透视表和简单函数提升10倍办公效率。', '办公效率', 'https://pan.baidu.com');