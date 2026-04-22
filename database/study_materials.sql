USE campus_info_db;

-- ----------------------------
-- 新增: 升学考公资料表
-- ----------------------------
DROP TABLE IF EXISTS `study_materials`;
CREATE TABLE `study_materials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL COMMENT '资料标题',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '资料简介',
  `category` VARCHAR(50) NOT NULL COMMENT '资料分类(如: 考研, 考公, 四六级)',
  `file_type` VARCHAR(20) DEFAULT 'PDF' COMMENT '文件类型(PDF, Word, 视频等)',
  `download_url` VARCHAR(255) NOT NULL COMMENT '下载或预览链接',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='升学考公资料库';

-- ----------------------------
-- 插入测试数据
-- ----------------------------
INSERT INTO `study_materials` (`title`, `description`, `category`, `file_type`, `download_url`) VALUES 
('2025年考研数学一历年真题及解析', '包含2010-2024年完整数学一真题，详细步骤解析，高清PDF版。', '考研资料', 'PDF', 'https://pan.baidu.com'),
('国家公务员考试行测申论突破指南', '名师内部讲义，涵盖行测秒杀技巧与申论高分模板。', '考公资料', 'PDF', 'https://pan.baidu.com'),
('大学英语六级词汇高频突破视频课', '按照词频排序，重点突破核心词汇，内附配套练习册。', '四六级', '视频', 'https://www.bilibili.com');