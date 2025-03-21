const { hashPassword } = require('../utils/passwordUtils');

async function hashAndPrint() {
  const password = 'admin123';
  const hashedPassword = await hashPassword(password);
  console.log(`Original password: ${password}`);
  console.log(`Hashed password: ${hashedPassword}`);
}

hashAndPrint();
