const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user');
const Company = require('./models/company');
const Job = require('./models/job');
const Application = require('./models/application');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const kingUser = await User.findOne({ email: 'shaikhshahnaz1246@gmail.com' });
  const jobs = await Job.find({ recruiter: kingUser._id }).select('_id');
  const jobIds = jobs.map(j => j._id);
  const apps = await Application.find({ job: { $in: jobIds } }).populate('applicant', 'name email').populate('job', 'title');
  console.log('TOTAL_APPS_FOR_KING:', apps.length);
  apps.forEach(a => console.log('- Applicant:', a.applicant ? `${a.applicant.name} (${a.applicant.email})` : 'N/A', '| Job:', a.job ? a.job.title : 'N/A', '| Status:', a.status));
  
  const allApps = await Application.find().populate('applicant', 'name email').populate('job', 'title');
  console.log('\nALL_APPS_IN_DATABASE:', allApps.length);
  allApps.forEach(a => console.log('- Applicant:', a.applicant ? `${a.applicant.name} (${a.applicant.email})` : 'N/A', '| Job:', a.job ? a.job.title : 'N/A'));
  
  mongoose.disconnect();
});
