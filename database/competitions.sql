USE campus_info_db;

-- ----------------------------
-- 新增: 竞赛组队表
-- ----------------------------
DROP TABLE IF EXISTS `competitions`;
CREATE TABLE `competitions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `comp_name` VARCHAR(100) NOT NULL COMMENT '竞赛名称',
  `title` VARCHAR(100) NOT NULL COMMENT '招募帖标题',
  `description` TEXT NOT NULL COMMENT '项目简介及招募要求',
  `required_skills` VARCHAR(255) DEFAULT NULL COMMENT '所需技能标签(逗号分隔)',
  `status` VARCHAR(20) DEFAULT '招募中' COMMENT '状态: 招募中, 已满员',
  `contact_info` VARCHAR(100) DEFAULT NULL COMMENT '联系方式(微信号/手机号等)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='竞赛组队大厅';

-- ----------------------------
-- 插入测试数据
-- ----------------------------
INSERT INTO `competitions` (`comp_name`, `title`, `description`, `required_skills`, `status`, `contact_info`) VALUES 
('全国大学生数学建模竞赛', '数模国赛保二争一，急寻编程大佬！', '队伍已有数学系大牛负责建模，本人负责论文排版。现急缺一名熟练掌握 Python 或 MATLAB 的同学负责代码实现和数据处理。', 'Python,MATLAB,数据分析', '招募中', '微信号: math_god123'),
('“互联网+”大学生创新创业大赛', '校园二手交易平台项目，缺前端开发', '项目企划书已完成，指导老师已定。目前后端用 Node.js 已经跑通，需要一名会 Vue 或 React 的前端同学一起做界面。', 'Vue3,前端开发,UI设计', '招募中', 'QQ: 987654321'),
('蓝桥杯全国软件和信息技术专业人才大赛', '蓝桥杯C/C++组赛前组队刷题互助', '想建个群大家一起监督刷 LeetCode 和历年真题，目前群里已有5人，纯学术交流，不闲聊。', 'C++,算法,数据结构', '已满员', '暂不公开');

ALTER TABLE competitions ADD COLUMN user_id INT;
