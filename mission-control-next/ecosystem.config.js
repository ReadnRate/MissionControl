module.exports = {
  apps: [{
    name: 'mission-backend',
    cwd: '/data/.openclaw/workspace/mission-control-next',
    script: 'node',
    args: 'node_modules/next/dist/bin/next start -p 8080',
    interpreter: 'none',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    max_memory_restart: '500M'
  }]
};
