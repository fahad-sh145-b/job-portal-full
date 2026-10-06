const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user');
const Company = require('./models/company');
const Job = require('./models/job');
const Application = require('./models/application');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const apps = await Application.find({ job: { $in: ['6ac0d02dc7b52f48c6d73bf1', '6ac4cfade1dca0fe3368141c'] } }).populate('applicant', 'name email').populate('job', 'title recruiter');
  apps.forEach(a => {
    console.log('App ID:', a._id, '| Job ID:', a.job._id, '| Recruiter ID:', a.job.recruiter, '| Applicant:', a.applicant ? a.applicant.email : 'N/A');
  });
  mongoose.disconnect();
});
