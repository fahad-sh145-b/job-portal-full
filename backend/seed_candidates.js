const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user');

const baseEmail = 'shaikhbashiruddinmohdhajishaik';
const domain = 'gmail.com';
const defaultPassword = 'password123';

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const createdUsers = [];
  for (let i = 1; i <= 10; i++) {
    const email = `${baseEmail}+candidate${i}@${domain}`;
    const name = `Candidate ${i}`;
    
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        password: defaultPassword,
        role: 'jobseeker',
        phone: `91987654320${i % 10}`
      });
      await user.save();
    }
    createdUsers.push({ id: i, name, email, password: defaultPassword });
  }
  console.log('10_CANDIDATES_CREATED_SUCCESSFULLY');
  console.log(JSON.stringify(createdUsers, null, 2));
  mongoose.disconnect();
}).catch(err => {
  console.error('Error seeding candidates:', err);
  mongoose.disconnect();
});
