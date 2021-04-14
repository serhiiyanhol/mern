const express = require('express');
const config = require('config');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const log4js = require('log4js');

log4js.configure({
  appenders: {
    'out': {
      type: 'stdout',
    },
  },
  categories: { default: { appenders: ['out'], level: 'info' } }
});
const logger = log4js.getLogger();

const app = express();

const allowedOrigins = [config.get('baseUrl')];
const corsOptionsDelegate = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};
app.use(cors(corsOptionsDelegate));

app.use(express.json({ extended: true }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/link', require('./routes/link.routes'));
app.use('/t', require('./routes/redirect.routes'));

if (process.env.NODE_ENV === 'production') {
  app.use('/', express.static(path.join(__dirname, 'client', 'build')));

  app.get('*', ((req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'))
  }));
}

const PORT = config.get('port') || 5000;

async function start() {
  try {
    await mongoose.connect(config.get('mongoURI'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    app.listen(PORT, () => logger.info(`App has been started on port ${PORT}`));
  } catch (e) {
    logger.error('Server ERROR:', e.message);
    process.exit(1);
  }
}

start();
