USE campus_info_db;

-- ----------------------------
-- 新增: 帖子点赞表
-- ----------------------------
DROP TABLE IF EXISTS `post_likes`;
CREATE TABLE `post_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '点赞者的ID',
  `post_id` INT NOT NULL COMMENT '被点赞帖子的ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_like` (`user_id`, `post_id`) -- 防止同一个人对同一篇帖子无限点赞
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子点赞记录';