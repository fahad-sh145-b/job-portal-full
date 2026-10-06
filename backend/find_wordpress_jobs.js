const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user');
const Company = require('./models/company');
const Job = require('./models/job');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const jobs = await Job.find({ title: { $regex: /wordpress/i } }).populate('recruiter', 'name email').populate('company', 'name');
  console.log('WORDPRESS_JOBS_FOUND:', jobs.length);
  jobs.forEach(j => {
    console.log(`ID: ${j._id} | Title: ${j.title} | Recruiter Name: ${j.recruiter?.name} (${j.recruiter?.email}) | Recruiter ID: ${j.recruiter?._id}`);
  });
  
  const kingUser = await User.findOne({ email: 'shaikhshahnaz1246@gmail.com' });
  console.log('KING_USER_ID:', kingUser._id);
  
  mongoose.disconnect();
});
