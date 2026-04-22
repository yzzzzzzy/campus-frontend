USE campus_info_db;

-- ----------------------------
-- 新增: 实习与就业表
-- ----------------------------
DROP TABLE IF EXISTS `careers`;
CREATE TABLE `careers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company` VARCHAR(100) NOT NULL COMMENT '公司/企业名称',
  `title` VARCHAR(100) NOT NULL COMMENT '标题(岗位名称或面经标题)',
  `type` VARCHAR(50) NOT NULL COMMENT '分类: 校招内推, 实习机会, 面试经验',
  `content` TEXT NOT NULL COMMENT '详细内容',
  `tags` VARCHAR(255) DEFAULT NULL COMMENT '福利或高频词标签(逗号分隔)',
  `contact` VARCHAR(100) DEFAULT NULL COMMENT '投递邮箱或链接',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实习与就业板块';

-- ----------------------------
-- 插入测试数据
-- ----------------------------
INSERT INTO `careers` (`company`, `title`, `type`, `content`, `tags`, `contact`) VALUES 
('字节跳动', '前端开发实习生（可转正）- 抖音电商', '实习机会', '主要负责抖音电商C端核心业务的开发。要求熟悉 HTML/CSS/JS，了解 React 或 Vue 框架。团队氛围好，有大佬带。', '免费三餐,租房补贴,弹性工作', 'hr_intern@bytedance.com'),
('腾讯', '2026届校招内推 - 微信事业群 (WXG)', '校招内推', '微信团队直招，全岗位可推（开发、产品、设计、运营）。使用我的内推码投递，简历免筛选直达笔试/面试！', '大牛云集,海量并发,顶薪', '内推码: TX2026WX'),
('美团', '美团后端开发（Java）一二面+HR面 详细面经', '面试经验', '昨天刚拿到 Offer 来还愿！一面主要问了 Java 基础和并发编程，手撕了一道动态规划；二面重点问了 MySQL 索引优化和 Redis 缓存穿透。整体感觉面试官体验很好。', 'Java,后端面经,已拿Offer', '无需投递');