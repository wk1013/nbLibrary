module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
  },
  weapp: {},
  h5: {
    publicPath: '/',
    devServer: {
      port: '8000',
      host: '192.168.22.14',
      disableHostCheck: true,
    },
  }
}
