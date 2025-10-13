import bcrypt from 'bcryptjs';

// ここにハッシュ化したいパスワードを入力
const password = 'admin';
const saltRounds = 10;

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('Hashed password:', hash);
  })
  .catch(err => {
    console.error('Error hashing password:', err);
  });
