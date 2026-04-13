module.exports = {
    apps: [
        {
            name: 'practicum',
            port: '3003',
            exec_mode: 'fork',
            script: './.output/server/index.mjs'
        }
    ]
}