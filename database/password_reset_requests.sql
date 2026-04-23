USE campus_info_db;

-- ----------------------------
-- 忘记密码留言表（登录页提交，管理员后台处理）
-- ----------------------------
CREATE TABLE IF NOT EXISTS `password_reset_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL COMMENT '用户账号/学号',
  `message` VARCHAR(500) NOT NULL COMMENT '用户留言内容',
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending|processed',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `processed_at` DATETIME NULL,
  `processed_by` INT NULL COMMENT '处理该请求的管理员ID',
  `admin_note` VARCHAR(255) NULL COMMENT '管理员处理备注',
  INDEX `idx_reset_requests_status` (`status`),
  INDEX `idx_reset_requests_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='找回密码留言表';
