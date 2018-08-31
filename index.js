const {
  config
} = require('dotenv');
const {
  randomBytes
} = require('crypto');
const {
  EventEmitter
} = require('events');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const id = () => randomBytes(5).toString('hex');

config();

const express = require('express');
const app = express();

const emitter = new EventEmitter();

const db = {
  sessions: {},
};

app.set('x-powered-by', false);
app.set('view engine', 'pug');

app.use(cookieParser());

app.use('/public', express.static('public'));

const startNewSession = () => {
  const sessid = id();
  db.sessions[sessid] = {
    id: sessid,
    started_at: new Date(),
    clicks: 0,
  };

  return db.sessions[sessid];
}

app.get('/', (req, res) => {
  const clicks = req.cookies.sessid && db.sessions[req.cookies.sessid] ?
    db.sessions[req.cookies.sessid].clicks :
    0;

  if (!req.cookies.sessid || !db.sessions[req.cookies.sessid]) {
    const session = startNewSession();
    res.cookie('sessid', session.id);
  }

  res.render('index', {
    clicks,
    script: 'buttonClick',
  });
});

app.get('/view/:sessid', (req, res) => {
  if (!db.sessions[req.params.sessid]) {
    res.sendStatus(404);
    return;
  }

  res.render('index', {
    clicks: db.sessions[req.params.sessid],
    script: 'event',
  });
});

app.get('/session', (req, res) => {
  if (
    req.cookies.sessid &&
    db.sessions[req.cookies.sessid]
  ) {
    const session = db.sessions[req.cookies.sessid];
    res.json({
      id: session.id,
      clicks: session.clicks,
      started_at: session.started_at,
    });
    return;
  }

  res.json(
    startNewSession(),
  );
});

app.get('/sessions/:sessid', (req, res) => {
  const sessid = req.params.sessid;

  if (!db.sessions[sessid]) {
    res.sendStatus(404);
    return;
  }

  res.json(db.sessions[sessid]);
});

app.get('/sessions/:sessid/stream', (req, res) => {
  req.socket.setTimeout(0);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
  });
  res.write('\n');

  const handleNewClick = (sessid) => ({
    session,
    clicks
  }) => {
    if (session !== sessid) {
      return;
    }
    res.write(`data: ${clicks}\n\n`);
  };

  emitter.on('click:new', handleNewClick(req.params.sessid));

  req.on('close', () => {
    emitter.removeListener('click:new', handleNewClick(req.params.sessid));
  });
});

app.put('/sessions/:sessid/click', (req, res) => {
  if (!db.sessions[req.params.sessid]) {
    res.sendStatus(404);
    return;
  }
  const clicks = db.sessions[req.params.sessid].clicks =
    db.sessions[req.params.sessid].clicks + 1;
  db.sessions[req.params.sessid].lastClickedAt = new Date();
  res.json({
    clicks,
  });

  emitter.emit('click:new', {
    session: req.params.sessid,
    clicks
  });
});

app.listen(process.env.PORT, () => {
  console.log('server listens on :%d', process.env.PORT);
});
