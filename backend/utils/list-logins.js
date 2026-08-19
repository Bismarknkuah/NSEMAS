const { collection } = require('../db');
const users = collection('users');
const schools = collection('schools');

const bySchool = {};
schools.all().forEach((s) => (bySchool[s.id] = s.name));

console.log('username'.padEnd(28), 'role'.padEnd(22), 'scope');
console.log('-'.repeat(90));
users.all().forEach((u) => {
  const scopeParts = [];
  if (u.scope?.region) scopeParts.push(`region:${u.scope.region}`);
  if (u.scope?.district) scopeParts.push(`district:${u.scope.district}`);
  if (u.scope?.schoolId) scopeParts.push(`school:${bySchool[u.scope.schoolId] || u.scope.schoolId}`);
  console.log(u.username.padEnd(28), u.role.padEnd(22), scopeParts.join(' '));
});
console.log('\nAll passwords are password123 except "admin" which is admin123');
