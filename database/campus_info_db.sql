/*
 Navicat Premium Dump SQL

 Source Server         : MySQL
 Source Server Type    : MySQL
 Source Server Version : 80034 (8.0.34)
 Source Host           : localhost:3306
 Source Schema         : campus_info_db

 Target Server Type    : MySQL
 Target Server Version : 80034 (8.0.34)
 File Encoding         : 65001

 Date: 24/04/2026 16:29:39
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for careers
-- ----------------------------
DROP TABLE IF EXISTS `careers`;
CREATE TABLE `careers`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `company` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '公司/企业名称',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标题(岗位名称或面经标题)',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类: 校招内推, 实习机会, 面试经验',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '详细内容',
  `tags` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '福利或高频词标签(逗号分隔)',
  `contact` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '投递邮箱或链接',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '实习与就业板块' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of careers
-- ----------------------------
INSERT INTO `careers` VALUES (1, '字节跳动', '前端开发实习生（可转正）- 抖音电商', '实习机会', '主要负责抖音电商C端核心业务的开发。要求熟悉 HTML/CSS/JS，了解 React 或 Vue 框架。团队氛围好，有大佬带。', '免费三餐,租房补贴,弹性工作', 'hr_intern@bytedance.com', '2026-04-18 11:23:44', NULL);
INSERT INTO `careers` VALUES (2, '腾讯', '2026届校招内推 - 微信事业群 (WXG)', '校招内推', '微信团队直招，全岗位可推（开发、产品、设计、运营）。使用我的内推码投递，简历免筛选直达笔试/面试！', '大牛云集,海量并发,顶薪', '内推码: TX2026WX', '2026-04-18 11:23:44', NULL);
INSERT INTO `careers` VALUES (3, '美团', '美团后端开发（Java）一二面+HR面 详细面经', '面试经验', '昨天刚拿到 Offer 来还愿！一面主要问了 Java 基础和并发编程，手撕了一道动态规划；二面重点问了 MySQL 索引优化和 Redis 缓存穿透。整体感觉面试官体验很好。', 'Java,后端面经,已拿Offer', '无需投递', '2026-04-18 11:23:44', NULL);
INSERT INTO `careers` VALUES (4, 'test', 'test', '面试经验', 'test', NULL, '无需投递', '2026-04-23 16:46:44', NULL);

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '板块名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '板块描述',
  `sort_order` int NULL DEFAULT 0 COMMENT '显示排序(数字越小越靠前)',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统板块分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (1, '升学考公', '考研院校资讯、历年真题、公务员招录、备考经验', 1, '2026-04-16 14:46:36');
INSERT INTO `categories` VALUES (2, '竞赛大创', '数学建模、蓝桥杯等赛事日历，跨专业寻找神仙队友', 2, '2026-04-16 14:46:36');
INSERT INTO `categories` VALUES (3, '实习就业', '校招内推、大厂实习、各岗位真实面经分享', 3, '2026-04-16 14:46:36');
INSERT INTO `categories` VALUES (4, '二手交易', '校园跳蚤市场，闲置书籍、数码产品转让', 4, '2026-04-16 14:46:36');
INSERT INTO `categories` VALUES (5, '失物招领', '校园寻物启事与失物招领', 5, '2026-04-16 14:46:36');
INSERT INTO `categories` VALUES (6, '互助问答', '选课建议、校园生活疑难杂症求助', 6, '2026-04-16 14:46:36');

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL COMMENT '关联的信息ID',
  `user_id` int NOT NULL COMMENT '评论者ID',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '评论内容',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '互动评论表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comments
-- ----------------------------
INSERT INTO `comments` VALUES (1, 2, 2, '降价啦，只要150！', '2026-04-17 16:25:08');

-- ----------------------------
-- Table structure for competitions
-- ----------------------------
DROP TABLE IF EXISTS `competitions`;
CREATE TABLE `competitions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `comp_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '竞赛名称',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '招募帖标题',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '项目简介及招募要求',
  `required_skills` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '所需技能标签(逗号分隔)',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '招募中' COMMENT '状态: 招募中, 已满员',
  `contact_info` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '联系方式(微信号/手机号等)',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '竞赛组队大厅' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of competitions
-- ----------------------------
INSERT INTO `competitions` VALUES (1, '全国大学生数学建模竞赛', '数模国赛保二争一，急寻编程大佬！', '队伍已有数学系大牛负责建模，本人负责论文排版。现急缺一名熟练掌握 Python 或 MATLAB 的同学负责代码实现和数据处理。', 'Python,MATLAB,数据分析', '招募中', '微信号: math_god123', '2026-04-18 11:19:08', NULL);
INSERT INTO `competitions` VALUES (2, '“互联网+”大学生创新创业大赛', '校园二手交易平台项目，缺前端开发', '项目企划书已完成，指导老师已定。目前后端用 Node.js 已经跑通，需要一名会 Vue 或 React 的前端同学一起做界面。', 'Vue3,前端开发,UI设计', '招募中', 'QQ: 987654321', '2026-04-18 11:19:08', NULL);
INSERT INTO `competitions` VALUES (3, '蓝桥杯全国软件和信息技术专业人才大赛', '蓝桥杯C/C++组赛前组队刷题互助', '想建个群大家一起监督刷 LeetCode 和历年真题，目前群里已有5人，纯学术交流，不闲聊。', 'C++,算法,数据结构', '已满员', '暂不公开', '2026-04-18 11:19:08', NULL);
INSERT INTO `competitions` VALUES (4, '蓝桥杯', '冲冲冲', 'test', NULL, '招募中', NULL, '2026-04-22 15:36:01', NULL);

-- ----------------------------
-- Table structure for favorites
-- ----------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '收藏者的ID',
  `target_id` int NOT NULL COMMENT '被收藏内容的ID',
  `target_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'post' COMMENT '内容类型(如: post, study, career)',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_favorite`(`user_id` ASC, `target_id` ASC, `target_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户收藏表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of favorites
-- ----------------------------

-- ----------------------------
-- Table structure for password_reset_requests
-- ----------------------------
DROP TABLE IF EXISTS `password_reset_requests`;
CREATE TABLE `password_reset_requests`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户账号/学号',
  `message` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户留言内容',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT 'pending|processed',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` datetime NULL DEFAULT NULL,
  `processed_by` int NULL DEFAULT NULL COMMENT '处理该请求的管理员ID',
  `admin_note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '管理员处理备注',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_reset_requests_status`(`status` ASC) USING BTREE,
  INDEX `idx_reset_requests_username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '找回密码留言表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of password_reset_requests
-- ----------------------------
INSERT INTO `password_reset_requests` VALUES (1, '999', '账号忘记密码请管理员重置', 'processed', '2026-04-23 14:56:02', '2026-04-23 15:02:16', 4, '管理员已重置密码为默认值 123456');
INSERT INTO `password_reset_requests` VALUES (2, '999', '111111111', 'pending', '2026-04-23 15:12:13', NULL, NULL, NULL);
INSERT INTO `password_reset_requests` VALUES (3, '999', '发顺丰算法色法色法是发', 'pending', '2026-04-23 15:12:24', NULL, NULL, NULL);
INSERT INTO `password_reset_requests` VALUES (4, '999', '1211111111', 'pending', '2026-04-23 15:12:35', NULL, NULL, NULL);
INSERT INTO `password_reset_requests` VALUES (5, '2022204', 'forget pwd test 111', 'pending', '2026-04-23 15:16:16', NULL, NULL, NULL);
INSERT INTO `password_reset_requests` VALUES (6, '999', '1111111', 'pending', '2026-04-23 15:17:01', NULL, NULL, NULL);

-- ----------------------------
-- Table structure for post_likes
-- ----------------------------
DROP TABLE IF EXISTS `post_likes`;
CREATE TABLE `post_likes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '点赞者的ID',
  `post_id` int NOT NULL COMMENT '被点赞帖子的ID',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_like`(`user_id` ASC, `post_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子点赞记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of post_likes
-- ----------------------------

-- ----------------------------
-- Table structure for posts
-- ----------------------------
DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标题',
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '正文内容',
  `user_id` int NOT NULL COMMENT '发布者ID',
  `category_id` int NOT NULL COMMENT '所属板块ID',
  `tags` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '自定义标签(如: 面经, 寻物, 高教社杯)',
  `attachment_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '附件/文件链接(用于分享历年真题/复习资料)',
  `status` tinyint NULL DEFAULT 0 COMMENT '状态: 0-有效/寻找中, 1-已完结/已找到队友/已出售',
  `view_count` int NULL DEFAULT 0 COMMENT '浏览量',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '综合信息发布表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of posts
-- ----------------------------
INSERT INTO `posts` VALUES (2, '出人体工学椅', '出九成新人体工学椅', 2, 4, '出二手', NULL, 0, 0, '2026-04-17 15:43:17', '2026-04-17 15:43:17');
INSERT INTO `posts` VALUES (3, 'test1', 'test', 2, 1, NULL, NULL, 0, 0, '2026-04-21 21:19:00', '2026-04-21 21:19:00');
INSERT INTO `posts` VALUES (4, 'test2', 'test', 2, 2, NULL, NULL, 0, 0, '2026-04-21 21:19:16', '2026-04-21 21:19:16');
INSERT INTO `posts` VALUES (5, 'test3', 'test', 2, 3, NULL, NULL, 0, 0, '2026-04-21 21:19:31', '2026-04-21 21:19:31');
INSERT INTO `posts` VALUES (6, 'test4', 'test', 2, 4, NULL, NULL, 0, 0, '2026-04-21 21:19:40', '2026-04-21 21:19:40');
INSERT INTO `posts` VALUES (7, 'test5', 'test', 2, 5, NULL, NULL, 0, 0, '2026-04-21 21:19:49', '2026-04-21 21:19:49');
INSERT INTO `posts` VALUES (8, 'test6', 'test', 2, 6, NULL, NULL, 0, 0, '2026-04-21 21:19:58', '2026-04-21 21:19:58');
INSERT INTO `posts` VALUES (9, 'test7', 'test', 2, 1, NULL, NULL, 0, 0, '2026-04-21 21:20:10', '2026-04-21 21:20:10');
INSERT INTO `posts` VALUES (10, 'test8', 'test', 2, 3, NULL, NULL, 0, 0, '2026-04-21 21:20:22', '2026-04-21 21:20:22');
INSERT INTO `posts` VALUES (11, 'test9', 'test', 2, 4, NULL, NULL, 0, 0, '2026-04-21 21:20:31', '2026-04-21 21:20:31');

-- ----------------------------
-- Table structure for resources
-- ----------------------------
DROP TABLE IF EXISTS `resources`;
CREATE TABLE `resources`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '资源标题',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '资源简介',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '资源分类(如: 编程开发, 创意设计, 办公效率)',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '资源链接(网盘链接或B站视频链接)',
  `cover` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封面图链接(可选)',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '个人提升资源库' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of resources
-- ----------------------------
INSERT INTO `resources` VALUES (1, 'Vue3 + Node.js 全栈开发零基础教程', '百万播放神级教程，手把手教你做全栈项目，适合准备做毕设的同学。', '编程开发', 'https://www.bilibili.com', NULL, '2026-04-18 10:20:29');
INSERT INTO `resources` VALUES (2, 'PR视频剪辑从入门到精通', '最新版 Premiere Pro 教学，附带超多练习素材，掌握自媒体流量密码。', '创意设计', 'https://www.bilibili.com', NULL, '2026-04-18 10:20:29');
INSERT INTO `resources` VALUES (3, 'Excel 职场进阶自动化指南', '告别加班！教你用数据透视表和简单函数提升10倍办公效率。', '办公效率', 'https://pan.baidu.com', NULL, '2026-04-18 10:20:29');
INSERT INTO `resources` VALUES (4, 'Java', 'test', '编程开发', 'https://www.bilibili.com/', NULL, '2026-04-24 10:11:27');

-- ----------------------------
-- Table structure for study_materials
-- ----------------------------
DROP TABLE IF EXISTS `study_materials`;
CREATE TABLE `study_materials`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '资料标题',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '资料简介',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '资料分类(如: 考研, 考公, 四六级)',
  `file_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'PDF' COMMENT '文件类型(PDF, Word, 视频等)',
  `download_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '下载或预览链接',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '升学考公资料库' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of study_materials
-- ----------------------------
INSERT INTO `study_materials` VALUES (1, '2025年考研数学一历年真题及解析', '包含2010-2024年完整数学一真题，详细步骤解析，高清PDF版。', '考研资料', 'PDF', 'https://pan.baidu.com', '2026-04-18 11:10:25');
INSERT INTO `study_materials` VALUES (2, '国家公务员考试行测申论突破指南', '名师内部讲义，涵盖行测秒杀技巧与申论高分模板。', '考公资料', 'PDF', 'https://pan.baidu.com', '2026-04-18 11:10:25');
INSERT INTO `study_materials` VALUES (3, '大学英语六级词汇高频突破视频课', '按照词频排序，重点突破核心词汇，内附配套练习册。', '四六级', '视频', 'https://www.bilibili.com', '2026-04-18 11:10:25');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录账号(学号)',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '昵称',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像链接',
  `major` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '所在专业',
  `skills` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '个人技能(如: Vue, Python, 视频剪辑)',
  `role` tinyint NULL DEFAULT 0 COMMENT '角色: 0-普通学生, 1-管理员 (对应思维导图的后台管理)',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '账号状态：1正常，0封禁',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (2, '999', '$2b$10$zzCMOFkhAsMxQrQSakMzXe6hgoiv/jISBbxduSo8jk3pYZC6TR7WO', '测试人员', 'http://localhost:3000/uploads/1776762859139-99091302.jpg', NULL, NULL, 0, '2026-04-17 15:10:19', 1);
INSERT INTO `users` VALUES (4, '2022204', '$2b$10$FpAKJz9V7qGJTngvpsj/GOT9FPOjonNj6K4mhpvehA5ITEhkEN6W.', 'admin', NULL, NULL, NULL, 1, '2026-04-22 17:19:21', 1);
INSERT INTO `users` VALUES (5, '2022204664', '$2b$10$J5zb2gaaf/P0RrxZuut56Ojk7fqzDsoIx6fJksfHmqFS7LOdTboUi', 'yzy', NULL, NULL, NULL, 1, '2026-04-24 15:17:32', 1);

SET FOREIGN_KEY_CHECKS = 1;
