function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('密码长度至少8个字符');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字');
  }
  
  return errors.length === 0 ? null : errors.join('，');
}

function validateUsername(username) {
  const errors = [];
  
  if (!username || username.length < 3) {
    errors.push('用户名至少3个字符');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('用户名只能包含字母、数字和下划线');
  }
  
  return errors.length === 0 ? null : errors.join('，');
}

module.exports = { validatePassword, validateUsername };