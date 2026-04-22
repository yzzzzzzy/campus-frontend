USE campus_info_db;

-- ----------------------------
-- 新增: 万能收藏表
-- ----------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '收藏者的ID',
  `target_id` INT NOT NULL COMMENT '被收藏内容的ID',
  `target_type` VARCHAR(50) DEFAULT 'post' COMMENT '内容类型(如: post, study, career)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_favorite` (`user_id`, `target_id`, `target_type`) -- 防止重复收藏
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收藏表';